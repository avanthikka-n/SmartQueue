import express from 'express';
import {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility
} from '../controllers/facilityController.js';
import { protect, optionalProtect, authorize, requireOrgAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalProtect, getFacilities);
router.get('/:id', optionalProtect, getFacilityById);
router.post('/', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), createFacility);
router.put('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), updateFacility);
router.delete('/:id', protect, authorize('ORGANIZATION_ADMIN', 'SUPER_ADMIN'), deleteFacility);

export default router;
