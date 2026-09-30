export type ResolutionSource = 'ai_approved' | 'human_modified' | 'human_required';

export type ResolutionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';

export type SessionStatus =
  | 'INITIALIZED'
  | 'SIMULATING'
  | 'CONFLICTS_DETECTED'
  | 'NO_CONFLICTS'
  | 'ANALYZED'
  | 'APPROVED'
  | 'APPLIED'
  | 'VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'COMMITTED'
  | 'ROLLED_BACK';

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
