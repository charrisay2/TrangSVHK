import express from 'express';
import { getEnrollments, updateEnrollment } from '../controllers/enrollmentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, authorize('ADMIN'), getEnrollments);

router.route('/:id')
  .put(protect, authorize('ADMIN', 'TEACHER'), updateEnrollment);

export default router;
