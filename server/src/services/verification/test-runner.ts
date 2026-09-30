import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { runShellCommand } from '../../utils/command.js';
import { VerificationCheck } from '../../types/resolution.types.js';
import { logger } from '../../utils/logger.js';

export class TestRunner {
  /**
   * Run build checks (npm run build, tsc, cargo check, go build, etc.)
   */
  async runBuildCheck(repoPath: string): Promise<VerificationCheck> {
    const start = Date.now();
    const pkgJsonPath = path.join(repoPath, 'package.json');

    // 1. Node / TypeScript project
    if (existsSync(pkgJsonPath)) {
      try {
        const pkgRaw = await fs.readFile(pkgJsonPath, 'utf-8');
        const pkg = JSON.parse(pkgRaw);

        if (pkg.scripts && pkg.scripts.build) {
          logger.info(`Running build verification: npm run build in ${repoPath}`);
          const res = await runShellCommand('npm run build', { cwd: repoPath, timeout: 45000 });
          const durationMs = Date.now() - start;

          if (res.exitCode !== 0) {
            return {
              id: 'project-build',
              name: 'Project Build (npm run build)',
              status: 'FAILED',
              message: 'Project build failed after conflict resolution.',
              output: `${res.stderr}\n${res.stdout}`.trim(),
              durationMs,
            };
          }

          return {
            id: 'project-build',
            name: 'Project Build (npm run build)',
            status: 'PASSED',
            message: 'Project built successfully without errors.',
            output: res.stdout || 'Build completed with exit code 0',
            durationMs,
          };
        }
      } catch (err: any) {
        logger.warn('Failed parsing package.json for build verification:', err.message);
      }
    }

    // 2. Python project (pyproject.toml or setup.py)
    if (existsSync(path.join(repoPath, 'pyproject.toml')) || existsSync(path.join(repoPath, 'setup.py'))) {
      const res = await runShellCommand('python -m py_compile **/*.py', { cwd: repoPath, timeout: 20000 });
      const durationMs = Date.now() - start;
      return {
        id: 'project-build',
        name: 'Python Syntax Verification',
        status: res.exitCode === 0 ? 'PASSED' : 'FAILED',
        message: res.exitCode === 0 ? 'Python files compiled without syntax errors.' : 'Python compilation reported errors.',
        output: `${res.stderr}\n${res.stdout}`.trim(),
        durationMs,
      };
    }

    // Default skipped if no build script configured
    return {
      id: 'project-build',
      name: 'Project Build',
      status: 'SKIPPED',
      message: 'No build script detected in repository configuration.',
      durationMs: Date.now() - start,
    };
  }

  /**
   * Run automated test suites (npm test, pytest, etc.)
   */
  async runTestCheck(repoPath: string): Promise<VerificationCheck> {
    const start = Date.now();
    const pkgJsonPath = path.join(repoPath, 'package.json');

    if (existsSync(pkgJsonPath)) {
      try {
        const pkgRaw = await fs.readFile(pkgJsonPath, 'utf-8');
        const pkg = JSON.parse(pkgRaw);

        // Don't run default npm placeholder "echo \"Error: no test specified\" && exit 1"
        if (pkg.scripts && pkg.scripts.test && !pkg.scripts.test.includes('no test specified')) {
          logger.info(`Running test suite: npm test in ${repoPath}`);
          const res = await runShellCommand('npm test', { cwd: repoPath, timeout: 60000 });
          const durationMs = Date.now() - start;

          if (res.exitCode !== 0) {
            return {
              id: 'test-suite',
              name: 'Automated Tests (npm test)',
              status: 'FAILED',
              message: 'One or more automated tests failed.',
              output: `${res.stderr}\n${res.stdout}`.trim(),
              durationMs,
            };
          }

          return {
            id: 'test-suite',
            name: 'Automated Tests (npm test)',
            status: 'PASSED',
            message: 'All automated tests passed successfully.',
            output: res.stdout || 'Tests passed with exit code 0',
            durationMs,
          };
        }
      } catch (err: any) {
        logger.warn('Failed parsing package.json for test suite:', err.message);
      }
    }

    return {
      id: 'test-suite',
      name: 'Automated Tests',
      status: 'SKIPPED',
      message: 'No test runner configured in repository.',
      durationMs: Date.now() - start,
    };
  }
}

export const testRunner = new TestRunner();
