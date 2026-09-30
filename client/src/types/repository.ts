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

export interface GitStatusSummary {
  isClean: boolean;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}
