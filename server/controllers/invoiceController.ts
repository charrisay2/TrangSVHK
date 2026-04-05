import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import User from '../models/User';

// @desc    Get all invoices for a student
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    let whereClause = {};
    if (user.role === 'STUDENT') {
      whereClause = { studentId: user.id };
    }

    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Pay an invoice
// @route   PUT /api/invoices/:id/pay
// @access  Private/Student
export const payInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // @ts-ignore
    if (req.user.role === 'STUDENT' && invoice.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    invoice.status = 'Paid';
    const updatedInvoice = await invoice.save();
    
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Private/Admin
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const { studentId, title, amount, dueDate } = req.body;

    const invoice = await Invoice.create({
      studentId,
      title,
      amount,
      dueDate,
      status: 'Unpaid',
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
