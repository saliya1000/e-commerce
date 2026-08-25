import { Request, Response } from 'express';
import prisma from '../prisma';

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(methods);
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { cardBrand, last4, expMonth, expYear, isDefault } = req.body;

    if (!last4) {
      return res.status(400).json({ message: 'Missing required card details' });
    }

    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId,
        cardBrand: cardBrand || 'Unknown',
        last4,
        expMonth,
        expYear,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(paymentMethod);
  } catch (error) {
    console.error('Failed to create payment method:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    const { isDefault } = req.body;

    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updatedMethod = await prisma.paymentMethod.update({
      where: { id, userId },
      data: req.body,
    });

    res.json(updatedMethod);
  } catch (error) {
    console.error('Failed to update payment method:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;

    await prisma.paymentMethod.delete({
      where: { id, userId },
    });

    res.json({ success: true, message: 'Payment method deleted' });
  } catch (error) {
    console.error('Failed to delete payment method:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
