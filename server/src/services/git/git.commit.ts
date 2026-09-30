import { runGitCommand } from '../../utils/command.js';
import { normalizeRepoPath } from '../../utils/file.js';
import { logger } from '../../utils/logger.js';

export class GitCommitManager {
  /**
   * Stage specific resolved files
   */
  async stageFiles(repoPath: string, files: string[]): Promise<void> {
    const normalized = normalizeRepoPath(repoPath);
    if (!files.length) return;

    logger.info(`Staging files: ${files.join(', ')} in ${normalized}`);
    await runGitCommand(['add', ...files], { cwd: normalized });
  }

  /**
   * Commit resolved files with message "resolved merge conflict"
   * Supports dual-parent merge commits if merging from another branch
   */
  async commit(
    repoPath: string,
    message = 'resolved merge conflict',
    options?: { mergeBranch?: string; mergeParentHash?: string }
  ): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    logger.info(`Creating commit in ${normalized}: "${message}"`);

    // Check if git is currently in a merge state (.git/MERGE_HEAD exists)
    let mergeHead: string | null = null;
    try {
      const { stdout } = await runGitCommand(['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { cwd: normalized });
      if (stdout.trim()) mergeHead = stdout.trim();
    } catch {}

    // Or if mergeBranch is supplied, get its hash
    if (!mergeHead && options?.mergeParentHash) {
      mergeHead = options.mergeParentHash.trim();
    } else if (!mergeHead && options?.mergeBranch) {
      try {
        const { stdout } = await runGitCommand(['rev-parse', options.mergeBranch], { cwd: normalized });
        if (stdout.trim()) mergeHead = stdout.trim();
      } catch {}
    }

    if (mergeHead) {
      try {
        // Create dual-parent commit using write-tree + commit-tree
        const { stdout: headHash } = await runGitCommand(['rev-parse', 'HEAD'], { cwd: normalized });
        const { stdout: treeHash } = await runGitCommand(['write-tree'], { cwd: normalized });
        const { stdout: commitHash } = await runGitCommand(
          ['commit-tree', treeHash.trim(), '-p', headHash.trim(), '-p', mergeHead, '-m', message],
          { cwd: normalized }
        );
        const newCommit = commitHash.trim();
        // Update current branch ref to this commit
        await runGitCommand(['update-ref', 'HEAD', newCommit], { cwd: normalized });
        // Clean up MERGE_HEAD / MERGE_MSG if present
        try {
          const fs = await import('fs');
          const path = await import('path');
          const mergeHeadFile = path.join(normalized, '.git', 'MERGE_HEAD');
          const mergeMsgFile = path.join(normalized, '.git', 'MERGE_MSG');
          if (fs.existsSync(mergeHeadFile)) fs.unlinkSync(mergeHeadFile);
          if (fs.existsSync(mergeMsgFile)) fs.unlinkSync(mergeMsgFile);
        } catch {}

        logger.info(`Dual-parent merge commit created successfully: ${newCommit}`);
        return newCommit;
      } catch (err: any) {
        logger.warn(`Failed dual-parent commit-tree, falling back to standard commit: ${err.message}`);
      }
    }

    // Check if there are staged changes
    const { stdout: stagedChanges } = await runGitCommand(['diff', '--cached', '--name-only'], {
      cwd: normalized,
    }).catch(() => ({ stdout: '' }));

    const commitArgs = ['commit', '-m', message];
    if (!stagedChanges.trim()) {
      logger.info(`No staged file differences relative to HEAD; committing with --allow-empty`);
      commitArgs.push('--allow-empty');
    }

    await runGitCommand(commitArgs, {
      cwd: normalized,
    });

    // Get the created commit hash
    const { stdout: commitHash } = await runGitCommand(['rev-parse', 'HEAD'], {
      cwd: normalized,
    });

    logger.info(`Commit created successfully: ${commitHash}`);
    return commitHash.trim();
  }

  /**
   * Safe rollback using git checkout or git stash if needed
   */
  async rollbackFiles(repoPath: string, files: string[]): Promise<void> {
    const normalized = normalizeRepoPath(repoPath);
    logger.info(`Rolling back changes to files: ${files.join(', ')}`);

    for (const file of files) {
      try {
        await runGitCommand(['checkout', 'HEAD', '--', file], { cwd: normalized });
      } catch (err: any) {
        logger.warn(`Failed to checkout file ${file}: ${err.message}`);
      }
    }
  }

  /**
   * Push committed changes to remote repository
   */
  async push(
    repoPath: string,
    options: {
      remote?: string;
      branch?: string;
      setUpstream?: boolean;
      force?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    const remote = options.remote || 'origin';
    const args = ['push'];

    if (options.setUpstream !== false) args.push('-u');
    if (options.force) args.push('--force-with-lease');
    if (options.dryRun) args.push('--dry-run');
    args.push(remote);
    if (options.branch) args.push(options.branch);

    logger.info(`Pushing changes: git ${args.join(' ')} in ${normalized}`);
    const { stdout, stderr } = await runGitCommand(args, { cwd: normalized });
    return (stdout || stderr).trim();
  }
}
