import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error.middleware.js';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        next(new AppError(`Validation failed: ${issues}`, 400, 'VALIDATION_ERROR', error.issues));
      } else {
        next(error);
      }
    }
  };
}
