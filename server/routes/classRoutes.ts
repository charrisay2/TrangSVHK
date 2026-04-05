import express from 'express';
import { getClasses, createClass, updateClass, deleteClass } from '../controllers/classController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getClasses)
  .post(protect, authorize('ADMIN'), createClass);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateClass)
  .delete(protect, authorize('ADMIN'), deleteClass);

export default router;
