import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";

// CẤU HÌNH PAYOS
const PAYOS_CONFIG = {
  clientId: "1ebbdc8e-22c8-47bb-8135-29fec0d2cdb1",
  apiKey: "e80482a4-88df-4831-a3c6-f4b310fb2016",
  checksumKey:
    "8d2420925fb301a44b4bcddab363e04120a6f3c10b9cf67d28051678087357d8",
  endpoint: "https://api-merchant.payos.vn/v2/payment-requests",
  // FIX ĐIỀU HƯỚNG: Thêm ?module=finance để React App tự mở lại đúng tab Học phí
  returnUrl: "http://localhost:3001/?module=finance",
  cancelUrl: "http://localhost:3001/?module=finance",
};

export const createPayOSPayment = async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, description } = req.body;

    // FIX ORDER CODE: Ghép invoiceId với 4 số ngẫu nhiên (VD: ID 1 -> 1 + 1234 = 11234)
    // Giúp Frontend lấy lại được chính xác ID của hóa đơn khi thanh toán xong
    const orderCode = Number(
      String(invoiceId) + String(new Date().getTime()).slice(-4),
    );

    const requestBody = {
      orderCode,
      amount,
      description: description
        ? description.substring(0, 25)
        : `Thanh toan HD ${invoiceId}`,
      returnUrl: PAYOS_CONFIG.returnUrl,
      cancelUrl: PAYOS_CONFIG.cancelUrl,
    };

    // Tạo chữ ký bảo mật
    const dataStr = `amount=${requestBody.amount}&cancelUrl=${requestBody.cancelUrl}&description=${requestBody.description}&orderCode=${requestBody.orderCode}&returnUrl=${requestBody.returnUrl}`;
    const signature = crypto
      .createHmac("sha256", PAYOS_CONFIG.checksumKey)
      .update(dataStr)
      .digest("hex");
    const bodyWithSignature = { ...requestBody, signature };

    // Gọi lên Server PayOS
    const response = await axios.post(
      PAYOS_CONFIG.endpoint,
      bodyWithSignature,
      {
        headers: {
          "x-client-id": PAYOS_CONFIG.clientId,
          "x-api-key": PAYOS_CONFIG.apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    // Trả link thanh toán về cho Frontend
    res.json({ checkoutUrl: response.data.data.checkoutUrl });
  } catch (error: any) {
    console.error(
      "Lỗi tạo thanh toán PayOS:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Không thể tạo link thanh toán VietQR" });
  }
};
