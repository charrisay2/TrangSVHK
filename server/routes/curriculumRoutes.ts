import express from 'express';
import { getCurriculums, createCurriculum, updateCurriculum, deleteCurriculum } from '../controllers/curriculumController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getCurriculums)
  .post(protect, authorize('ADMIN'), createCurriculum);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateCurriculum)
  .delete(protect, authorize('ADMIN'), deleteCurriculum);

export default router;
