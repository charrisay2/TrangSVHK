import express from 'express';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getSubjects)
  .post(protect, authorize('ADMIN'), createSubject);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateSubject)
  .delete(protect, authorize('ADMIN'), deleteSubject);

export default router;
