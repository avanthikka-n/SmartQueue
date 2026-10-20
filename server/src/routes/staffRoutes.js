import express from 'express';
import {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
  resetStaffPassword
} from '../controllers/staffController.js';
import { protect, authorize, requireOrgAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), getStaff);
router.get('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), getStaffById);
router.post('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), requireOrgAccess, createStaff);
router.put('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), updateStaff);
router.patch('/:id/status', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), toggleStaffStatus);
router.put('/:id/reset-password', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), resetStaffPassword);
router.delete('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), deleteStaff);

export default router;
