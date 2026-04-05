import express from 'express';
import { getNotifications, createBroadcast, markAsRead } from '../controllers/notificationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/broadcast', protect, authorize('ADMIN'), createBroadcast);
router.put('/:id/read', protect, markAsRead);

export default router;
