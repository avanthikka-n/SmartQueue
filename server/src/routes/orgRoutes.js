import express from 'express';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
} from '../controllers/orgController.js';
import { protect, optionalProtect, authorize, requireOrgAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getOrganizations);
router.get('/:id', getOrganizationById);
router.post('/', protect, authorize('SUPER_ADMIN', 'ORGANIZATION_ADMIN'), createOrganization);
router.put('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), requireOrgAccess, updateOrganization);

export default router;
