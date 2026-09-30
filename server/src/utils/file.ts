import path from 'path';
import fs from 'fs/promises';
import { existsSync, constants } from 'fs';
import os from 'os';
import { logger } from './logger.js';

/**
 * Normalize Windows and Unix file paths safely.
 * Handles both C:/path and C:\path.
 */
export function normalizeRepoPath(rawPath: string): string {
  if (!rawPath) return '';
  let cleaned = rawPath.trim();
  // Strip enclosing quotes if user copied path with quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return path.normalize(path.resolve(cleaned));
}

/**
 * Verify if path exists and is accessible
 */
export async function isPathAccessible(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath, constants.R_OK | constants.W_OK);
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Safe write file with directory creation
 */
export async function safeWriteFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Create safety backup directory before applying changes
 */
export async function createBackup(repoPath: string, filePaths: string[]): Promise<string> {
  const timestamp = Date.now();
  const backupDir = path.join(os.tmpdir(), 'mergemind-backups', `${path.basename(repoPath)}-${timestamp}`);
  await fs.mkdir(backupDir, { recursive: true });

  for (const relativePath of filePaths) {
    const src = path.join(repoPath, relativePath);
    const dest = path.join(backupDir, relativePath);
    if (existsSync(src)) {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
  }

  logger.info(`Safety backup created at ${backupDir}`);
  return backupDir;
}

/**
 * Restore from safety backup directory
 */
export async function restoreBackup(repoPath: string, backupDir: string): Promise<void> {
  if (!existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  async function copyRecursive(src: string, dest: string) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await copyRecursive(srcPath, destPath);
      } else {
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  await copyRecursive(backupDir, repoPath);
  logger.info(`Restored repository from backup: ${backupDir}`);
}

/**
 * Detect language by file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return 'javascript';
    case '.py':
      return 'python';
    case '.json':
      return 'json';
    case '.html':
      return 'html';
    case '.css':
    case '.scss':
    case '.less':
      return 'css';
    case '.java':
      return 'java';
    case '.go':
      return 'go';
    case '.rs':
      return 'rust';
    case '.cpp':
    case '.c':
    case '.h':
      return 'cpp';
    case '.cs':
      return 'csharp';
    case '.php':
      return 'php';
    case '.rb':
      return 'ruby';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.md':
      return 'markdown';
    case '.sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}
