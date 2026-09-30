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

export interface AnalysisSession {
  _id: string;
  repositoryId: string;
  repositoryPath: string;
  sourceBranch: string;
  targetBranch: string;
  mergeBase: string;
  status: SessionStatus;
  conflictCount: number;
  resolvedCount: number;
  commitHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface OperationLogItem {
  sessionId: string;
  operation: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
  message: string;
  meta?: any;
  timestamp: string;
}
