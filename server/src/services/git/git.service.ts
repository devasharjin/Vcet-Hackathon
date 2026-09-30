import path from 'path';
import fs from 'fs/promises';
import { GitRepositoryManager } from './git.repository.js';
import { GitBranchManager } from './git.branch.js';
import { GitConflictManager, SimulationResult } from './git.conflict.js';
import { GitCommitManager } from './git.commit.js';
import { normalizeRepoPath, safeWriteFile, createBackup, restoreBackup } from '../../utils/file.js';
import { logger } from '../../utils/logger.js';

export class GitService {
  private repoManager = new GitRepositoryManager();
  private branchManager = new GitBranchManager();
  private conflictManager = new GitConflictManager();
  private commitManager = new GitCommitManager();

  // Active backups per session for rollback
  private sessionBackups = new Map<string, { backupDir: string; files: string[]; repoPath: string }>();

  async isGitRepository(repoPath: string): Promise<boolean> {
    return this.repoManager.isGitRepository(repoPath);
  }

  async getRepositoryName(repoPath: string): Promise<string> {
    return this.repoManager.getRepositoryName(repoPath);
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    return this.repoManager.getCurrentBranch(repoPath);
  }

  async getRepositoryInfo(repoPath: string) {
    return this.repoManager.getRepositoryInfo(repoPath);
  }

  async getBranches(repoPath: string) {
    return this.branchManager.getBranches(repoPath);
  }

  async getStatus(repoPath: string) {
    return this.repoManager.getStatus(repoPath);
  }

  async getMergeBase(repoPath: string, source: string, target: string) {
    return this.branchManager.getMergeBase(repoPath, source, target);
  }

  async getDiff(repoPath: string, source: string, target: string, filePath?: string) {
    return this.branchManager.getDiff(repoPath, source, target, filePath);
  }

  async getChangedFiles(repoPath: string, source: string, target: string) {
    return this.branchManager.getChangedFiles(repoPath, source, target);
  }

  async simulateMerge(
    repoPath: string,
    sourceBranch: string,
    targetBranch: string,
    sessionId: string
  ): Promise<SimulationResult> {
    return this.conflictManager.simulateMerge(repoPath, sourceBranch, targetBranch, sessionId);
  }

  async cleanupSimulation(simulationDir: string) {
    return this.conflictManager.cleanupSimulation(simulationDir);
  }

  /**
   * Apply approved resolved content to real working repository
   */
  async applyResolution(
    sessionId: string,
    repoPath: string,
    relativeFilePath: string,
    resolvedContent: string
  ): Promise<void> {
    const normalized = normalizeRepoPath(repoPath);
    const targetFile = path.join(normalized, relativeFilePath);

    // Save safety backup if not already saved for this session
    if (!this.sessionBackups.has(sessionId)) {
      const backupDir = await createBackup(normalized, [relativeFilePath]);
      this.sessionBackups.set(sessionId, {
        backupDir,
        files: [relativeFilePath],
        repoPath: normalized,
      });
    } else {
      const backupInfo = this.sessionBackups.get(sessionId)!;
      if (!backupInfo.files.includes(relativeFilePath)) {
        backupInfo.files.push(relativeFilePath);
      }
    }

    // Write the resolved file cleanly
    await safeWriteFile(targetFile, resolvedContent);
    logger.info(`Successfully applied resolution to ${targetFile}`);
  }

  async stageFiles(repoPath: string, files: string[]): Promise<void> {
    return this.commitManager.stageFiles(repoPath, files);
  }

  async commit(repoPath: string, message = 'resolved merge conflict'): Promise<string> {
    return this.commitManager.commit(repoPath, message);
  }

  async push(
    repoPath: string,
    options: {
      remote?: string;
      branch?: string;
      setUpstream?: boolean;
      force?: boolean;
    } = {}
  ) {
    return this.commitManager.push(repoPath, options);
  }

  /**
   * Safe rollback to repository state immediately prior to applying resolutions
   */
  async rollback(sessionId: string): Promise<boolean> {
    const backupInfo = this.sessionBackups.get(sessionId);
    if (!backupInfo) {
      logger.warn(`No backup found for session: ${sessionId}`);
      return false;
    }

    try {
      await restoreBackup(backupInfo.repoPath, backupInfo.backupDir);
      this.sessionBackups.delete(sessionId);
      logger.info(`Session ${sessionId} rolled back successfully.`);
      return true;
    } catch (err: any) {
      logger.error(`Rollback failed for session ${sessionId}:`, err);
      throw err;
    }
  }

  async getLog(repoPath: string, limit = 10) {
    return this.repoManager.getLog(repoPath, limit);
  }
}

export const gitService = new GitService();
