export interface RepositoryInfo {
  path: string;
  name: string;
  currentBranch: string;
  isClean: boolean;
  modifiedFilesCount: number;
  untrackedFilesCount: number;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commitHash: string;
  lastCommitDate?: string;
  lastCommitMessage?: string;
}

export interface GitStatusSummary {
  isClean: boolean;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
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

export interface GitGraphNode {
  hash: string;
  shortHash: string;
  parents: string[];
  author: {
    name: string;
    email: string;
  };
  date: string;
  relativeDate?: string;
  message: string;
  refs: string[];
  branches: string[];
  tags: string[];
  isHead: boolean;
  isMerge: boolean;
  mergeInfo?: {
    targetParent: string;
    sourceParent: string;
    sourceBranch?: string;
    targetBranch?: string;
  };
  column: number;
  color: string;
}

export interface GitGraphLink {
  fromHash: string;
  toHash: string;
  fromColumn: number;
  toColumn: number;
  fromRow: number;
  toRow: number;
  isMerge: boolean;
  color: string;
}

export interface GitGraphBranch {
  name: string;
  color: string;
  isCurrent: boolean;
  isRemote: boolean;
  tipHash: string;
}

export interface GitGraphData {
  nodes: GitGraphNode[];
  links: GitGraphLink[];
  branches: GitGraphBranch[];
  currentBranch: string;
  totalCommits: number;
  mergeCount: number;
}

