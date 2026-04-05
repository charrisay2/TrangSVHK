import express from 'express';
import { getInvoices, payInvoice, createInvoice } from '../controllers/invoiceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getInvoices)
  .post(protect, authorize('ADMIN'), createInvoice);

router.route('/:id/pay')
  .put(protect, payInvoice);

export default router;
