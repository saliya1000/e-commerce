import { Request, Response } from 'express';
import prisma from '../prisma';

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const guestId = req.query.guestId as string;

    let cart;
    if (userId) {
      cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: { include: { images: true } } } } } });
    } else if (guestId) {
      cart = await prisma.cart.findUnique({ where: { guestId }, include: { items: { include: { product: { include: { images: true } } } } } });
    }

    if (!cart) {
      if (!userId && !guestId) {
        res.status(400).json({ message: 'User ID or Guest ID is required' });
        return;
      }
      // Create empty cart
      cart = await prisma.cart.create({
        data: userId ? { userId } : { guestId },
        include: { items: { include: { product: { include: { images: true } } } } }
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

    if (!userId && !guestId) {
      res.status(400).json({ message: 'User ID or Guest ID is required' });
      return;
    }

    let cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { guestId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: userId ? { userId } : { guestId },
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Check if item exists
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    const requestedQuantity = quantity || 1;
    const totalCartQuantity = (existingItem?.quantity || 0) + requestedQuantity;

    if (totalCartQuantity > product.stockQuantity) {
      res.status(400).json({ message: `Not enough stock available for ${product.name}` });
      return;
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: totalCartQuantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: requestedQuantity
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: { include: { images: true } } } } }
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
      const existingItem = await prisma.cartItem.findUnique({ 
        where: { id: id as string },
        include: { product: true }
      });

      if (!existingItem) {
        res.status(404).json({ message: 'Cart item not found' });
        return;
      }

      if (quantity > existingItem.product.stockQuantity) {
        res.status(400).json({ message: `Not enough stock available for ${existingItem.product.name}` });
        return;
      }

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
