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
        // Update payment record
        await prisma.payment.updateMany({
          where: { transactionId: paymentIntent.id },
          data: { status: 'Succeeded' }
        });
        await publishPaymentStatus(orderId, 'PAYMENT_SUCCESS', paymentIntent.id);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        // Update payment record
        await prisma.payment.updateMany({
          where: { transactionId: paymentIntent.id },
          data: { status: 'Failed' }
        });
        await publishPaymentStatus(orderId, 'PAYMENT_FAILED', paymentIntent.id);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};
