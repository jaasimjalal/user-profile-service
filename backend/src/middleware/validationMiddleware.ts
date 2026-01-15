import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

export const validateRequest = (
  schema: Joi.ObjectSchema | Joi.ArraySchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));

      throw new ValidationError(
        `Validation failed: ${validationErrors.map((e) => e.message).join(', ')}`
      );
    }

    next();
  };
};

// Validation schemas
export const createUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 100 characters'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Invalid email format'
    }),
  age: Joi.number()
    .integer()
    .min(0)
    .max(150)
    .optional()
    .messages({
      'number.base': 'Age must be a number',
      'number.min': 'Age must be at least 0',
      'number.max': 'Age must be at most 150'
    })
});

export const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 100 characters'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Invalid email format'
    }),
  age: Joi.number()
    .integer()
    .min(0)
    .max(150)
    .optional()
    .messages({
      'number.base': 'Age must be a number',
      'number.min': 'Age must be at least 0',
      'number.max': 'Age must be at most 150'
    })
});

export const idParamsSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid ID format, must be UUID'
    })
});

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
});