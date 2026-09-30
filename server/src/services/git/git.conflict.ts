import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import { runGitCommand } from '../../utils/command.js';
import { normalizeRepoPath, detectLanguage } from '../../utils/file.js';
import { ConflictContext, ConflictHunk } from '../../types/conflict.types.js';
import { logger } from '../../utils/logger.js';

export interface SimulationResult {
  hasConflicts: boolean;
  conflictedFiles: string[];
  conflictContexts: ConflictContext[];
  mergeBase: string;
  simulationDir: string;
}

export class GitConflictManager {
  /**
   * Parse raw file text containing Git conflict markers
   */
  parseConflictMarkers(fileContent: string, filePath: string): ConflictHunk[] {
    const lines = fileContent.split('\n');
    const hunks: ConflictHunk[] = [];
    const language = detectLanguage(filePath);

    let inConflict = false;
    let inTheirs = false;
    let startLine = 0;
    let oursLines: string[] = [];
    let theirsLines: string[] = [];
    let surroundingLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('<<<<<<<')) {
        inConflict = true;
        inTheirs = false;
        startLine = i + 1;
        oursLines = [];
        theirsLines = [];
        // Capture 5 lines before conflict for context
        surroundingLines = lines.slice(Math.max(0, i - 5), i);
      } else if (line.startsWith('=======') && inConflict) {
        inTheirs = true;
      } else if (line.startsWith('>>>>>>>') && inConflict) {
        inConflict = false;
        const endLine = i + 1;

        // Capture 5 lines after conflict for context
        const afterContext = lines.slice(i + 1, Math.min(lines.length, i + 6));
        const fullSurrounding = [...surroundingLines, ...afterContext].join('\n');

        hunks.push({
          file: filePath,
          language,
          ours: oursLines.join('\n'),
          theirs: theirsLines.join('\n'),
          startLine,
          endLine,
          surroundingCode: fullSurrounding,
        });
      } else {
        if (inConflict) {
          if (!inTheirs) {
            oursLines.push(line);
          } else {
            theirsLines.push(line);
          }
        }
      }
    }

    return hunks;
  }

  /**
   * Simulate merge in an isolated temporary directory to detect conflicts safely
   */
  async simulateMerge(
    repoPath: string,
    sourceBranch: string,
    targetBranch: string,
    sessionId: string
  ): Promise<SimulationResult> {
    const normalized = normalizeRepoPath(repoPath);
    const simulationBaseDir = path.join(os.tmpdir(), 'mergemind-simulations');
    const simulationDir = path.join(simulationBaseDir, `${sessionId}`);

    // Clean up if already exists
    if (existsSync(simulationDir)) {
      await fs.rm(simulationDir, { recursive: true, force: true });
    }
    await fs.mkdir(simulationBaseDir, { recursive: true });

    logger.info(`Starting merge simulation in sandbox: ${simulationDir}`);

    try {
      // 1. Create a local clone sandbox
      await runGitCommand(['clone', '--local', '--no-hardlinks', normalized, simulationDir]);

      // 2. Fetch all local and remote branches from parent into sandbox
      await runGitCommand(['fetch', 'origin', '+refs/heads/*:refs/remotes/origin/*'], {
        cwd: simulationDir,
      }).catch(() => {});
      await runGitCommand(['fetch', 'origin', '+refs/remotes/*:refs/remotes/*'], {
        cwd: simulationDir,
      }).catch(() => {});

      // Helper to resolve a branch name to valid git ref in the sandbox
      const resolveBranchRef = async (name: string): Promise<string> => {
        const cleanName = name.replace(/^remotes\//, '');
        const candidates = [
          name,
          cleanName,
          `origin/${cleanName.replace(/^origin\//, '')}`,
          cleanName.replace(/^origin\//, ''),
        ];

        for (const candidate of candidates) {
          try {
            const { stdout } = await runGitCommand(['rev-parse', '--verify', candidate], {
              cwd: simulationDir,
            });
            if (stdout) return candidate;
          } catch {}
        }
        return name;
      };

      const targetRef = await resolveBranchRef(targetBranch);
      const sourceRef = await resolveBranchRef(sourceBranch);

      logger.info(`Resolved simulation refs: target='${targetRef}', source='${sourceRef}'`);

      // 3. Checkout target branch
      try {
        await runGitCommand(['checkout', targetRef], { cwd: simulationDir });
      } catch {
        const cleanTarget = targetRef.replace(/^origin\//, '').replace(/^remotes\//, '');
        try {
          await runGitCommand(['checkout', '-B', cleanTarget, targetRef], { cwd: simulationDir });
        } catch {
          await runGitCommand(['checkout', targetBranch], { cwd: simulationDir });
        }
      }

      // 4. Find merge base
      let mergeBase = '';
      try {
        const { stdout: mb } = await runGitCommand(['merge-base', targetRef, sourceRef], {
          cwd: simulationDir,
        });
        mergeBase = mb.trim();
      } catch {
        const { stdout: mb } = await runGitCommand(['merge-base', targetBranch, sourceBranch], {
          cwd: simulationDir,
        });
        mergeBase = mb.trim();
      }

      // 5. Attempt merge without committing
      let mergeOutput = '';
      try {
        const res = await runGitCommand(['merge', '--no-commit', '--no-ff', sourceRef], {
          cwd: simulationDir,
        });
        mergeOutput = res.stdout + ' ' + res.stderr;
      } catch (mergeErr: any) {
        mergeOutput = (mergeErr.stdout || '') + ' ' + (mergeErr.stderr || '');
      }

      // 6. Check for conflicted files via git status
      const { stdout: statusOut } = await runGitCommand(['status', '--porcelain'], {
        cwd: simulationDir,
      });

      const conflictedFiles: string[] = [];
      if (statusOut) {
        const lines = statusOut.split('\n');
        for (const line of lines) {
          if (!line || line.length < 3) continue;
          const code = line.substring(0, 2);
          const fPath = line.substring(3).trim();
          if (['UU', 'AA', 'UD', 'DU', 'DD', 'AU', 'UA'].includes(code)) {
            conflictedFiles.push(fPath);
          }
        }
      }

      logger.info(`Merge simulation found ${conflictedFiles.length} conflicted file(s)`);

      const conflictContexts: ConflictContext[] = [];

      for (const filePath of conflictedFiles) {
        // Read the file with conflict markers
        const fullPath = path.join(simulationDir, filePath);
        let rawContent = '';
        if (existsSync(fullPath)) {
          rawContent = await fs.readFile(fullPath, 'utf-8');
        }

        const hunks = this.parseConflictMarkers(rawContent, filePath);
        const language = detectLanguage(filePath);

        // Extract base version from git show :1:filePath
        let baseContent = '';
        try {
          const { stdout } = await runGitCommand(['show', `:1:${filePath}`], { cwd: simulationDir });
          baseContent = stdout;
        } catch {
          // If not in stage 1, try merge base
          try {
            const { stdout } = await runGitCommand(['show', `${mergeBase}:${filePath}`], {
              cwd: simulationDir,
            });
            baseContent = stdout;
          } catch {
            baseContent = '';
          }
        }

        // Extract ours (target) version from git show :2:filePath
        let oursContent = '';
        try {
          const { stdout } = await runGitCommand(['show', `:2:${filePath}`], { cwd: simulationDir });
          oursContent = stdout;
        } catch {
          oursContent = '';
        }

        // Extract theirs (source) version from git show :3:filePath
        let theirsContent = '';
        try {
          const { stdout } = await runGitCommand(['show', `:3:${filePath}`], { cwd: simulationDir });
          theirsContent = stdout;
        } catch {
          theirsContent = '';
        }

        // Diff target against base
        let diffTargetAgainstBase = '';
        try {
          const { stdout } = await runGitCommand(['diff', `${mergeBase}..${targetRef}`, '--', filePath], {
            cwd: simulationDir,
          });
          diffTargetAgainstBase = stdout;
        } catch {}

        // Diff source against base
        let diffSourceAgainstBase = '';
        try {
          const { stdout } = await runGitCommand(['diff', `${mergeBase}..${sourceRef}`, '--', filePath], {
            cwd: simulationDir,
          });
          diffSourceAgainstBase = stdout;
        } catch {}

        // Commit logs affecting this file on source and target
        let sourceCommits: string[] = [];
        try {
          const { stdout } = await runGitCommand(
            ['log', '--oneline', `${mergeBase}..${sourceRef}`, '--', filePath],
            { cwd: simulationDir }
          );
          sourceCommits = stdout ? stdout.split('\n').filter(Boolean) : [];
        } catch {}

        let targetCommits: string[] = [];
        try {
          const { stdout } = await runGitCommand(
            ['log', '--oneline', `${mergeBase}..${targetRef}`, '--', filePath],
            { cwd: simulationDir }
          );
          targetCommits = stdout ? stdout.split('\n').filter(Boolean) : [];
        } catch {}

        conflictContexts.push({
          filePath,
          language,
          baseContent,
          oursContent,
          theirsContent,
          conflictedContent: rawContent,
          diffTargetAgainstBase,
          diffSourceAgainstBase,
          sourceBranch,
          targetBranch,
          sourceCommits,
          targetCommits,
          hunks,
        });
      }

      return {
        hasConflicts: conflictedFiles.length > 0,
        conflictedFiles,
        conflictContexts,
        mergeBase: mergeBase.trim(),
        simulationDir,
      };
    } catch (err: any) {
      logger.error('Merge simulation failed:', err);
      // Clean up on error
      if (existsSync(simulationDir)) {
        await fs.rm(simulationDir, { recursive: true, force: true }).catch(() => {});
      }
      throw new Error(`Merge simulation failed: ${err.message}`);
    }
  }

  /**
   * Safely clean up temporary simulation directory
   */
  async cleanupSimulation(simulationDir: string): Promise<void> {
    if (existsSync(simulationDir)) {
      try {
        await fs.rm(simulationDir, { recursive: true, force: true });
        logger.info(`Cleaned up simulation directory: ${simulationDir}`);
      } catch (err: any) {
        logger.warn(`Could not delete temporary simulation directory: ${simulationDir}`, err);
      }
    }
  }
}
