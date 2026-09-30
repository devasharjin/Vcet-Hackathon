import { Request, Response, NextFunction } from 'express';
import { resolutionService } from '../services/resolution/resolution.service.js';
import { gitService } from '../services/git/git.service.js';
import { DataStore } from '../models/store.js';
import { AppError } from '../middleware/error.middleware.js';
import { normalizeRepoPath } from '../utils/file.js';

export class ConflictController {
  async analyzeMerge(req: Request, res: Response, next: NextFunction) {
    try {
      const { repositoryPath, sourceBranch, targetBranch } = req.body;

      if (!repositoryPath || !sourceBranch || !targetBranch) {
        throw new AppError('repositoryPath, sourceBranch, and targetBranch are required', 400);
      }

      if (sourceBranch === targetBranch) {
        throw new AppError('Source branch and target branch must be different.', 400);
      }

      const normalized = normalizeRepoPath(repositoryPath);

      const result = await resolutionService.startMergeAnalysis(
        normalized,
        sourceBranch,
        targetBranch
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const session = await resolutionService.getSession(sessionId);

      if (!session) {
        throw new AppError(`Session ${sessionId} not found.`, 404);
      }

      const conflicts = await resolutionService.getSessionConflicts(sessionId);
      const logs = await DataStore.getLogs(sessionId);

      res.status(200).json({
        success: true,
        data: {
          session,
          conflicts,
          logs,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getSessionConflicts(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const conflicts = await resolutionService.getSessionConflicts(sessionId);

      res.status(200).json({
        success: true,
        data: conflicts,
      });
    } catch (err) {
      next(err);
    }
  }

  async approveConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const { conflictId } = req.params;
      const updated = await resolutionService.approveConflict(conflictId);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async editConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const { conflictId } = req.params;
      const { modifiedCode } = req.body;

      if (typeof modifiedCode !== 'string') {
        throw new AppError('modifiedCode string is required', 400);
      }

      const updated = await resolutionService.editConflictResolution(conflictId, modifiedCode);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectConflict(req: Request, res: Response, next: NextFunction) {
    try {
      const { conflictId } = req.params;
      const { reason } = req.body;

      const updated = await resolutionService.rejectConflictResolution(conflictId, reason);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async refineConflictWithPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { conflictId } = req.params;
      const { userPrompt } = req.body;

      if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
        throw new AppError('userPrompt is required to refine conflict resolution', 400);
      }

      const result = await resolutionService.refineConflictWithPrompt(conflictId, userPrompt.trim());

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async applyResolution(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const result = await resolutionService.applyAndCommit(sessionId);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async rollbackSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const success = await resolutionService.rollback(sessionId);

      res.status(200).json({
        success,
        message: success ? 'Rollback completed successfully.' : 'Rollback could not be performed.',
      });
    } catch (err) {
      next(err);
    }
  }

  async getSessionRemotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const session = await resolutionService.getSession(sessionId);
      if (!session) {
        throw new AppError(`Session ${sessionId} not found`, 404);
      }

      const remotes = await gitService.getRemotes(session.repositoryPath);
      res.status(200).json({
        success: true,
        data: remotes,
      });
    } catch (err) {
      next(err);
    }
  }

  async setSessionRemote(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const { name, url } = req.body || {};
      if (!url || typeof url !== 'string') {
        throw new AppError('Remote URL is required', 400);
      }

      const session = await resolutionService.getSession(sessionId);
      if (!session) {
        throw new AppError(`Session ${sessionId} not found`, 404);
      }

      await gitService.setRemote(session.repositoryPath, name || 'origin', url.trim());
      const remotes = await gitService.getRemotes(session.repositoryPath);

      res.status(200).json({
        success: true,
        data: remotes,
      });
    } catch (err) {
      next(err);
    }
  }

  async pushCommit(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const { remote, branch, force, setUpstream, dryRun, remoteUrl } = req.body || {};

      const result = await resolutionService.pushSession(sessionId, {
        remote,
        branch,
        force,
        setUpstream,
        dryRun,
        remoteUrl,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const message = err.message || '';
      let friendlyMessage = message;

      if (message.includes('does not appear to be a git repository') || message.includes('No such remote')) {
        friendlyMessage = 'The specified remote repository is not configured. Please enter a valid GitHub repository URL.';
      } else if (
        message.includes('Authentication failed') ||
        message.includes('could not read Username') ||
        (message.includes('Permission to') && message.includes('denied'))
      ) {
        friendlyMessage = 'GitHub authentication required. Please ensure Git credentials or Personal Access Token (PAT) / SSH keys are configured for GitHub on your machine.';
      } else if (message.includes('Updates were rejected') || message.includes('non-fast-forward')) {
        friendlyMessage = 'Push rejected: the remote branch contains new commits. Enable "Force Push (--force-with-lease)" or pull remote changes before pushing.';
      }

      const enhancedError = new AppError(friendlyMessage, 400, 'GIT_PUSH_FAILED');
      (enhancedError as any).rawDetails = message;
      next(enhancedError);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await DataStore.listSessions(30);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const conflictController = new ConflictController();
