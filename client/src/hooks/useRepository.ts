import { useState, useCallback } from 'react';
import { repositoryApi } from '../services/repositoryApi.js';
import { RepositoryInfo, GitStatusSummary } from '../types/repository.js';
import { BranchInfo } from '../types/branch.js';

export function useRepository() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [status, setStatus] = useState<GitStatusSummary | null>(null);

  const openRepository = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await repositoryApi.openRepository(path);
      setRepoInfo(data.info);
      setBranches(data.branches);
      setStatus(data.status);
      return data;
    } catch (err: any) {
      const msg = err.message || 'Failed to open repository';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async (path: string) => {
    try {
      const s = await repositoryApi.getStatus(path);
      setStatus(s);
    } catch (err: any) {
      console.error('Failed refreshing status:', err);
    }
  }, []);

  return {
    loading,
    error,
    repoInfo,
    branches,
    status,
    openRepository,
    refreshStatus,
    setRepoInfo,
    setBranches,
    setStatus,
  };
}
