import { Request, Response } from 'express';
import Department from '../models/Department';

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error: any) {
    console.error('Get Departments Error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khoa: ' + error.message });
  }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Mã khoa và Tên khoa' });
    }
    const department = await Department.create({ code, name });
    res.status(201).json(department);
  } catch (error: any) {
    console.error('Create Department Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Mã khoa đã tồn tại' });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (department) {
      department.code = req.body.code || department.code;
      department.name = req.body.name || department.name;
      await department.save();
      res.json(department);
    } else {
      res.status(404).json({ message: 'Khoa không tồn tại' });
    }
  } catch (error: any) {
    console.error('Update Department Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Mã khoa đã tồn tại' });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (department) {
      await department.destroy();
      res.json({ message: 'Đã xóa khoa' });
    } else {
      res.status(404).json({ message: 'Khoa không tồn tại' });
    }
  } catch (error: any) {
    console.error('Delete Department Error:', error);
    res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
  }
};
