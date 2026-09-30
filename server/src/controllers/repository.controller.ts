import { Request, Response, NextFunction } from 'express';
import { gitService } from '../services/git/git.service.js';
import { normalizeRepoPath } from '../utils/file.js';
import { DataStore } from '../models/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class RepositoryController {
  async openRepository(req: Request, res: Response, next: NextFunction) {
    try {
      const { path: rawPath } = req.body;
      if (!rawPath || typeof rawPath !== 'string') {
        throw new AppError('Repository path is required.', 400, 'INVALID_PATH');
      }

      const normalized = normalizeRepoPath(rawPath);
      const isGit = await gitService.isGitRepository(normalized);

      if (!isGit) {
        throw new AppError(
          `Directory "${normalized}" does not exist or is not a valid Git repository (.git directory missing).`,
          400,
          'GIT_REPOSITORY_NOT_FOUND'
        );
      }

      const info = await gitService.getRepositoryInfo(normalized);
      const branches = await gitService.getBranches(normalized);
      const status = await gitService.getStatus(normalized);

      // Save repository to database history
      await DataStore.saveRepository({
        path: normalized,
        name: info.name,
        currentBranch: info.currentBranch,
      });

      res.status(200).json({
        success: true,
        data: {
          info,
          branches,
          status,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getRepositoryInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const rawPath = req.query.path as string;
      if (!rawPath) {
        throw new AppError('Query parameter "path" is required.', 400, 'MISSING_PARAM');
      }

      const normalized = normalizeRepoPath(rawPath);
      const info = await gitService.getRepositoryInfo(normalized);

      res.status(200).json({
        success: true,
        data: info,
      });
    } catch (err) {
      next(err);
    }
  }

  async getBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const rawPath = req.query.path as string;
      if (!rawPath) {
        throw new AppError('Query parameter "path" is required.', 400, 'MISSING_PARAM');
      }

      const normalized = normalizeRepoPath(rawPath);
      const branches = await gitService.getBranches(normalized);

      res.status(200).json({
        success: true,
        data: branches,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const rawPath = req.query.path as string;
      if (!rawPath) {
        throw new AppError('Query parameter "path" is required.', 400, 'MISSING_PARAM');
      }

      const normalized = normalizeRepoPath(rawPath);
      const status = await gitService.getStatus(normalized);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRecentRepositories(req: Request, res: Response, next: NextFunction) {
    try {
      const repos = await DataStore.listRepositories();
      res.status(200).json({
        success: true,
        data: repos,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const repositoryController = new RepositoryController();
