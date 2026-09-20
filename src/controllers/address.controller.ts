import { Request, Response } from 'express';
import prisma from '../prisma';
import Joi from 'joi';
import { encrypt, decrypt } from '../utils/encryption';

export const addressSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow('', null).optional(),
  city: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required(),
  phoneNumber: Joi.string().allow('', null).optional(),
  isDefault: Joi.boolean().optional()
});

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const decryptedAddresses = addresses.map(addr => ({
      ...addr,
      addressLine1: decrypt(addr.addressLine1),
      addressLine2: addr.addressLine2 ? decrypt(addr.addressLine2) : null,
      city: decrypt(addr.city),
      postalCode: decrypt(addr.postalCode),
      phoneNumber: addr.phoneNumber ? decrypt(addr.phoneNumber) : null,
    }));

    res.json(decryptedAddresses);
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
        addressLine1: encrypt(addressLine1),
        addressLine2: addressLine2 ? encrypt(addressLine2) : null,
        city: encrypt(city),
        postalCode: encrypt(postalCode),
        phoneNumber: phoneNumber ? encrypt(phoneNumber) : null,
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

    const { addressLine1, addressLine2, city, postalCode, phoneNumber } = req.body;
    const updateData = { ...req.body };
    if (addressLine1) updateData.addressLine1 = encrypt(addressLine1);
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2 ? encrypt(addressLine2) : null;
    if (city) updateData.city = encrypt(city);
    if (postalCode) updateData.postalCode = encrypt(postalCode);
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber ? encrypt(phoneNumber) : null;

    const updatedAddress = await prisma.address.update({
      where: { id, userId }, // Ensure user owns the address
      data: updateData,
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
