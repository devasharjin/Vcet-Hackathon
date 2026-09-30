import { Request, Response, NextFunction } from 'express';
import { conflictAnalyzer } from '../services/ai/conflict-analyzer.js';
import { resolutionGenerator } from '../services/ai/resolution-generator.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { AppError } from '../middleware/error.middleware.js';

export class AIController {
  async getStatus(req: Request, res: Response) {
    const configured = isGeminiConfigured();
    res.status(200).json({
      success: true,
      data: {
        configured,
        model: 'gemini-1.5-flash',
        message: configured
          ? 'Google Gemini API is active and ready.'
          : 'Gemini API key not detected in .env. Using intelligent local resolution engine.',
      },
    });
  }

  async analyzeConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.body;
      if (!context || !context.filePath) {
        throw new AppError('Conflict context is required', 400);
      }

      const result = await conflictAnalyzer.analyzeConflict(context);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateResolution(req: Request, res: Response, next: NextFunction) {
    try {
      const context = req.body;
      if (!context || !context.filePath) {
        throw new AppError('Conflict context is required', 400);
      }

      const result = await resolutionGenerator.generateResolution(context);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AIController();
