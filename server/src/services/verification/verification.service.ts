import { syntaxChecker } from './syntax-checker.js';
import { testRunner } from './test-runner.js';
import { gitService } from '../git/git.service.js';
import { VerificationResult, VerificationCheck } from '../../types/resolution.types.js';
import { logger } from '../../utils/logger.js';

export class VerificationService {
  /**
   * Run comprehensive verification pipeline
   */
  async verifyRepository(repoPath: string, filePaths: string[]): Promise<VerificationResult> {
    logger.info(`Initiating verification pipeline for ${repoPath} on files: ${filePaths.join(', ')}`);

    const checks: VerificationCheck[] = [];

    // 1. Conflict Markers Check
    const markerCheck = await syntaxChecker.checkConflictMarkers(repoPath, filePaths);
    checks.push(markerCheck);

    // 2. Syntax & Structural Balance Check
    const syntaxCheck = await syntaxChecker.checkSyntaxIntegrity(repoPath, filePaths);
    checks.push(syntaxCheck);

    // 3. Project Build Check
    const buildCheck = await testRunner.runBuildCheck(repoPath);
    checks.push(buildCheck);

    // 4. Automated Tests Check
    const testCheck = await testRunner.runTestCheck(repoPath);
    checks.push(testCheck);

    // 5. Git Integrity Check
    const gitStart = Date.now();
    try {
      const status = await gitService.getStatus(repoPath);
      checks.push({
        id: 'git-integrity',
        name: 'Git Status & Integrity',
        status: status.conflicted.length === 0 ? 'PASSED' : 'FAILED',
        message: status.conflicted.length === 0
          ? 'Git working tree is in a valid state.'
          : `Unresolved git status conflicts detected: ${status.conflicted.join(', ')}`,
        output: `Modified: ${status.modified.length}, Staged: ${status.staged.length}, Conflicted: ${status.conflicted.length}`,
        durationMs: Date.now() - gitStart,
      });
    } catch (err: any) {
      checks.push({
        id: 'git-integrity',
        name: 'Git Status & Integrity',
        status: 'FAILED',
        message: `Failed to inspect git repository status: ${err.message}`,
        durationMs: Date.now() - gitStart,
      });
    }

    // Success if NO checks failed (skipped is acceptable)
    const success = checks.every((c) => c.status !== 'FAILED');

    return {
      success,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

export const verificationService = new VerificationService();
