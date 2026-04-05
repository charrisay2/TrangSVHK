import express from "express";
import { createPayOSPayment } from "../controllers/paymentController";

const router = express.Router();

// Đường dẫn API để Frontend gọi
router.post("/payos/create", createPayOSPayment);

export default router;
