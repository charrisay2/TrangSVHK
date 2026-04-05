import express from 'express';
import { getGrades, saveGrades } from '../controllers/gradeController';

const router = express.Router();

router.get('/', getGrades);
router.post('/', saveGrades);

export default router;
