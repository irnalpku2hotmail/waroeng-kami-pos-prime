
import { z } from 'zod';

// Common validation schemas
export const phoneSchema = z.string()
  .regex(/^(\+\d{1,3}[- ]?)?\d{10,14}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long');

export const priceSchema = z.number()
  .min(0, 'Price must be positive')
  .max(999999999, 'Price too large');

export const quantitySchema = z.number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(999999, 'Quantity too large');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(255, 'Name too long')
  .regex(/^[a-zA-Z0-9\s\-\_\.]+$/, 'Name contains invalid characters');

// Sanitization functions
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[\x00-\x1f\x7f-\x9f]/g, '');
};

// Rate limiting utilities
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userRequests.count >= maxRequests) {
    return false;
  }

  userRequests.count++;
  return true;
};

// Input validation middleware
export const validateAndSanitize = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};
