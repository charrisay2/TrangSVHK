import express from 'express';
import { getSemesters, createSemester, updateSemester, deleteSemester } from '../controllers/semesterController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getSemesters)
  .post(protect, authorize('ADMIN'), createSemester);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateSemester)
  .delete(protect, authorize('ADMIN'), deleteSemester);

export default router;
