import React, { createContext, useContext, useState, useEffect } from 'react';
import { RepositoryInfo, GitStatusSummary } from '../types/repository.js';
import { BranchInfo } from '../types/branch.js';
import { repositoryApi } from '../services/repositoryApi.js';

interface RepositoryContextType {
  currentRepo: RepositoryInfo | null;
  branches: BranchInfo[];
  status: GitStatusSummary | null;
  loading: boolean;
  error: string | null;
  openRepo: (path: string) => Promise<any>;
  refreshRepo: () => Promise<void>;
  createDemoRepo: () => Promise<{ path: string; sourceBranch: string; targetBranch: string }>;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRepo, setCurrentRepo] = useState<RepositoryInfo | null>(() => {
    const saved = localStorage.getItem('mergemind_current_repo');
    return saved ? JSON.parse(saved) : null;
  });
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [status, setStatus] = useState<GitStatusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    return localStorage.getItem('mergemind_active_session');
  });

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('mergemind_active_session', activeSessionId);
    } else {
      localStorage.removeItem('mergemind_active_session');
    }
  }, [activeSessionId]);

  const openRepo = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await repositoryApi.openRepository(path);
      setCurrentRepo(data.info);
      setBranches(data.branches);
      setStatus(data.status);
      localStorage.setItem('mergemind_current_repo', JSON.stringify(data.info));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed opening repository');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshRepo = async () => {
    if (!currentRepo) return;
    try {
      const info = await repositoryApi.getInfo(currentRepo.path);
      const bList = await repositoryApi.getBranches(currentRepo.path);
      const stat = await repositoryApi.getStatus(currentRepo.path);
      setCurrentRepo(info);
      setBranches(bList);
      setStatus(stat);
    } catch (err: any) {
      console.error('Error refreshing repo:', err);
    }
  };

  const createDemoRepo = async () => {
    setLoading(true);
    try {
      const demoData = await repositoryApi.createSampleRepo();
      await openRepo(demoData.path);
      return demoData;
    } finally {
      setLoading(false);
    }
  };

  return (
    <RepositoryContext.Provider
      value={{
        currentRepo,
        branches,
        status,
        loading,
        error,
        openRepo,
        refreshRepo,
        createDemoRepo,
        activeSessionId,
        setActiveSessionId,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepositoryContext = () => {
  const ctx = useContext(RepositoryContext);
  if (!ctx) {
    throw new Error('useRepositoryContext must be used within RepositoryProvider');
  }
  return ctx;
};
