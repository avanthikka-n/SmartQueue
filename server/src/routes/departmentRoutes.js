import express from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentPause,
  deleteDepartment
} from '../controllers/departmentController.js';
import { protect, optionalProtect, authorize, requireOrgAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getDepartments);
router.post('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), requireOrgAccess, createDepartment);
router.put('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), updateDepartment);
router.patch('/:id/pause', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), toggleDepartmentPause);
router.delete('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), deleteDepartment);

export default router;
