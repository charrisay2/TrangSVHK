import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { Op } from 'sequelize';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    let whereClause = {};
    if (user.role !== 'ADMIN') {
      whereClause = {
        [Op.or]: [
          { targetRole: 'ALL' },
          { targetRole: user.role },
          { targetUserId: user.id }
        ]
      };
    }
    
    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBroadcast = async (req: Request, res: Response) => {
  try {
    const { title, message, targetRole } = req.body;
    
    if (!message || !targetRole) {
      return res.status(400).json({ message: 'Message and targetRole are required' });
    }
    
    const notification = await Notification.create({
      title,
      message,
      type: 'BROADCAST',
      targetRole,
      isRead: false
    });
    
    // Emit via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('notification', notification);
    }
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const user = req.user;
    
    // In a real app, we might want a UserNotification join table for read status per user
    // For simplicity, if it's a direct user notification, we mark it read.
    // If it's a broadcast, we might need a different approach, but let's just update it for now
    // or ignore marking broadcasts as read globally.
    
    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    if (notification.targetUserId === user.id) {
      notification.isRead = true;
      await notification.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
