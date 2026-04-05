import { Request, Response } from 'express';
import Subject from '../models/Subject';
import Major from '../models/Major';

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.findAll({
      include: [{ model: Major, as: 'major' }]
    });
    res.json(subjects);
  } catch (error: any) {
    console.error('Get Subjects Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách môn học: ' + error.message });
  }
};

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private/Admin
export const createSubject = async (req: Request, res: Response) => {
  try {
    const { code, name, credits, majorId, semesterNumber, totalPeriods, weeks } = req.body;
    
    if (!code || !name || !majorId) {
      return res.status(400).json({ 
        message: 'Vui lòng điền đầy đủ thông tin: Mã môn, Tên môn và Ngành học' 
      });
    }

    const subject = await Subject.create({ code, name, credits, majorId, semesterNumber, totalPeriods, weeks });
    res.status(201).json(subject);
  } catch (error: any) {
    console.error('Create Subject Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Mã môn học đã tồn tại' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ message: 'Ngành học không hợp lệ' });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
export const updateSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (subject) {
      subject.code = req.body.code || subject.code;
      subject.name = req.body.name || subject.name;
      subject.credits = req.body.credits !== undefined ? req.body.credits : subject.credits;
      subject.majorId = req.body.majorId || subject.majorId;
      subject.semesterNumber = req.body.semesterNumber !== undefined ? req.body.semesterNumber : subject.semesterNumber;
      subject.totalPeriods = req.body.totalPeriods !== undefined ? req.body.totalPeriods : subject.totalPeriods;
      subject.weeks = req.body.weeks !== undefined ? req.body.weeks : subject.weeks;
      await subject.save();
      res.json(subject);
    } else {
      res.status(404).json({ message: 'Môn học không tồn tại' });
    }
  } catch (error: any) {
    console.error('Update Subject Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Mã môn học đã tồn tại' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ message: 'Ngành học không hợp lệ' });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.findByPk(req.params.id);
    if (subject) {
      await subject.destroy();
      res.json({ message: 'Subject removed' });
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
