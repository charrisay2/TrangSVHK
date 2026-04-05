import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = express.Router();

router
  .route("/")
  // ĐÃ FIX: Thêm quyền 'TEACHER' vào để Giảng viên có thể xem được tên Sinh viên
  .get(protect, authorize("ADMIN", "TEACHER"), getUsers)
  .post(protect, authorize("ADMIN"), createUser);

router
  .route("/:id")
  .put(protect, authorize("ADMIN"), updateUser)
  .delete(protect, authorize("ADMIN"), deleteUser);

export default router;
