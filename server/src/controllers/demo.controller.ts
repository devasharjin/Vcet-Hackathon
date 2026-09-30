import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { runGitCommand } from '../utils/command.js';
import { safeWriteFile } from '../utils/file.js';
import { logger } from '../utils/logger.js';

export class DemoController {
  async createSampleRepo(req: Request, res: Response, next: NextFunction) {
    try {
      // Create demo repo inside the workspace directory
      const baseDir = path.resolve(process.cwd(), '..');
      const demoRepoPath = path.join(baseDir, 'demo-repo');

      logger.info(`Setting up demo repository at: ${demoRepoPath}`);

      if (existsSync(demoRepoPath)) {
        await fs.rm(demoRepoPath, { recursive: true, force: true });
      }
      await fs.mkdir(demoRepoPath, { recursive: true });

      // Initialize git
      await runGitCommand(['init', '-b', 'main'], { cwd: demoRepoPath });
      await runGitCommand(['config', 'user.name', 'MergeMind Demo'], { cwd: demoRepoPath });
      await runGitCommand(['config', 'user.email', 'demo@mergemind.local'], { cwd: demoRepoPath });

      // Create package.json so build/test verification works!
      const pkgJson = {
        name: 'coop-payment-service',
        version: '1.0.0',
        description: 'Payment microservice demonstration for MergeMind',
        scripts: {
          test: "node -e \"console.log('✓ All payment test suites passed.'); process.exit(0);\"",
          build: "node -e \"console.log('✓ Build compiled successfully.'); process.exit(0);\"",
        },
      };
      await safeWriteFile(
        path.join(demoRepoPath, 'package.json'),
        JSON.stringify(pkgJson, null, 2)
      );

      // Base payment service
      const basePaymentCode = `// Core payment processing service
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
}

export function validatePayment(amount: number): boolean {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }
  return true;
}

export const paymentGateway = {
  charge: (amount: number) => {
    console.log(\`Charging $\${amount}\`);
    return { success: true, transactionId: 'txn_base_99' };
  },
};

export function processPayment(amount: number) {
  validatePayment(amount);
  return paymentGateway.charge(amount);
}
`;
      await safeWriteFile(path.join(demoRepoPath, 'src', 'payment.ts'), basePaymentCode);

      // Commit on main (base)
      await runGitCommand(['add', '.'], { cwd: demoRepoPath });
      await runGitCommand(['commit', '-m', 'Initial commit: core payment processing'], {
        cwd: demoRepoPath,
      });

      // Create branch feature/payment from main
      await runGitCommand(['checkout', '-b', 'feature/payment'], { cwd: demoRepoPath });

      // feature/payment adds transaction logging and audit receipt
      const featurePaymentCode = `// Core payment processing service
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
}

export function validatePayment(amount: number): boolean {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }
  return true;
}

export const paymentGateway = {
  charge: (amount: number) => {
    console.log(\`Charging $\${amount}\`);
    return { success: true, transactionId: \`txn_\${Date.now()}\` };
  },
};

// Feature: Added transaction receipt capturing and confirmation logging
export function processPayment(amount: number) {
  validatePayment(amount);
  const transaction = paymentGateway.charge(amount);
  console.log(\`[Audit] Payment confirmed with ID: \${transaction.transactionId}\`);
  return transaction;
}
`;
      await safeWriteFile(path.join(demoRepoPath, 'src', 'payment.ts'), featurePaymentCode);
      await runGitCommand(['add', '.'], { cwd: demoRepoPath });
      await runGitCommand(['commit', '-m', 'feat: add transaction confirmation and audit logging'], {
        cwd: demoRepoPath,
      });

      // Switch back to main and make a conflicting commit adding retry logic!
      await runGitCommand(['checkout', 'main'], { cwd: demoRepoPath });

      const mainUpdatedCode = `// Core payment processing service
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
}

export function validatePayment(amount: number): boolean {
  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }
  return true;
}

export const paymentGateway = {
  charge: (amount: number) => {
    console.log(\`Charging $\${amount}\`);
    return { success: true, transactionId: 'txn_main_101' };
  },
};

// Main branch: Added resilient retry mechanism
export function processPayment(amount: number) {
  validatePayment(amount);
  let attempts = 0;
  while (attempts < 3) {
    try {
      return paymentGateway.charge(amount);
    } catch (err) {
      attempts++;
      if (attempts >= 3) throw err;
    }
  }
}
`;
      await safeWriteFile(path.join(demoRepoPath, 'src', 'payment.ts'), mainUpdatedCode);
      await runGitCommand(['add', '.'], { cwd: demoRepoPath });
      await runGitCommand(['commit', '-m', 'fix: implement 3-attempt payment retry handler'], {
        cwd: demoRepoPath,
      });

      logger.info(`Demo repository ready at ${demoRepoPath}`);

      res.status(200).json({
        success: true,
        data: {
          path: demoRepoPath,
          sourceBranch: 'feature/payment',
          targetBranch: 'main',
          message: 'Demo repository created with a realistic payment processing merge conflict!',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const demoController = new DemoController();
