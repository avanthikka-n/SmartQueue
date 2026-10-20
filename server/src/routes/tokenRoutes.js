import express from 'express';
import {
  generateToken,
  getTokenById,
  getQueue,
  callToken,
  recallToken,
  startService,
  completeService,
  skipToken,
  transferToken,
  getMyTokens,
  cancelToken
} from '../controllers/tokenController.js';
import { protect, optionalProtect, authorize } from '../middleware/authMiddleware.js';
import { validateGenerateToken } from '../middleware/validate.js';

const router = express.Router();

// Customer Tokens route (placed before /:id)
router.get('/my-tokens', protect, getMyTokens);

// Public routes (with optional auth for user linking & queue filtering)
router.post('/', optionalProtect, validateGenerateToken, generateToken);
router.get('/', optionalProtect, getQueue);
router.get('/queue', optionalProtect, getQueue);
router.post('/:id/cancel', optionalProtect, cancelToken);
router.get('/:id', getTokenById);

// Staff Protected routes
router.post('/:id/call', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), callToken);
router.post('/:id/recall', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), recallToken);
router.post('/:id/start', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), startService);
router.post('/:id/complete', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), completeService);
router.post('/:id/skip', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), skipToken);
router.post('/:id/transfer', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), transferToken);

export default router;
