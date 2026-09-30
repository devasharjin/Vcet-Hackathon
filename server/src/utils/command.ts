import { execFile, exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execFilePromise = promisify(execFile);
const execPromise = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecGitOptions {
  cwd?: string;
  timeout?: number;
  maxBuffer?: number;
  env?: NodeJS.ProcessEnv;
}

/**
 * Execute Git commands safely using argument arrays.
 * Bypasses shell interpretation vulnerabilities and handles Windows paths cleanly.
 */
export async function runGitCommand(
  args: string[],
  options: ExecGitOptions = {}
): Promise<CommandResult> {
  const cwd = options.cwd || process.cwd();
  const timeout = options.timeout || 30000;
  const maxBuffer = options.maxBuffer || 10 * 1024 * 1024; // 10MB

  logger.debug(`Running git ${args.join(' ')} in ${cwd}`);

  try {
    const { stdout, stderr } = await execFilePromise('git', args, {
      cwd,
      timeout,
      maxBuffer,
      windowsHide: true,
      env: {
        ...process.env,
        ...options.env,
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8',
      },
    });

    return {
      stdout: (stdout || '').trim(),
      stderr: (stderr || '').trim(),
      exitCode: 0,
    };
  } catch (err: any) {
    const stdout = (err.stdout || '').trim();
    const stderr = (err.stderr || '').trim();
    const exitCode = typeof err.code === 'number' ? err.code : 1;

    logger.debug(`Git command failed: git ${args.join(' ')}`, { exitCode, stderr, stdout });

    const rawError = [stderr, stdout].filter(Boolean).join(' | ') || err.message || 'Unknown Git error';
    const error = new Error(`Git command failed [git ${args.join(' ')}]: ${rawError}`);
    (error as any).stdout = stdout;
    (error as any).stderr = stderr;
    (error as any).exitCode = exitCode;
    throw error;
  }
}

/**
 * Execute system shell command with safeguards (e.g. for verification scripts like npm test)
 */
export async function runShellCommand(
  cmd: string,
  options: ExecOptions = {}
): Promise<CommandResult> {
  const cwd = options.cwd?.toString() || process.cwd();
  const timeout = options.timeout || 60000;

  logger.debug(`Running shell: ${cmd} in ${cwd}`);

  try {
    const { stdout, stderr } = await execPromise(cmd, {
      cwd,
      timeout,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
      ...options,
    });

    return {
      stdout: String(stdout || '').trim(),
      stderr: String(stderr || '').trim(),
      exitCode: 0,
    };
  } catch (err: any) {
    return {
      stdout: String(err.stdout || '').trim(),
      stderr: String(err.stderr || err.message || '').trim(),
      exitCode: typeof err.code === 'number' ? err.code : 1,
    };
  }
}
