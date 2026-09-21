import { Request, Response } from 'express';
import Stripe from 'stripe';
import { publishPaymentStatus } from '../utils/amqp';
import prisma from '../prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2022-11-15' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        const updateResult = await prisma.order.updateMany({
          where: { 
            id: orderId, 
            paymentStatus: { in: ['UNPAID', 'FAILED'] }
          },
          data: { paymentStatus: 'PAID' }
        });

        if (updateResult.count === 0) {
          console.log(`Order ${orderId} is not in a valid state for success update (e.g. Cancelled).`);
          break;
        }

        await prisma.payment.updateMany({
          where: { orderId, status: 'Pending' },
          data: { status: 'Succeeded', transactionId: paymentIntent.id }
        });

        await publishPaymentStatus(orderId, 'PAYMENT_SUCCESS', paymentIntent.id);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        const updateResult = await prisma.order.updateMany({
          where: { 
            id: orderId, 
            paymentStatus: 'UNPAID' 
          },
          data: { paymentStatus: 'FAILED' }
        });
        
        if (updateResult.count > 0) {
          await prisma.payment.updateMany({
            where: { orderId, status: 'Pending' },
            data: { status: 'Failed', transactionId: paymentIntent.id }
          });
          await publishPaymentStatus(orderId, 'PAYMENT_FAILED', paymentIntent.id);
        }
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};
