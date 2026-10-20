import express from 'express';
import {
  getCounters,
  createCounter,
  updateCounter,
  deleteCounter
} from '../controllers/counterController.js';
import { protect, optionalProtect, authorize, requireOrgAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getCounters);
router.post('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), requireOrgAccess, createCounter);
router.put('/:id', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), updateCounter);
router.delete('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), deleteCounter);

export default router;
