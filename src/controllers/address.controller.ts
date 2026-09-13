import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(addresses);
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { firstName, lastName, addressLine1, addressLine2, city, postalCode, country, phoneNumber, isDefault } = req.body;

    if (!firstName || !lastName || !addressLine1 || !city || !postalCode || !country) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        phoneNumber,
        country,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(address);
  } catch (error) {
    console.error('Failed to create address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;
    const { isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id, userId }, // Ensure user owns the address
      data: req.body,
    });

    res.json(updatedAddress);
  } catch (error) {
    console.error('Failed to update address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = req.params.id as string;

    await prisma.address.delete({
      where: { id, userId },
    });

    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('Failed to delete address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
