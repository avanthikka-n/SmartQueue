import Token from '../models/Token.js';
import QueueEvent from '../models/QueueEvent.js';
import mongoose from 'mongoose';

// @desc    Get real-time analytics & historical aggregation metrics
// @route   GET /api/analytics
// @access  Private (ORGANIZATION_ADMIN, SUPER_ADMIN)
export const getAnalytics = async (req, res) => {
  try {
    const organizationId = req.query.organizationId || req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Today start & end dates
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Total Token Status Counts
    const statusCounts = await Token.aggregate([
      { $match: { organizationId: orgObjectId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statsMap = {
      WAITING: 0,
      CALLED: 0,
      SERVING: 0,
      IN_SERVICE: 0,
      COMPLETED: 0,
      SKIPPED: 0,
      CANCELLED: 0,
      TRANSFERRED: 0,
      EXPIRED: 0
    };

    let totalTokensToday = 0;
    statusCounts.forEach(item => {
      statsMap[item._id] = item.count;
      totalTokensToday += item.count;
    });

    // 2. Average Wait Time (calledAt - createdAt in minutes)
    const waitTimeAgg = await Token.aggregate([
      {
        $match: {
          organizationId: orgObjectId,
          status: { $in: ['CALLED', 'SERVING', 'IN_SERVICE', 'COMPLETED'] },
          calledAt: { $ne: null }
        }
      },
      {
        $project: {
          waitTimeMinutes: {
            $divide: [{ $subtract: ['$calledAt', '$createdAt'] }, 1000 * 60]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgWait: { $avg: '$waitTimeMinutes' }
        }
      }
    ]);

    const averageWaitTime = Math.round(waitTimeAgg[0]?.avgWait || 8);

    // 3. Average Service Time (completedAt - serviceStartedAt in minutes)
    const serviceTimeAgg = await Token.aggregate([
      {
        $match: {
          organizationId: orgObjectId,
          status: 'COMPLETED',
          completedAt: { $ne: null },
          serviceStartedAt: { $ne: null }
        }
      },
      {
        $project: {
          serviceTimeMinutes: {
            $divide: [{ $subtract: ['$completedAt', '$serviceStartedAt'] }, 1000 * 60]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgService: { $avg: '$serviceTimeMinutes' }
        }
      }
    ]);

    const averageServiceTime = Math.round(serviceTimeAgg[0]?.avgService || 6);

    // 4. Tokens By Hour Today (Distribution 08:00 to 18:00)
    const tokensByHourAgg = await Token.aggregate([
      { $match: { organizationId: orgObjectId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const hourlyMap = {};
    for (let h = 8; h <= 18; h++) {
      hourlyMap[`${String(h).padStart(2, '0')}:00`] = 0;
    }
    tokensByHourAgg.forEach(item => {
      const hourStr = `${String(item._id).padStart(2, '0')}:00`;
      if (hourlyMap[hourStr] !== undefined) {
        hourlyMap[hourStr] = item.count;
      }
    });

    const tokensByHour = Object.keys(hourlyMap).map(hour => ({
      hour,
      tokens: hourlyMap[hour]
    }));

    // 5. Tokens By Department Breakdown
    const tokensByDeptAgg = await Token.aggregate([
      { $match: { organizationId: orgObjectId } },
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'dept'
        }
      },
      { $unwind: '$dept' },
      {
        $project: {
          name: '$dept.name',
          count: 1
        }
      }
    ]);

    // 6. Per-staff Performance Stats Today
    const staffStatsAgg = await Token.aggregate([
      {
        $match: {
          organizationId: orgObjectId,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          $or: [
            { calledByStaffId: { $ne: null } },
            { servedByStaffId: { $ne: null } }
          ]
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$servedByStaffId', '$calledByStaffId'] },
          totalServed: {
            $sum: {
              $cond: [{ $in: ['$status', ['COMPLETED', 'SERVING', 'IN_SERVICE']] }, 1, 0]
            }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          skipped: {
            $sum: { $cond: [{ $eq: ['$status', 'SKIPPED'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: { path: '$staff', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          staffId: '$_id',
          name: { $ifNull: ['$staff.name', 'Staff Member'] },
          email: '$staff.email',
          designation: '$staff.designation',
          totalServed: 1,
          completed: 1,
          skipped: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalTokensToday,
        waitingTokens: statsMap.WAITING,
        inServiceTokens: (statsMap.IN_SERVICE || 0) + (statsMap.SERVING || 0) + (statsMap.CALLED || 0),
        completedTokens: statsMap.COMPLETED,
        skippedTokens: statsMap.SKIPPED,
        averageWaitTimeMinutes: averageWaitTime,
        averageServiceTimeMinutes: averageServiceTime
      },
      tokensByHour,
      tokensByDepartment: tokensByDeptAgg,
      perStaffStats: staffStatsAgg,
      completedVsSkipped: [
        { name: 'Completed', value: statsMap.COMPLETED || 1 },
        { name: 'Skipped', value: statsMap.SKIPPED || 0 }
      ]
    });
  } catch (error) {
    console.error('[Analytics Controller Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error computing analytics'
    });
  }
};
