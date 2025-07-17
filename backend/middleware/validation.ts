import express from 'express';

/**
 * Validation middleware for API requests
 */

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export function validateRequest(rules: ValidationRule[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is not required and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
          continue;
        }
      }

      // String validations
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be no more than ${rule.maxLength} characters long`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
        }
      }

      // Number validations
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must be no more than ${rule.max}`);
        }
      }

      // Array validations
      if (rule.type === 'array' && Array.isArray(value)) {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must have at least ${rule.minLength} items`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must have no more than ${rule.maxLength} items`);
        }
      }

      // Custom validation
      if (rule.custom) {
        const result = rule.custom(value);
        if (typeof result === 'string') {
          errors.push(result);
        } else if (!result) {
          errors.push(`${rule.field} validation failed`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
}

// Common validation rules
export const ValidationRules = {
  story: {
    field: 'story',
    required: true,
    type: 'string' as const,
    minLength: 10,
    maxLength: 5000
  },
  style: {
    field: 'style',
    required: true,
    type: 'string' as const,
    minLength: 2,
    maxLength: 100
  },
  title: {
    field: 'title',
    required: true,
    type: 'string' as const,
    minLength: 1,
    maxLength: 200
  },
  scenes: {
    field: 'scenes',
    required: true,
    type: 'array' as const,
    minLength: 1,
    maxLength: 20
  },
  prompts: {
    field: 'prompts',
    required: true,
    type: 'array' as const,
    minLength: 1,
    maxLength: 20
  },
  styleGuide: {
    field: 'styleGuide',
    required: true,
    type: 'string' as const,
    minLength: 10,
    maxLength: 2000
  },
  maxWordsPerScene: {
    field: 'maxWordsPerScene',
    required: false,
    type: 'number' as const,
    min: 10,
    max: 100
  },
  dpi: {
    field: 'dpi',
    required: false,
    type: 'number' as const,
    min: 50,
    max: 300
  }
};
