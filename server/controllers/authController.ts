import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    // 1. Check if user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    // 2. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    // 3. Generate Token
    const payload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // 4. Return user info (excluding password) and token
    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      joinDate: user.joinDate,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      classId: user.classId,
      departmentId: user.departmentId,
      majorId: user.majorId,
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is attached by auth middleware
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
