import express from 'express';
import { getMajors, createMajor, updateMajor, deleteMajor } from '../controllers/majorController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getMajors)
  .post(protect, authorize('ADMIN'), createMajor);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateMajor)
  .delete(protect, authorize('ADMIN'), deleteMajor);

export default router;
