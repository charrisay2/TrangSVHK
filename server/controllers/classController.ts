import { Request, Response } from 'express';
import Class from '../models/Class';
import Major from '../models/Major';

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.findAll({
      include: [{ model: Major, as: 'major' }]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a class
// @route   POST /api/classes
// @access  Private/Admin
export const createClass = async (req: Request, res: Response) => {
  try {
    const { cohort, majorId } = req.body;
    
    if (!cohort || !majorId) {
      return res.status(400).json({ message: 'Missing cohort or majorId' });
    }

    const major = await Major.findByPk(majorId);
    if (!major) {
      return res.status(404).json({ message: 'Major not found' });
    }

    // Find existing classes for this cohort and major to determine the next sequential number
    const existingClasses = await Class.findAll({
      where: { cohort, majorId }
    });

    const sequentialNumber = existingClasses.length + 1;
    const generatedName = `${cohort}${major.code}${sequentialNumber}`;
    const generatedCode = generatedName; // Use the same for code

    const newClass = await Class.create({ 
      code: generatedCode, 
      name: generatedName, 
      cohort, 
      majorId 
    });
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
export const updateClass = async (req: Request, res: Response) => {
  try {
    const classToUpdate = await Class.findByPk(req.params.id);
    if (classToUpdate) {
      const { cohort, majorId } = req.body;
      
      let newCohort = cohort || classToUpdate.cohort;
      let newMajorId = majorId || classToUpdate.majorId;
      
      // If cohort or major changed, regenerate name and code
      if (newCohort !== classToUpdate.cohort || newMajorId !== classToUpdate.majorId) {
        const major = await Major.findByPk(newMajorId);
        if (major) {
          const existingClasses = await Class.findAll({
            where: { cohort: newCohort, majorId: newMajorId }
          });
          const sequentialNumber = existingClasses.length + 1;
          const generatedName = `${newCohort}${major.code}${sequentialNumber}`;
          classToUpdate.code = generatedName;
          classToUpdate.name = generatedName;
        }
      }

      classToUpdate.cohort = newCohort;
      classToUpdate.majorId = newMajorId;
      await classToUpdate.save();
      res.json(classToUpdate);
    } else {
      res.status(404).json({ message: 'Class not found' });
    }
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const classToDelete = await Class.findByPk(req.params.id);
    if (classToDelete) {
      await classToDelete.destroy();
      res.json({ message: 'Class removed' });
    } else {
      res.status(404).json({ message: 'Class not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
