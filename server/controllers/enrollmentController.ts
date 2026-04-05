import { Request, Response } from 'express';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import User from '../models/User';

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private/Admin
export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update enrollment status
// @route   PUT /api/enrollments/:id
// @access  Private/Admin/Teacher
export const updateEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (enrollment) {
      enrollment.status = req.body.status || enrollment.status;
      await enrollment.save();
      res.json(enrollment);
    } else {
      res.status(404).json({ message: 'Enrollment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
