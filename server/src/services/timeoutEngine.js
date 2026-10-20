import Token from '../models/Token.js';
import Counter from '../models/Counter.js';
import QueueEvent from '../models/QueueEvent.js';
import { emitQueueUpdate } from '../sockets/socketManager.js';

let intervalHandle = null;

/**
 * Check and process tokens that have exceeded their no-show / auto-skip timeout.
 * - Inspects calledAt timestamp vs organization/department noShowTimeoutSeconds (default 300s).
 * - Transitions expired tokens atomically to SKIPPED.
 * - Frees the counter and emits real-time socket events.
 */
export const processExpiredTokens = async () => {
  try {
    const calledTokens = await Token.find({
      status: 'CALLED',
      calledAt: { $ne: null }
    })
      .populate('organizationId', 'settings')
      .populate('departmentId', 'noShowTimeoutSeconds');

    const now = Date.now();

    for (const token of calledTokens) {
      const orgTimeout = token.organizationId?.settings?.noShowTimeoutSeconds || 300;
      const deptTimeout = token.departmentId?.noShowTimeoutSeconds;
      const effectiveTimeoutSeconds = deptTimeout !== null && deptTimeout !== undefined ? deptTimeout : orgTimeout;

      const calledTimestamp = new Date(token.calledAt).getTime();
      const elapsedSeconds = (now - calledTimestamp) / 1000;

      if (elapsedSeconds >= effectiveTimeoutSeconds) {
        // Atomically update token status to SKIPPED
        const skippedToken = await Token.findOneAndUpdate(
          { _id: token._id, status: 'CALLED' },
          {
            status: 'SKIPPED',
            skippedAt: new Date()
          },
          { new: true }
        )
          .populate('organizationId', 'name')
          .populate('departmentId', 'name')
          .populate('serviceId', 'name prefix');

        if (skippedToken) {
          // Free assigned counter
          if (token.counterId) {
            await Counter.findByIdAndUpdate(token.counterId, {
              status: 'available',
              currentTokenId: null
            });
          }

          // Record QueueEvent
          await QueueEvent.create({
            organizationId: token.organizationId?._id || token.organizationId,
            departmentId: token.departmentId?._id || token.departmentId,
            serviceId: token.serviceId?._id || token.serviceId,
            tokenId: token._id,
            counterId: token.counterId || null,
            action: 'token_skipped',
            details: {
              reason: `Auto-skip timeout exceeded (${effectiveTimeoutSeconds}s)`,
              elapsedSeconds: Math.round(elapsedSeconds)
            }
          });

          // Broadcast real-time event to organization and department rooms
          emitQueueUpdate({
            organizationId: token.organizationId?._id || token.organizationId,
            departmentId: token.departmentId?._id || token.departmentId,
            eventName: 'token_skipped',
            payload: {
              token: skippedToken,
              reason: 'No-show auto-skip timeout'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('[Timeout Engine Error]', error.message);
  }
};

/**
 * Start the background timeout monitor polling every intervalMs (default 10s).
 */
export const startTimeoutMonitor = (intervalMs = 10000) => {
  if (intervalHandle) return;
  intervalHandle = setInterval(processExpiredTokens, intervalMs);
};

/**
 * Stop the background timeout monitor.
 */
export const stopTimeoutMonitor = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};
