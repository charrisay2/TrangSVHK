import express from 'express';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, registerCourse, unregisterCourse, getAvailableResources } from '../controllers/courseController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/available-resources', protect, getAvailableResources);

router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('ADMIN', 'TEACHER'), createCourse);

router.post('/:id/register', protect, authorize('STUDENT'), registerCourse);
router.post('/:id/unregister', protect, authorize('STUDENT'), unregisterCourse);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, authorize('ADMIN', 'TEACHER'), updateCourse)
  .delete(protect, authorize('ADMIN'), deleteCourse);

export default router;
