import { Request, Response } from "express";
import Room from "../models/Room.ts";

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
export const getRooms = async (req: Request, res: Response) => {
  try {
    // ĐÃ FIX: Xóa { where: { status: 'ACTIVE' } } để lấy toàn bộ phòng (cả ACTIVE và INACTIVE)
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private/Admin
export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, capacity, building, status } = req.body;
    const room = await Room.create({ name, capacity, building, status });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (room) {
      room.name = req.body.name || room.name;
      room.capacity = req.body.capacity || room.capacity;
      room.building = req.body.building || room.building;
      room.status = req.body.status || room.status;
      await room.save();
      res.json(room);
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (room) {
      await room.destroy();
      res.json({ message: "Room removed" });
    } else {
      res.status(404).json({ message: "Room not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
