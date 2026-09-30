import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { runGitCommand } from '../../utils/command.js';
import { normalizeRepoPath, isPathAccessible } from '../../utils/file.js';
import { RepositoryInfo, GitStatusSummary } from '../../types/repository.types.js';
import { logger } from '../../utils/logger.js';

export class GitRepositoryManager {
  /**
   * Check if Git is installed on the host system
   */
  async isGitInstalled(): Promise<boolean> {
    try {
      const { exitCode } = await runGitCommand(['--version']);
      return exitCode === 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate that the path exists and is a valid Git repository
   */
  async isGitRepository(repoPath: string): Promise<boolean> {
    const normalized = normalizeRepoPath(repoPath);
    if (!(await isPathAccessible(normalized))) {
      return false;
    }

    const dotGit = path.join(normalized, '.git');
    if (!existsSync(dotGit)) {
      return false;
    }

    try {
      const { stdout } = await runGitCommand(['rev-parse', '--is-inside-work-tree'], {
        cwd: normalized,
      });
      return stdout === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Get repository name from folder or remote url
   */
  async getRepositoryName(repoPath: string): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    try {
      const { stdout } = await runGitCommand(['config', '--get', 'remote.origin.url'], {
        cwd: normalized,
      });
      if (stdout) {
        const basename = path.basename(stdout, '.git');
        if (basename) return basename;
      }
    } catch {
      // Ignore if no remote
    }
    return path.basename(normalized);
  }

  /**
   * Get current checked-out branch name
   */
  async getCurrentBranch(repoPath: string): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    try {
      const { stdout } = await runGitCommand(['branch', '--show-current'], {
        cwd: normalized,
      });
      if (stdout) return stdout;

      // Handle detached HEAD
      const rev = await runGitCommand(['rev-parse', '--short', 'HEAD'], {
        cwd: normalized,
      });
      return `HEAD (${rev.stdout})`;
    } catch (err: any) {
      logger.error('Failed to get current branch', err);
      return 'unknown';
    }
  }

  /**
   * Get detailed Git status of the working tree
   */
  async getStatus(repoPath: string): Promise<GitStatusSummary> {
    const normalized = normalizeRepoPath(repoPath);
    const { stdout } = await runGitCommand(['status', '--porcelain=v1'], {
      cwd: normalized,
    });

    const staged: string[] = [];
    const modified: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    if (stdout) {
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (!line || line.length < 3) continue;
        const code = line.substring(0, 2);
        const filePath = line.substring(3).trim();

        // Check for conflicts
        if (['UU', 'AA', 'UD', 'DU', 'DD', 'AU', 'UA'].includes(code)) {
          conflicted.push(filePath);
        } else if (code.startsWith('?')) {
          untracked.push(filePath);
        } else {
          if (code[0] !== ' ' && code[0] !== '?') staged.push(filePath);
          if (code[1] !== ' ' && code[1] !== '?') modified.push(filePath);
        }
      }
    }

    return {
      isClean: staged.length === 0 && modified.length === 0 && conflicted.length === 0,
      staged,
      modified,
      untracked,
      conflicted,
    };
  }

  /**
   * Get comprehensive repository info
   */
  async getRepositoryInfo(repoPath: string): Promise<RepositoryInfo> {
    const normalized = normalizeRepoPath(repoPath);
    const isValid = await this.isGitRepository(normalized);
    if (!isValid) {
      throw new Error(`Directory is not a valid Git repository: ${normalized}`);
    }

    const name = await this.getRepositoryName(normalized);
    const currentBranch = await this.getCurrentBranch(normalized);
    const status = await this.getStatus(normalized);

    let lastCommit;
    try {
      const { stdout } = await runGitCommand(
        ['log', '-1', '--format=%H|%s|%an|%cI'],
        { cwd: normalized }
      );
      if (stdout) {
        const [hash, message, author, date] = stdout.split('|');
        lastCommit = { hash, message, author, date };
      }
    } catch {
      // Empty repo or no commits
    }

    return {
      path: normalized,
      name,
      currentBranch,
      isClean: status.isClean,
      modifiedFilesCount: status.modified.length + status.staged.length,
      untrackedFilesCount: status.untracked.length,
      lastCommit,
    };
  }

  /**
   * Get recent commit logs
   */
  async getLog(repoPath: string, limit = 10) {
    const normalized = normalizeRepoPath(repoPath);
    try {
      const { stdout } = await runGitCommand(
        ['log', `-${limit}`, '--format=%H|%s|%an|%cI'],
        { cwd: normalized }
      );
      if (!stdout) return [];
      return stdout.split('\n').map((line) => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
    } catch {
      return [];
    }
  }
}
