import { Request, Response } from 'express';
import { Grade } from '../models/Grade';

export const getGrades = async (req: Request, res: Response) => {
  try {
    const { courseId, studentId } = req.query;
    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;

    const grades = await Grade.findAll({ where });
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Error fetching grades' });
  }
};

export const saveGrades = async (req: Request, res: Response) => {
  try {
    const { courseId, semester, grades } = req.body;
    // grades is an array of { studentId, midterm, final }

    for (const grade of grades) {
      const existingGrade = await Grade.findOne({
        where: { courseId, studentId: grade.studentId }
      });

      if (existingGrade) {
        await existingGrade.update({
          midterm: grade.midterm,
          final: grade.final,
          semester
        });
      } else {
        await Grade.create({
          courseId,
          studentId: grade.studentId,
          midterm: grade.midterm,
          final: grade.final,
          semester
        });
      }
    }

    res.json({ message: 'Grades saved successfully' });
  } catch (error) {
    console.error('Error saving grades:', error);
    res.status(500).json({ message: 'Error saving grades' });
  }
};
