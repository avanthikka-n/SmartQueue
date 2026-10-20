import express from 'express';
import {
  getServices,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController.js';
import { protect, optionalProtect, authorize, requireOrgAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getServices);
router.post('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), requireOrgAccess, createService);
router.put('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), updateService);
router.delete('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), deleteService);

export default router;
