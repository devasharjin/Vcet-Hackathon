import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { runGitCommand } from '../../utils/command.js';
import { normalizeRepoPath, isPathAccessible } from '../../utils/file.js';
import {
  RepositoryInfo,
  GitStatusSummary,
  GitRemoteInfo,
  GitGraphNode,
  GitGraphLink,
  GitGraphBranch,
  GitGraphData,
} from '../../types/repository.types.js';
import { DataStore } from '../../models/store.js';
import { logger } from '../../utils/logger.js';

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;
  const match = url.trim().match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }
  return null;
}

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
   * Get configured Git remotes
   */
  async getRemotes(repoPath: string): Promise<GitRemoteInfo[]> {
    const normalized = normalizeRepoPath(repoPath);
    try {
      const { stdout } = await runGitCommand(['remote', '-v'], {
        cwd: normalized,
      });

      if (!stdout) return [];

      const remotesMap = new Map<string, { name: string; fetchUrl: string; pushUrl: string }>();
      const lines = stdout.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const name = parts[0];
          const url = parts[1];
          const type = parts[2] || '';
          const existing = remotesMap.get(name) || { name, fetchUrl: '', pushUrl: '' };
          if (type.includes('push')) {
            existing.pushUrl = url;
          } else {
            existing.fetchUrl = url;
          }
          remotesMap.set(name, existing);
        }
      }

      return Array.from(remotesMap.values()).map((r) => {
        const url = r.pushUrl || r.fetchUrl;
        const gh = parseGitHubUrl(url);
        return {
          name: r.name,
          fetchUrl: r.fetchUrl,
          pushUrl: r.pushUrl,
          url,
          isGitHub: !!gh,
          githubOwner: gh?.owner,
          githubRepo: gh?.repo,
        };
      });
    } catch (err: any) {
      logger.warn(`Failed to get remotes for ${normalized}: ${err.message}`);
      return [];
    }
  }

  /**
   * Add or update a Git remote (e.g. origin)
   */
  async setRemote(repoPath: string, name = 'origin', url: string): Promise<void> {
    const normalized = normalizeRepoPath(repoPath);
    logger.info(`Setting remote ${name} to ${url} in ${normalized}`);

    try {
      const { stdout } = await runGitCommand(['remote'], { cwd: normalized });
      const existing = stdout.split('\n').map((s) => s.trim()).filter(Boolean);

      if (existing.includes(name)) {
        await runGitCommand(['remote', 'set-url', name, url], { cwd: normalized });
      } else {
        await runGitCommand(['remote', 'add', name, url], { cwd: normalized });
      }
    } catch (err: any) {
      logger.error(`Failed to set remote ${name} in ${normalized}:`, err);
      throw err;
    }
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

  /**
   * Get full Git DAG graph topology including branches, parents, and merges
   */
  async getGitGraph(
    repoPath: string,
    options?: { branch?: string; limit?: number }
  ): Promise<GitGraphData> {
    const normalized = normalizeRepoPath(repoPath);
    const limit = options?.limit || 150;
    const currentBranch = await this.getCurrentBranch(normalized);

    // 1. Get raw commits via git log
    // %H = hash, %P = parents, %an = author name, %ae = author email, %aI = strict ISO date, %s = subject, %D = ref names
    let logLines: string[] = [];
    try {
      const gitArgs = [
        'log',
        '--topo-order',
        `--format=%H|%P|%an|%ae|%aI|%s|%D`,
        `-n`,
        String(limit),
      ];
      if (options?.branch && options.branch !== 'ALL') {
        gitArgs.push(options.branch);
      } else {
        gitArgs.push('--all');
      }

      const { stdout } = await runGitCommand(gitArgs, { cwd: normalized });
      if (stdout && stdout.trim()) {
        logLines = stdout.trim().split('\n');
      }
    } catch (err: any) {
      logger.warn(`Failed to execute git log for graph: ${err.message}`);
      return {
        nodes: [],
        links: [],
        branches: [],
        currentBranch,
        totalCommits: 0,
        mergeCount: 0,
      };
    }

    // 2. Fetch branches
    const branches: GitGraphBranch[] = [];
    try {
      const { stdout: bOut } = await runGitCommand(['branch', '-a', '-v', '--no-abbrev'], {
        cwd: normalized,
      });
      if (bOut) {
        const bLines = bOut.split('\n');
        for (const line of bLines) {
          if (!line.trim()) continue;
          const isCurr = line.startsWith('*');
          const cleanLine = line.replace(/^[\*\s]+/, '').trim();
          const parts = cleanLine.split(/\s+/);
          const bName = parts[0];
          const tipHash = parts[1] || '';
          if (bName && !bName.includes('HEAD detached')) {
            branches.push({
              name: bName,
              color: '',
              isCurrent: isCurr,
              isRemote: bName.startsWith('remotes/') || bName.startsWith('origin/'),
              tipHash,
            });
          }
        }
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch branches for graph: ${err.message}`);
    }

    // Accessible, high-contrast vibrant lane color palette
    const LANE_COLORS = [
      '#58a6ff', // 0: GitHub Blue (main line)
      '#a371f7', // 1: Lavender / Violet
      '#3fb950', // 2: Emerald Green
      '#f0883e', // 3: Orange / Amber
      '#f778ba', // 4: Pink / Magenta
      '#79c0ff', // 5: Cyan
      '#e3b341', // 6: Gold
      '#2ea043', // 7: Lime Green
      '#ec6547', // 8: Coral
      '#db61a2', // 9: Berry
    ];

    // Assign branch colors and build branch tip map
    const branchTipMap = new Map<string, string>();
    branches.forEach((b, idx) => {
      b.color = LANE_COLORS[idx % LANE_COLORS.length];
      if (b.tipHash) {
        branchTipMap.set(b.name, b.tipHash);
        const cleanName = b.name.replace(/^(remotes\/|origin\/)/, '');
        branchTipMap.set(cleanName, b.tipHash);
      }
    });

    // Check DataStore history for any merge resolution sessions associated with this repo
    let repoSessions: any[] = [];
    try {
      const recentSessions = await DataStore.listSessions(30);
      repoSessions = recentSessions.filter((s: any) => {
        if (!s.repositoryPath) return false;
        const normS = normalizeRepoPath(s.repositoryPath);
        return normS === normalized || normalized.includes(normS) || normS.includes(normalized);
      });
    } catch {}

    // 3. Parse commits
    interface RawCommit {
      hash: string;
      shortHash: string;
      parents: string[];
      author: { name: string; email: string };
      date: string;
      relativeDate: string;
      message: string;
      refs: string[];
      branches: string[];
      tags: string[];
      isHead: boolean;
      isMerge: boolean;
      mergeInfo?: {
        targetParent: string;
        sourceParent: string;
        sourceBranch?: string;
        targetBranch?: string;
      };
    }

    const rawCommits: RawCommit[] = [];
    let mergeCount = 0;

    for (const line of logLines) {
      if (!line) continue;
      const [hash, parentsStr, an, ae, date, message, refStr] = line.split('|');
      if (!hash) continue;

      let parents = parentsStr ? parentsStr.trim().split(/\s+/).filter(Boolean) : [];

      // Auto-detect merge resolution if two branches were merged but only 1 parent was recorded
      if (parents.length === 1) {
        const mergeBranchMatch = (message || '').match(/Merge branch '([^']+)'(?: into ([^\s]+))?/i);
        if (mergeBranchMatch) {
          const sourceBranchName = mergeBranchMatch[1];
          const cleanSource = sourceBranchName.replace(/^(remotes\/|origin\/)/, '');
          const p2 = branchTipMap.get(sourceBranchName) || branchTipMap.get(cleanSource);
          if (p2 && p2 !== parents[0] && !parents.includes(p2)) {
            parents.push(p2);
          }
        } else if ((message || '').includes('resolved merge conflict') || (message || '').includes('MergeMind')) {
          const matchedSession = repoSessions.find(
            (s: any) =>
              s.commitHash === hash ||
              s.status === 'COMMITTED' ||
              s.status === 'APPLIED' ||
              s.status === 'NO_CONFLICTS'
          );
          if (matchedSession && matchedSession.sourceBranch) {
            const cleanSource = matchedSession.sourceBranch.replace(/^(remotes\/|origin\/)/, '');
            const p2 = branchTipMap.get(matchedSession.sourceBranch) || branchTipMap.get(cleanSource);
            if (p2 && p2 !== parents[0] && !parents.includes(p2)) {
              parents.push(p2);
            }
          }
        }
      }

      const isMerge = parents.length >= 2;
      if (isMerge) mergeCount++;

      // Parse refs
      const rawRefs = refStr ? refStr.split(',').map((r) => r.trim()).filter(Boolean) : [];
      const bList: string[] = [];
      const tagList: string[] = [];
      let isHead = false;

      for (const r of rawRefs) {
        if (r.startsWith('HEAD ->')) {
          isHead = true;
          bList.push(r.replace('HEAD ->', '').trim());
        } else if (r === 'HEAD') {
          isHead = true;
        } else if (r.startsWith('tag:')) {
          tagList.push(r.replace('tag:', '').trim());
        } else {
          bList.push(r);
        }
      }

      // Parse merge details if merge commit
      let mergeInfo = undefined;
      if (isMerge) {
        let sourceBranch = '';
        let targetBranch = '';

        const mergeBranchMatch = (message || '').match(/Merge branch '([^']+)'(?: into ([^\s]+))?/i);
        if (mergeBranchMatch) {
          sourceBranch = mergeBranchMatch[1];
          targetBranch = mergeBranchMatch[2] || '';
        } else {
          const prMatch = (message || '').match(/Merge pull request #\d+ from ([^\s]+)/i);
          if (prMatch) {
            sourceBranch = prMatch[1];
          } else {
            // Find branch matching parents[1] from branchTipMap
            for (const [bName, bHash] of branchTipMap.entries()) {
              if (bHash === parents[1] && !bName.startsWith('remotes/')) {
                sourceBranch = bName;
                break;
              }
            }
          }
        }

        mergeInfo = {
          targetParent: parents[0],
          sourceParent: parents[1],
          sourceBranch: sourceBranch || undefined,
          targetBranch: targetBranch || undefined,
        };
      }

      // Format relative date
      const commitDate = new Date(date);
      const now = Date.now();
      const diffSec = Math.floor((now - commitDate.getTime()) / 1000);
      let relativeDate = 'just now';
      if (diffSec >= 86400) {
        const days = Math.floor(diffSec / 86400);
        relativeDate = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (diffSec >= 3600) {
        const hours = Math.floor(diffSec / 3600);
        relativeDate = `${hours} hr${hours > 1 ? 's' : ''} ago`;
      } else if (diffSec >= 60) {
        const mins = Math.floor(diffSec / 60);
        relativeDate = `${mins} min${mins > 1 ? 's' : ''} ago`;
      }

      rawCommits.push({
        hash,
        shortHash: hash.substring(0, 7),
        parents,
        author: { name: an || 'Unknown', email: ae || '' },
        date,
        relativeDate,
        message: message || '',
        refs: rawRefs,
        branches: bList,
        tags: tagList,
        isHead,
        isMerge,
        mergeInfo,
      });
    }

    // 4. Topological Lane Assignment
    const activeLanes: (string | null)[] = [];
    const commitMap = new Map<string, { node: GitGraphNode; row: number }>();
    const nodes: GitGraphNode[] = [];

    for (let row = 0; row < rawCommits.length; row++) {
      const commit = rawCommits[row];

      // Find if this commit hash is already assigned to a lane
      let laneIndex = activeLanes.indexOf(commit.hash);
      if (laneIndex === -1) {
        // Find first empty slot or allocate a new lane
        laneIndex = activeLanes.indexOf(null);
        if (laneIndex === -1) {
          laneIndex = activeLanes.length;
          activeLanes.push(commit.hash);
        } else {
          activeLanes[laneIndex] = commit.hash;
        }
      }

      const col = laneIndex;
      const color = LANE_COLORS[col % LANE_COLORS.length];

      // Free current commit's slot
      activeLanes[laneIndex] = null;

      // Primary parent stays in the current lane
      if (commit.parents.length > 0) {
        const p1 = commit.parents[0];
        activeLanes[laneIndex] = p1;
      }

      // Merge parent(s) get placed in separate lanes to cleanly show divergence & convergence
      for (let pIdx = 1; pIdx < commit.parents.length; pIdx++) {
        const pMerge = commit.parents[pIdx];
        if (!activeLanes.includes(pMerge)) {
          let emptySlot = activeLanes.indexOf(null);
          if (emptySlot === -1) {
            emptySlot = activeLanes.length;
            activeLanes.push(pMerge);
          } else {
            activeLanes[emptySlot] = pMerge;
          }
        }
      }

      const node: GitGraphNode = {
        ...commit,
        column: col,
        color,
      };

      nodes.push(node);
      commitMap.set(commit.hash, { node, row });
    }

    // 5. Generate DAG links between nodes and their parents
    const links: GitGraphLink[] = [];

    for (let row = 0; row < nodes.length; row++) {
      const node = nodes[row];
      for (let pIdx = 0; pIdx < node.parents.length; pIdx++) {
        const parentHash = node.parents[pIdx];
        const parentInfo = commitMap.get(parentHash);
        const isMergeLink = pIdx > 0;

        if (parentInfo) {
          links.push({
            fromHash: node.hash,
            toHash: parentHash,
            fromColumn: node.column,
            toColumn: parentInfo.node.column,
            fromRow: row,
            toRow: parentInfo.row,
            isMerge: isMergeLink,
            color: isMergeLink ? parentInfo.node.color : node.color,
          });
        } else {
          // Parent is beyond our commit limit window, continue downwards
          links.push({
            fromHash: node.hash,
            toHash: parentHash,
            fromColumn: node.column,
            toColumn: node.column,
            fromRow: row,
            toRow: row + 1,
            isMerge: isMergeLink,
            color: node.color,
          });
        }
      }
    }

    return {
      nodes,
      links,
      branches,
      currentBranch,
      totalCommits: nodes.length,
      mergeCount,
    };
  }

  /**
   * Helper to create a clean merge commit between two branches for demonstration/testing
   */
  async createSampleMerge(repoPath: string): Promise<{ success: boolean; mergeHash: string; message: string }> {
    const normalized = normalizeRepoPath(repoPath);
    const branchName = `feature/demo-auth-${Date.now().toString(36).substring(4)}`;
    const currentBranch = await this.getCurrentBranch(normalized);

    // Create and checkout new branch
    await runGitCommand(['checkout', '-b', branchName], { cwd: normalized });

    // Make a commit on the feature branch
    const demoFile = path.join(normalized, 'DEMO_FEATURE.md');
    await fs.writeFile(demoFile, `# Demo Feature\nBranch: ${branchName}\nCreated at: ${new Date().toISOString()}\n`);
    await runGitCommand(['add', '.'], { cwd: normalized });
    await runGitCommand(['commit', '-m', `feat: implement OAuth2 authentication on ${branchName}`], { cwd: normalized });

    // Switch back to target branch
    await runGitCommand(['checkout', currentBranch], { cwd: normalized });

    // Make a commit on target branch
    const mainDemoFile = path.join(normalized, 'CHANGELOG.md');
    let existingLog = '';
    try {
      existingLog = await fs.readFile(mainDemoFile, 'utf-8');
    } catch {}
    await fs.writeFile(mainDemoFile, existingLog + `\n- Update build pipeline (${new Date().toLocaleTimeString()})\n`);
    await runGitCommand(['add', '.'], { cwd: normalized });
    await runGitCommand(['commit', '-m', `chore: update changelog and pipeline on ${currentBranch}`], { cwd: normalized });

    // Merge feature branch into target branch with --no-ff to create explicit merge commit!
    await runGitCommand(
      ['merge', '--no-ff', branchName, '-m', `Merge branch '${branchName}' into ${currentBranch}`],
      { cwd: normalized }
    );

    const { stdout: revOut } = await runGitCommand(['rev-parse', 'HEAD'], { cwd: normalized });
    const mergeHash = revOut.trim();

    return {
      success: true,
      mergeHash,
      message: `Cleanly merged branch '${branchName}' into '${currentBranch}'. Merge commit created: ${mergeHash.substring(0, 7)}`,
    };
  }
}
