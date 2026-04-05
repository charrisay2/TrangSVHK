import { Request, Response } from 'express';
import Curriculum from '../models/Curriculum';
import Major from '../models/Major';
import Subject from '../models/Subject';

// @desc    Get all curriculums
// @route   GET /api/curriculums
// @access  Private/Admin
export const getCurriculums = async (req: Request, res: Response) => {
  try {
    const curriculums = await Curriculum.findAll({
      include: [
        { model: Major, as: 'major' },
        { model: Subject, as: 'subject' }
      ]
    });
    res.json(curriculums);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a curriculum entry
// @route   POST /api/curriculums
// @access  Private/Admin
export const createCurriculum = async (req: Request, res: Response) => {
  try {
    const { majorId, subjectId, semesterNumber } = req.body;

    const exists = await Curriculum.findOne({ where: { majorId, subjectId } });
    if (exists) {
      return res.status(400).json({ message: 'Subject already exists in this major curriculum' });
    }

    const curriculum = await Curriculum.create({
      majorId,
      subjectId,
      semesterNumber
    });

    const created = await Curriculum.findByPk(curriculum.id, {
      include: [
        { model: Major, as: 'major' },
        { model: Subject, as: 'subject' }
      ]
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update curriculum entry
// @route   PUT /api/curriculums/:id
// @access  Private/Admin
export const updateCurriculum = async (req: Request, res: Response) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id);

    if (curriculum) {
      curriculum.semesterNumber = req.body.semesterNumber || curriculum.semesterNumber;

      await curriculum.save();
      
      const updated = await Curriculum.findByPk(curriculum.id, {
        include: [
          { model: Major, as: 'major' },
          { model: Subject, as: 'subject' }
        ]
      });

      res.json(updated);
    } else {
      res.status(404).json({ message: 'Curriculum entry not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete curriculum entry
// @route   DELETE /api/curriculums/:id
// @access  Private/Admin
export const deleteCurriculum = async (req: Request, res: Response) => {
  try {
    const curriculum = await Curriculum.findByPk(req.params.id);

    if (curriculum) {
      await curriculum.destroy();
      res.json({ message: 'Curriculum entry removed' });
    } else {
      res.status(404).json({ message: 'Curriculum entry not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
