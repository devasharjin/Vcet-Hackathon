export interface VerificationCheck {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  message: string;
  output?: string;
  durationMs?: number;
}

export interface VerificationResult {
  success: boolean;
  checks: VerificationCheck[];
  timestamp: string;
}

export interface ApplyResolutionResult {
  success: boolean;
  message: string;
  verificationPassed: boolean;
  verificationResult?: VerificationResult;
  commitHash?: string;
  filesApplied: string[];
}

export interface PushResult {
  success: boolean;
  output?: string;
  message?: string;
}

