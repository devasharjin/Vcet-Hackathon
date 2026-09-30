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
   */
  async commit(repoPath: string, message = 'resolved merge conflict'): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    logger.info(`Creating commit in ${normalized}: "${message}"`);

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
    } = {}
  ): Promise<string> {
    const normalized = normalizeRepoPath(repoPath);
    const remote = options.remote || 'origin';
    const args = ['push'];

    if (options.setUpstream) args.push('-u');
    if (options.force) args.push('--force-with-lease');
    args.push(remote);
    if (options.branch) args.push(options.branch);

    logger.info(`Pushing changes: git ${args.join(' ')} in ${normalized}`);
    const { stdout, stderr } = await runGitCommand(args, { cwd: normalized });
    return (stdout || stderr).trim();
  }
}
