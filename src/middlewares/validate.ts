import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(err => err.message)
      });
    }
    
    // Replace req.body with the validated and stripped value (Whitelist applied)
    req.body = value;
    next();
  };
};
