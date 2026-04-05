import { Request, Response } from 'express';
import Major from '../models/Major';

// @desc    Get all majors
// @route   GET /api/majors
// @access  Private
export const getMajors = async (req: Request, res: Response) => {
  try {
    const majors = await Major.findAll();
    res.json(majors);
  } catch (error: any) {
    console.error('Get Majors Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách ngành học: ' + error.message });
  }
};

// @desc    Create a major
// @route   POST /api/majors
// @access  Private/Admin
export const createMajor = async (req: Request, res: Response) => {
  try {
    const { code, name, departmentId } = req.body;
    
    if (!code || !name || !departmentId) {
      return res.status(400).json({ 
        message: 'Vui lòng điền đầy đủ thông tin: Mã ngành, Tên ngành và Khoa quản lý' 
      });
    }

    const major = await Major.create({ code, name, departmentId });
    res.status(201).json(major);
  } catch (error: any) {
    console.error('Create Major Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Mã ngành đã tồn tại' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ message: 'Khoa quản lý không hợp lệ' });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }
};

// @desc    Update a major
// @route   PUT /api/majors/:id
// @access  Private/Admin
export const updateMajor = async (req: Request, res: Response) => {
  try {
    const major = await Major.findByPk(req.params.id);
    if (major) {
      major.code = req.body.code || major.code;
      major.name = req.body.name || major.name;
      major.departmentId = req.body.departmentId || major.departmentId;
      await major.save();
      res.json(major);
    } else {
      res.status(404).json({ message: 'Ngành học không tồn tại' });
    }
  } catch (error: any) {
    console.error('Update Major Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Mã ngành đã tồn tại' });
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ message: 'Khoa quản lý không hợp lệ' });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }
};

// @desc    Delete a major
// @route   DELETE /api/majors/:id
// @access  Private/Admin
export const deleteMajor = async (req: Request, res: Response) => {
  try {
    const major = await Major.findByPk(req.params.id);
    if (major) {
      await major.destroy();
      res.json({ message: 'Đã xóa ngành học' });
    } else {
      res.status(404).json({ message: 'Ngành học không tồn tại' });
    }
  } catch (error: any) {
    console.error('Delete Major Error:', error);
    res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
  }
};
