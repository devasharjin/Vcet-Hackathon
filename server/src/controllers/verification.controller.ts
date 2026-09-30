import { Request, Response, NextFunction } from 'express';
import { verificationService } from '../services/verification/verification.service.js';
import { DataStore } from '../models/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class VerificationController {
  async verifySession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const session = await DataStore.getSession(sessionId);

      if (!session) {
        throw new AppError(`Session ${sessionId} not found.`, 404);
      }

      const conflicts = await DataStore.getSessionConflicts(sessionId);
      const filePaths = conflicts.map((c: any) => c.filePath);

      const verification = await verificationService.verifyRepository(
        session.repositoryPath,
        filePaths
      );

      res.status(200).json({
        success: true,
        data: verification,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const verificationController = new VerificationController();
