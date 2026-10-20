import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics — aggregated metrics for today
router.get('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), getAnalytics);

export default router;
