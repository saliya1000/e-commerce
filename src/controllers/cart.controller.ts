import { Request, Response } from 'express';
import prisma from '../prisma';

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.query.guestId as string;

    let cart;
    if (userId) {
      cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
    } else if (guestId) {
      cart = await prisma.cart.findUnique({ where: { guestId }, include: { items: { include: { product: true } } } });
    }

    if (!cart) {
      // Create empty cart
      cart = await prisma.cart.create({
        data: userId ? { userId } : { guestId },
        include: { items: { include: { product: true } } }
      });
    }

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get cart' });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.body.guestId;
    const { productId, quantity } = req.body;

    let cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { guestId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: userId ? { userId } : { guestId },
      });
    }

    // Check if item exists
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + (quantity || 1) }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: quantity || 1
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } }
    });

    res.json(updatedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add to cart' });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // CartItem ID
    const { quantity } = req.body;

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: id as string } });
    } else {
      await prisma.cartItem.update({
        where: { id: id as string },
        data: { quantity }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // CartItem ID
    await prisma.cartItem.delete({ where: { id: id as string } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove from cart' });
  }
};

export const mergeCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { guestId } = req.body;

    if (!userId || !guestId) {
      res.status(400).json({ message: 'User ID and Guest ID are required' });
      return;
    }

    const guestCart = await prisma.cart.findUnique({
      where: { guestId },
      include: { items: true }
    });

    if (!guestCart || guestCart.items.length === 0) {
      res.json({ message: 'Nothing to merge' });
      return;
    }

    let userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true }
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId },
        include: { items: true }
      });
    }

    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(i => i.productId === guestItem.productId);
      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + guestItem.quantity }
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: guestItem.quantity
          }
        });
      }
    }

    // Delete guest cart
    await prisma.cart.delete({ where: { id: guestCart.id } });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to merge cart' });
  }
};
