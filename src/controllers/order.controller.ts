import { Request, Response } from 'express';
import prisma from '../prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2022-11-15' as any, // Cast to any to avoid strict version type mismatches
});

export const checkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { guestId, shippingAddress, shippingMethod } = req.body;

    const cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { guestId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    // Determine shipping cost
    let shippingCost = 0;
    if (shippingMethod === 'express') {
      shippingCost = 15.00;
    } else if (shippingMethod === 'overnight') {
      shippingCost = 25.00;
    } else {
      shippingCost = 5.00; // Default standard shipping
    }

    // Calculate subtotal
    let subtotalAmount = 0;
    cart.items.forEach(item => {
      subtotalAmount += Number(item.product.price) * item.quantity;
    });

    const totalAmount = subtotalAmount + shippingCost;

    // Create Order
    const order = await prisma.order.create({
      data: {
        userId,
        guestId: userId ? null : guestId,
        status: 'Pending Payment',
        totalAmount,
        shippingAddress,
        shippingMethod: shippingMethod || 'standard',
        shippingCost,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // in cents
      currency: 'usd',
      metadata: { orderId: order.id },
    });

    // Create Payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: 'Pending',
        provider: 'stripe',
        transactionId: paymentIntent.id
      }
    });

    res.json({
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('CHECKOUT_ERROR:', error);
    res.status(500).json({ message: 'Checkout failed', error: error.message, stack: error.stack });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: { items: { include: { product: true } }, payments: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id: id as string } });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status !== 'Pending Payment') {
      res.status(400).json({ message: 'Cannot cancel an order that has already been processed' });
      return;
    }

    await prisma.order.update({
      where: { id: id as string },
      data: { status: 'Cancelled' }
    });

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};
