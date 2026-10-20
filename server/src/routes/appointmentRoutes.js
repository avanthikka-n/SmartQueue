import express from 'express';
import {
  createAppointment,
  checkInAppointment,
  getAppointments
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createAppointment);
router.post('/:id/check-in', checkInAppointment);
router.get('/', protect, authorize('STAFF', 'ORGANIZATION_ADMIN', 'SUPER_ADMIN'), getAppointments);

export default router;
