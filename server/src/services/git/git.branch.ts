import { runGitCommand } from '../../utils/command.js';
import { normalizeRepoPath } from '../../utils/file.js';
import { BranchInfo } from '../../types/repository.types.js';
import { logger } from '../../utils/logger.js';

export class GitBranchManager {
  /**
   * Get all branches (local and remote)
   */
  async getBranches(repoPath: string): Promise<BranchInfo[]> {
    const normalized = normalizeRepoPath(repoPath);

    // List local branches with commit hash and message
    const { stdout: localOut } = await runGitCommand(
      ['branch', '--format=%(HEAD)|%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(subject)'],
      { cwd: normalized }
    );

    const branches: BranchInfo[] = [];

    if (localOut) {
      const lines = localOut.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const [headMark, name, commitHash, date, ...subjectParts] = line.split('|');
        branches.push({
          name: name.trim(),
          isCurrent: headMark.trim() === '*',
          isRemote: false,
          commitHash: commitHash.trim(),
          lastCommitDate: date ? date.trim() : undefined,
          lastCommitMessage: subjectParts.join('|').trim(),
        });
      }
    }

    // List remote branches
    try {
      const { stdout: remoteOut } = await runGitCommand(
        ['branch', '-r', '--format=%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(subject)'],
        { cwd: normalized }
      );
      if (remoteOut) {
        const lines = remoteOut.split('\n');
        for (const line of lines) {
          if (!line.trim() || line.includes('/HEAD')) continue;
          const [name, commitHash, date, ...subjectParts] = line.split('|');
          branches.push({
            name: name.trim(),
            isCurrent: false,
            isRemote: true,
            commitHash: commitHash.trim(),
            lastCommitDate: date ? date.trim() : undefined,
            lastCommitMessage: subjectParts.join('|').trim(),
          });
        }
      }
    } catch {
      // Remote branches might not exist
    }

    return branches;
  }

  /**
   * Find common merge base ancestor between source and target
   */
  async getMergeBase(repoPath: string, source: string, target: string): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    try {
      const { stdout } = await runGitCommand(['merge-base', target, source], {
        cwd: normalized,
      });
      return stdout.trim();
    } catch (err: any) {
      logger.error(`Failed to find merge base between ${source} and ${target}`, err);
      throw new Error(`Cannot find common merge base between branches '${source}' and '${target}'. Branches may have unrelated histories.`);
    }
  }

  /**
   * Get diff between branches (target...source)
   */
  async getDiff(repoPath: string, source: string, target: string, filePath?: string): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    const args = ['diff', `${target}...${source}`];
    if (filePath) {
      args.push('--', filePath);
    }
    const { stdout } = await runGitCommand(args, { cwd: normalized });
    return stdout;
  }

  /**
   * Get list of changed files between branches
   */
  async getChangedFiles(repoPath: string, source: string, target: string): Promise<string[]> {
    const normalized = normalizeRepoPath(repoPath);
    const { stdout } = await runGitCommand(['diff', '--name-only', `${target}...${source}`], {
      cwd: normalized,
    });
    if (!stdout) return [];
    return stdout.split('\n').map((f) => f.trim()).filter(Boolean);
  }

  /**
   * Get branch commit log relative to merge base
   */
  async getBranchCommits(repoPath: string, branch: string, mergeBase: string): Promise<string[]> {
    const normalized = normalizeRepoPath(repoPath);
    try {
      const { stdout } = await runGitCommand(
        ['log', '--oneline', `${mergeBase}..${branch}`],
        { cwd: normalized }
      );
      if (!stdout) return [];
      return stdout.split('\n').map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
}
