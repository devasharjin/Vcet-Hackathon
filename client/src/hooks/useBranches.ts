import { useState, useCallback } from 'react';
import { BranchInfo } from '../types/branch.js';
import { repositoryApi } from '../services/repositoryApi.js';

export function useBranches(initialBranches: BranchInfo[] = []) {
  const [branches, setBranches] = useState<BranchInfo[]>(initialBranches);
  const [sourceBranch, setSourceBranch] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(async (repoPath: string) => {
    setLoading(true);
    try {
      const data = await repositoryApi.getBranches(repoPath);
      setBranches(data);

      const current = data.find((b) => b.isCurrent);
      if (current) {
        setTargetBranch(current.name);
      } else if (data.length > 0) {
        setTargetBranch(data[0].name);
      }

      // Default source branch to another branch if available
      const other = data.find((b) => !b.isCurrent && !b.isRemote);
      if (other) {
        setSourceBranch(other.name);
      }
    } catch (err) {
      console.error('Failed fetching branches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    branches,
    sourceBranch,
    targetBranch,
    setSourceBranch,
    setTargetBranch,
    fetchBranches,
    setBranches,
    loading,
  };
}
