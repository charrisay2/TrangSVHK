import express from 'express';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../controllers/roomController.ts';
import { protect, authorize } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.route('/')
  .get(protect, getRooms)
  .post(protect, authorize('ADMIN'), createRoom);

router.route('/:id')
  .put(protect, authorize('ADMIN'), updateRoom)
  .delete(protect, authorize('ADMIN'), deleteRoom);

export default router;
