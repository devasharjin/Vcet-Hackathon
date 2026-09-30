import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { VerificationCheck } from '../../types/resolution.types.js';

export class SyntaxChecker {
  /**
   * Check that no conflict markers remain anywhere in resolved files
   */
  async checkConflictMarkers(repoPath: string, filePaths: string[]): Promise<VerificationCheck> {
    const start = Date.now();
    const problematicFiles: string[] = [];

    for (const relPath of filePaths) {
      const fullPath = path.join(repoPath, relPath);
      if (!existsSync(fullPath)) continue;

      const content = await fs.readFile(fullPath, 'utf-8');
      if (
        content.includes('<<<<<<<') ||
        content.includes('=======') ||
        content.includes('>>>>>>>')
      ) {
        problematicFiles.push(relPath);
      }
    }

    const durationMs = Date.now() - start;

    if (problematicFiles.length > 0) {
      return {
        id: 'conflict-markers',
        name: 'No Conflict Markers',
        status: 'FAILED',
        message: `Found unresolved conflict markers in: ${problematicFiles.join(', ')}`,
        output: `Files containing <<<<<<<, =======, or >>>>>>>:\n${problematicFiles.map((f) => ` - ${f}`).join('\n')}`,
        durationMs,
      };
    }

    return {
      id: 'conflict-markers',
      name: 'No Conflict Markers',
      status: 'PASSED',
      message: 'All conflict markers successfully cleared across resolved files.',
      output: `Checked ${filePaths.length} file(s). Zero conflict markers detected.`,
      durationMs,
    };
  }

  /**
   * Verify file system integrity and basic syntax (e.g. balanced braces)
   */
  async checkSyntaxIntegrity(repoPath: string, filePaths: string[]): Promise<VerificationCheck> {
    const start = Date.now();
    const issues: string[] = [];

    for (const relPath of filePaths) {
      const fullPath = path.join(repoPath, relPath);
      if (!existsSync(fullPath)) {
        issues.push(`File missing: ${relPath}`);
        continue;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const ext = path.extname(relPath).toLowerCase();

      // Check balanced braces for JS/TS/JSON
      if (['.ts', '.tsx', '.js', '.jsx', '.json'].includes(ext)) {
        let braces = 0;
        let parens = 0;
        let brackets = 0;

        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          if (char === '{') braces++;
          else if (char === '}') braces--;
          else if (char === '(') parens++;
          else if (char === ')') parens--;
          else if (char === '[') brackets++;
          else if (char === ']') brackets--;
        }

        if (braces !== 0) issues.push(`${relPath}: Unbalanced curly braces { } (diff: ${braces})`);
        if (parens !== 0) issues.push(`${relPath}: Unbalanced parentheses ( ) (diff: ${parens})`);
        if (brackets !== 0) issues.push(`${relPath}: Unbalanced square brackets [ ] (diff: ${brackets})`);
      }
    }

    const durationMs = Date.now() - start;

    if (issues.length > 0) {
      return {
        id: 'syntax-integrity',
        name: 'Language Syntax Integrity',
        status: 'FAILED',
        message: 'Syntax irregularities detected in resolved files.',
        output: issues.join('\n'),
        durationMs,
      };
    }

    return {
      id: 'syntax-integrity',
      name: 'Language Syntax Integrity',
      status: 'PASSED',
      message: 'Syntax and code structure validated successfully.',
      output: `Validated structural balance and file readability for ${filePaths.length} file(s).`,
      durationMs,
    };
  }
}

export const syntaxChecker = new SyntaxChecker();
