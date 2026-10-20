import express from 'express';
import { submitFeedback, getFeedback } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateFeedback } from '../middleware/validate.js';

const router = express.Router();

// POST /api/feedback — public (customer submits after service)
router.post('/', validateFeedback, submitFeedback);

// GET /api/feedback — admin/super-admin only
router.get('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), getFeedback);

export default router;
