import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendContactMessageEmail } from '../utils/mailer';

export const contactFormSchema = Joi.object({
  name: Joi.string().allow(null, '').optional(),
  firstName: Joi.string().allow(null, '').optional(),
  lastName: Joi.string().allow(null, '').optional(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(null, '').optional(),
  subject: Joi.string().allow(null, '').optional(),
  message: Joi.string().min(2).required()
});

export const submitContactForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = contactFormSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const name = value.name?.trim() || 
      [value.firstName, value.lastName].filter(Boolean).join(' ').trim() || 
      'Valued Customer';

    const email = value.email.trim().toLowerCase();
    const phone = value.phone ? String(value.phone).trim() : undefined;
    const subject = value.subject ? String(value.subject).trim() : undefined;
    const message = String(value.message).trim();

    await sendContactMessageEmail({
      name,
      email,
      phone,
      subject,
      message
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been received! Our support team will respond shortly.'
    });
  } catch (error) {
    console.error('[CONTACT] Error submitting contact message:', error);
    next(error);
  }
};
