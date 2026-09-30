export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commitHash: string;
  lastCommitDate?: string;
  lastCommitMessage?: string;
}

export interface BranchComparison {
  sourceBranch: string;
  targetBranch: string;
  mergeBase: string;
  changedFiles: string[];
  diff: string;
}
