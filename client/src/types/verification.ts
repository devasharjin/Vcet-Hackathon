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

export interface GitRemoteInfo {
  name: string;
  fetchUrl: string;
  pushUrl: string;
  url: string;
  isGitHub: boolean;
  githubOwner?: string;
  githubRepo?: string;
}

export interface PushResult {
  success: boolean;
  output?: string;
  message?: string;
  remote?: string;
  branch?: string;
  commitHash?: string;
  remoteUrl?: string;
  githubRepoUrl?: string;
  githubCommitUrl?: string;
  githubCompareUrl?: string;
  isGitHub?: boolean;
}

