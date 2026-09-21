import { Request, Response } from 'express';
import prisma from '../prisma';
import Stripe from 'stripe';
import { publishPaymentStatus } from '../utils/amqp';
import { publishRefundStatus } from '../utils/amqp';
import { calculateTotal } from '../utils/cartCalculations';
import { AddressValidatorService } from '../utils/AddressValidatorService';
import { validateAddressWithNominatim } from '../utils/nominatimValidator';
import { decrypt, encrypt, encryptJson, decryptJson } from '../utils/encryption';
import Joi from 'joi';

export const checkoutSchema = Joi.object({
  guestId: Joi.string().allow(null, '').optional(),
  shippingAddress: Joi.object({
    name: Joi.string().required(),
    line1: Joi.string().required(),
    line2: Joi.string().allow(null, '').optional(),
    city: Joi.string().required(),
    state: Joi.string().allow(null, '').optional(),
    postal_code: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().allow(null, '').optional(),
    email: Joi.string().email().allow(null, '').optional()
  }).required(),
  shippingMethod: Joi.string().valid('standard', 'express', 'overnight').optional(),
  existingOrderId: Joi.string().uuid().optional(),
  saveAddress: Joi.boolean().optional()
});

export const trackOrderSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  email: Joi.string().email().required()
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2022-11-15' as any, // Cast to any to avoid strict version type mismatches
});

export const validateAddress = async (req: Request, res: Response) => {
  try {
    const { shippingAddress } = req.body;
    
    const addressValidation = AddressValidatorService.validate(shippingAddress);
    if (!addressValidation.isValid) {
      res.status(400).json({ message: addressValidation.message });
      return;
    }

    const nominatimValidation = await validateAddressWithNominatim(shippingAddress);
    if (!nominatimValidation.isValid) {
      res.status(400).json({ message: nominatimValidation.message });
      return;
    }

    res.json({ isValid: true });
  } catch (error: any) {
    console.error('ADDRESS_VALIDATION_ERROR:', error);
    res.status(500).json({ message: 'Address validation failed', error: error.message });
  }
};

export const checkout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { guestId, shippingAddress, shippingMethod, existingOrderId } = req.body;
    
    console.log(`[CHECKOUT] userId: ${userId}, guestId: ${guestId}`);

    const cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { guestId },
      include: { items: { include: { product: true } } }
    });

    console.log(`[CHECKOUT] Cart found:`, cart ? `Yes, with ${cart.items.length} items` : `No`);

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    // Verify stock availability
    const outOfStockItems = cart.items.filter(item => item.quantity > item.product.stockQuantity);
    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map(item => item.product.name).join(', ');
      res.status(400).json({ message: `Cannot proceed to checkout. The following items do not have enough stock: ${names}` });
      return;
    }

    // Validate shipping address using mock service
    const addressValidation = AddressValidatorService.validate(shippingAddress);
    if (!addressValidation.isValid) {
      res.status(400).json({ message: addressValidation.message });
      return;
    }

    // Validate shipping address using Nominatim (OpenStreetMap) API
    const nominatimValidation = await validateAddressWithNominatim(shippingAddress);
    if (!nominatimValidation.isValid) {
      res.status(400).json({ message: nominatimValidation.message });
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
    const totalAmount = calculateTotal(cart.items, shippingCost);

    // Create or Update Order
    let order;
    if (existingOrderId) {
      const existing = await prisma.order.findUnique({ where: { id: existingOrderId } });
      if (existing && existing.status === 'Pending Payment') {
        // We must delete the old items first to recreate them
        await prisma.orderItem.deleteMany({ where: { orderId: existingOrderId } });
        
        order = await prisma.order.update({
          where: { id: existingOrderId },
          data: {
            totalAmount,
            shippingAddress: encryptJson(shippingAddress),
            shippingMethod: shippingMethod || 'standard',
            shippingCost,
            items: {
              create: cart.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
                cost: item.product.cost
              }))
            }
          }
        });
      }
    }

    if (!order) {
      order = await prisma.order.create({
        data: {
          userId,
          guestId: userId ? null : guestId,
          status: 'Pending Payment',
          totalAmount,
          shippingAddress: encryptJson(shippingAddress),
          shippingMethod: shippingMethod || 'standard',
          shippingCost,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              cost: item.product.cost
            }))
          }
        }
      });
    }

    // Save Address if requested by a logged in user
    console.log(`[CHECKOUT] userId: ${userId}, saveAddress: ${req.body.saveAddress}`);
    if (userId && req.body.saveAddress) {
      console.log(`[CHECKOUT] Updating old addresses to not default...`);
      // Set all other addresses for this user to not be default
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      const nameParts = (shippingAddress.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const existingAddresses = await prisma.address.findMany({ where: { userId } });
      let matchedAddressId = null;

      for (const addr of existingAddresses) {
        if (
          decrypt(addr.addressLine1) === shippingAddress.line1 &&
          decrypt(addr.city) === shippingAddress.city &&
          decrypt(addr.postalCode) === shippingAddress.postal_code &&
          (addr.phoneNumber ? decrypt(addr.phoneNumber) === shippingAddress.phone : !shippingAddress.phone) &&
          addr.country === shippingAddress.country &&
          addr.firstName === firstName &&
          addr.lastName === lastName
        ) {
          matchedAddressId = addr.id;
          break;
        }
      }

      if (matchedAddressId) {
        console.log(`[CHECKOUT] Reusing existing address:`, matchedAddressId);
        await prisma.address.update({
          where: { id: matchedAddressId },
          data: { isDefault: true }
        });
      } else {
        console.log(`[CHECKOUT] Creating new address:`, { firstName, lastName, line1: shippingAddress.line1 });
        const newAddr = await prisma.address.create({
          data: {
            userId,
            firstName,
            lastName,
            addressLine1: encrypt(shippingAddress.line1),
            city: encrypt(shippingAddress.city),
            postalCode: encrypt(shippingAddress.postal_code),
            phoneNumber: shippingAddress.phone ? encrypt(shippingAddress.phone) : null,
            country: shippingAddress.country,
            isDefault: true
          }
        });
        console.log(`[CHECKOUT] Address created:`, newAddr.id);
      }
    }

    // Do NOT clear the cart here. 
    // The cart should only be cleared when payment is successful (handled in orderWorker).

    // Handle Stripe Customer for saved cards
    let stripeCustomerId: string | undefined;
    if (userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) {
        if (dbUser.stripeCustomerId) {
          stripeCustomerId = dbUser.stripeCustomerId;
        } else {
          const customer = await stripe.customers.create({
            email: dbUser.email,
            name: shippingAddress.name || undefined
          });
          stripeCustomerId = customer.id;
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id }
          });
        }
      }
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // in cents
      currency: 'usd',
      metadata: { orderId: order.id },
      ...(stripeCustomerId ? { customer: stripeCustomerId, setup_future_usage: 'on_session' } : {})
    });

    // Create Payment record
    if (existingOrderId) {
      await prisma.payment.deleteMany({ where: { orderId: order.id, status: 'Pending' } });
    }
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

    const { status, days, sortBy = 'date', sortOrder = 'desc' } = req.query;
    let whereClause: any = { userId };
    
    if (status && status !== 'All') {
      whereClause.status = status;
    }
    
    if (days && days !== 'All') {
      const daysInt = parseInt(days as string, 10);
      if (!isNaN(daysInt)) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - daysInt);
        whereClause.createdAt = { gte: dateLimit };
      }
    }

    let orderByClause: any = { createdAt: 'desc' };
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortBy === 'status') {
      orderByClause = { status: orderDirection };
    } else {
      orderByClause = { createdAt: orderDirection };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: orderByClause
    });

    const decryptedOrders = orders.map(order => ({
      ...order,
      shippingAddress: decryptJson(order.shippingAddress)
    }));

    res.json(decryptedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const guestId = req.cookies?.guestId || req.body?.guestId || req.query?.guestId as string;

    if (!userId && !guestId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const order = await prisma.order.findFirst({ 
      where: { 
        id,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(guestId ? [{ guestId }] : [])
        ]
      }, 
      include: { payments: true } 
    }) as any;
    
    if (!order || !order.payments) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    if (order.status === 'Pending Payment') {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.payments[0]?.transactionId || '');
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update payment and publish to RabbitMQ to clear cart and send email
        await prisma.payment.updateMany({ where: { orderId: id }, data: { status: 'Succeeded' } });
        await publishPaymentStatus(order.id, 'PAYMENT_SUCCESS', paymentIntent.id);
        res.json({ status: 'succeeded' });
        return;
      }
    }
    res.json({ status: order.status });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const guestId = req.cookies?.guestId || req.query?.guestId as string;

    if (!userId && !guestId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: id as string,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(guestId ? [{ guestId }] : [])
        ]
      },
      include: { items: { include: { product: { include: { images: true } } } }, payments: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const decryptedOrder = {
      ...order,
      shippingAddress: decryptJson(order.shippingAddress)
    };

    res.json(decryptedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const guestId = req.cookies?.guestId || req.body?.guestId || req.query?.guestId as string;

    if (!userId && !guestId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const order = await prisma.order.findFirst({ 
      where: { 
        id: id as string,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(guestId ? [{ guestId }] : [])
        ]
      },
      include: { payments: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status === 'Pending Payment') {
      await prisma.order.update({
        where: { id: id as string },
        data: { status: 'Cancelled' }
      });
      res.json({ success: true, message: 'Order cancelled' });
      return;
    }

    if (order.status === 'Payment Successful') {
      await prisma.order.update({
        where: { id: id as string },
        data: { status: 'Refund Processing' }
      });
      
      const payment = order.payments.find(p => p.status === 'Succeeded');
      const transactionId = payment?.transactionId || undefined;
      
      await publishRefundStatus(order.id, transactionId);
      
      res.json({ success: true, message: 'Refund initiated' });
      return;
    }

    res.status(400).json({ message: 'Cannot cancel an order that has already shipped or been processed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true,
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const shippingAddress: any = decryptJson(order.shippingAddress) || {};
    const orderEmail = order.user?.email || shippingAddress.email;

    if (!orderEmail || orderEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: 'Order not found or email does not match' });
    }

    const decryptedOrder = {
      ...order,
      shippingAddress
    };

    res.json(decryptedOrder);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ message: 'Failed to track order' });
  }
};

export const trackCancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, email } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ message: 'Order ID and email are required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true, user: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const shippingAddress: any = decryptJson(order.shippingAddress) || {};
    const orderEmail = order.user?.email || shippingAddress.email;

    if (!orderEmail || orderEmail.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: 'Order not found or email does not match' });
    }

    if (order.status === 'Pending Payment') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'Cancelled' }
      });
      return res.json({ success: true, message: 'Order cancelled' });
    }

    if (order.status === 'Payment Successful') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'Refund Processing' }
      });
      
      const payment = order.payments.find(p => p.status === 'Succeeded');
      const transactionId = payment?.transactionId || undefined;
      
      await publishRefundStatus(order.id, transactionId);
      
      return res.json({ success: true, message: 'Refund initiated' });
    }

    res.status(400).json({ message: 'Cannot cancel an order that has already shipped or been processed' });
  } catch (error) {
    console.error('Error cancelling tracked order:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};
