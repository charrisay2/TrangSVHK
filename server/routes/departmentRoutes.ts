import express from 'express';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getDepartments)
  .post(protect, authorize('ADMIN'), createDepartment);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateDepartment)
  .delete(protect, authorize('ADMIN'), deleteDepartment);

export default router;
