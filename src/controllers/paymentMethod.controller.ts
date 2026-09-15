import { Request, Response } from 'express';
import prisma from '../prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2022-11-15' as any,
});

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

export const createSetupIntent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: 'off_session',
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error('Failed to create setup intent:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentMethodId, isDefault } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Missing payment method ID' });
    }

    const stripeMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!stripeMethod || !stripeMethod.card) {
      return res.status(400).json({ message: 'Invalid payment method' });
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
        cardBrand: stripeMethod.card.brand || 'Unknown',
        last4: stripeMethod.card.last4,
        expMonth: stripeMethod.card.exp_month,
        expYear: stripeMethod.card.exp_year,
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
