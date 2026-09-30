import { Request, Response, NextFunction } from 'express';
import { gitService } from '../services/git/git.service.js';
import { normalizeRepoPath } from '../utils/file.js';
import { AppError } from '../middleware/error.middleware.js';

export class BranchController {
  async compareBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const { repositoryPath, sourceBranch, targetBranch } = req.body;
      if (!repositoryPath || !sourceBranch || !targetBranch) {
        throw new AppError('repositoryPath, sourceBranch, and targetBranch are required', 400);
      }

      const normalized = normalizeRepoPath(repositoryPath);
      const mergeBase = await gitService.getMergeBase(normalized, sourceBranch, targetBranch);
      const changedFiles = await gitService.getChangedFiles(normalized, sourceBranch, targetBranch);
      const diff = await gitService.getDiff(normalized, sourceBranch, targetBranch);

      res.status(200).json({
        success: true,
        data: {
          sourceBranch,
          targetBranch,
          mergeBase,
          changedFiles,
          diff,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const branchController = new BranchController();
