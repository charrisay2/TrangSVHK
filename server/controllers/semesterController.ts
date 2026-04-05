import { Request, Response } from 'express';
import Semester from '../models/Semester';

// @desc    Get all semesters
// @route   GET /api/semesters
// @access  Private
export const getSemesters = async (req: Request, res: Response) => {
  try {
    const semesters = await Semester.findAll();
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a semester
// @route   POST /api/semesters
// @access  Private/Admin
export const createSemester = async (req: Request, res: Response) => {
  try {
    const { name, year, startDate, endDate, isActive } = req.body;
    const semester = await Semester.create({ name, year, startDate, endDate, isActive });
    res.status(201).json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a semester
// @route   PUT /api/semesters/:id
// @access  Private/Admin
export const updateSemester = async (req: Request, res: Response) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (semester) {
      semester.name = req.body.name || semester.name;
      semester.year = req.body.year || semester.year;
      semester.startDate = req.body.startDate || semester.startDate;
      semester.endDate = req.body.endDate || semester.endDate;
      if (req.body.isActive !== undefined) {
        semester.isActive = req.body.isActive;
      }
      await semester.save();
      res.json(semester);
    } else {
      res.status(404).json({ message: 'Semester not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a semester
// @route   DELETE /api/semesters/:id
// @access  Private/Admin
export const deleteSemester = async (req: Request, res: Response) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (semester) {
      await semester.destroy();
      res.json({ message: 'Semester removed' });
    } else {
      res.status(404).json({ message: 'Semester not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
