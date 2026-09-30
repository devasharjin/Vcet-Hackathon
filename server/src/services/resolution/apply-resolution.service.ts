import { DataStore } from '../../models/store.js';
import { gitService } from '../git/git.service.js';
import { verificationService } from '../verification/verification.service.js';
import { logger } from '../../utils/logger.js';

export interface ApplyResult {
  success: boolean;
  message: string;
  verificationPassed: boolean;
  verificationResult?: any;
  commitHash?: string;
  filesApplied: string[];
}

export class ApplyResolutionService {
  /**
   * Apply approved resolutions to the working tree, verify, and commit safely
   */
  async applyAndCommit(sessionId: string): Promise<ApplyResult> {
    const session = await DataStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const repoPath = session.repositoryPath;
    const conflicts = await DataStore.getSessionConflicts(sessionId);

    if (!conflicts.length) {
      throw new Error(`No conflicts recorded for session ${sessionId}`);
    }

    // 1. Verify all conflicts are approved
    const unapproved = conflicts.filter((c: any) => c.status !== 'APPROVED');
    if (unapproved.length > 0) {
      throw new Error(
        `Cannot apply merge. ${unapproved.length} conflict(s) are not yet approved by developer.`
      );
    }

    logger.info(`Applying resolutions for ${conflicts.length} files in ${repoPath}`);
    await DataStore.logOperation(
      sessionId,
      'APPLY_RESOLUTION',
      'INFO',
      `Starting to apply ${conflicts.length} approved resolutions`
    );

    const filesApplied: string[] = [];

    // 2. Write each approved file
    for (const conflict of conflicts) {
      await gitService.applyResolution(
        sessionId,
        repoPath,
        conflict.filePath,
        conflict.proposedResolution
      );
      filesApplied.push(conflict.filePath);

      await DataStore.updateConflict(conflict._id, {
        status: 'APPLIED',
      });
    }

    await DataStore.updateSession(sessionId, { status: 'APPLIED' });

    // 3. Run verification pipeline
    logger.info(`Running verification pipeline on applied files...`);
    const verification = await verificationService.verifyRepository(repoPath, filesApplied);

    if (!verification.success) {
      logger.warn(`Verification failed after applying resolutions in ${repoPath}`);
      await DataStore.updateSession(sessionId, { status: 'VERIFICATION_FAILED' });
      await DataStore.logOperation(
        sessionId,
        'VERIFICATION',
        'FAILED',
        'Verification checks failed. Commit aborted.',
        verification
      );

      return {
        success: false,
        message: 'Resolution was applied but verification failed. Check errors before committing or rollback.',
        verificationPassed: false,
        verificationResult: verification,
        filesApplied,
      };
    }

    // 4. Verification passed: Stage and commit
    logger.info(`Verification passed! Staging resolved files and committing...`);
    await gitService.stageFiles(repoPath, filesApplied);
    const commitHash = await gitService.commit(repoPath, 'resolved merge conflict');

    await DataStore.updateSession(sessionId, {
      status: 'COMMITTED',
      commitHash,
      completedAt: new Date(),
    });

    await DataStore.logOperation(
      sessionId,
      'COMMIT',
      'SUCCESS',
      `Created commit ${commitHash}: "resolved merge conflict"`,
      { commitHash, files: filesApplied }
    );

    return {
      success: true,
      message: 'Resolution applied, verified, and committed successfully!',
      verificationPassed: true,
      verificationResult: verification,
      commitHash,
      filesApplied,
    };
  }

  /**
   * Rollback changes if verification failed or developer changed their mind
   */
  async rollbackSession(sessionId: string): Promise<boolean> {
    const session = await DataStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const success = await gitService.rollback(sessionId);
    if (success) {
      await DataStore.updateSession(sessionId, { status: 'ROLLED_BACK' });
      await DataStore.logOperation(
        sessionId,
        'ROLLBACK',
        'SUCCESS',
        'Repository successfully restored to pre-application state.'
      );
    }
    return success;
  }

  async pushSession(
    sessionId: string,
    options?: { remote?: string; branch?: string; force?: boolean }
  ) {
    const session = await DataStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const repoPath = session.repositoryPath;
    const output = await gitService.push(repoPath, {
      remote: options?.remote,
      branch: options?.branch || session.targetBranch,
      force: options?.force,
    });

    await DataStore.logOperation(
      sessionId,
      'PUSH_CHANGES',
      'SUCCESS',
      `Pushed resolved changes to remote: ${output}`
    );

    return { success: true, output };
  }
}

export const applyResolutionService = new ApplyResolutionService();

