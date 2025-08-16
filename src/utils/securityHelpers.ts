
import { sanitizeHtml, sanitizeInput } from './inputValidation';

// Security helper functions
export const secureRender = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    // Handle objects that might be accidentally rendered
    if (value.name) return String(value.name);
    if (value.email) return String(value.email);
    if (value.title) return String(value.title);
    if (value.id) return String(value.id);
    
    // Fallback for unknown objects
    return JSON.stringify(value);
  }
  
  return String(value);
};

export const secureStringRender = (value: any): string => {
  const sanitized = secureRender(value);
  return sanitizeInput(sanitized);
};

export const secureHtmlRender = (value: any): string => {
  const sanitized = secureRender(value);
  return sanitizeHtml(sanitized);
};

// Type guard to check if value is safe to render
export const isSafeToRender = (value: any): boolean => {
  return typeof value === 'string' || 
         typeof value === 'number' || 
         typeof value === 'boolean' ||
         value === null ||
         value === undefined;
};

// Security validation for user inputs
export const validateUserInput = (input: any): { isValid: boolean; sanitized: string } => {
  if (!isSafeToRender(input)) {
    return {
      isValid: false,
      sanitized: secureStringRender(input)
    };
  }
  
  return {
    isValid: true,
    sanitized: secureStringRender(input)
  };
};

// Role-based access control helper
export const hasPermission = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

// Session security helpers
export const isSessionValid = (lastActivity: Date, timeoutMinutes: number = 30): boolean => {
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
  return diffMinutes < timeoutMinutes;
};

export const generateSecureId = (): string => {
  return crypto.randomUUID();
};
