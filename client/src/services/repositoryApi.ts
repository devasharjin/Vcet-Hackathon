import { apiClient } from './api.js';
import { RepositoryInfo, GitStatusSummary } from '../types/repository.js';
import { BranchInfo } from '../types/branch.js';

export interface OpenRepoResponse {
  info: RepositoryInfo;
  branches: BranchInfo[];
  status: GitStatusSummary;
}

export const repositoryApi = {
  async openRepository(path: string): Promise<OpenRepoResponse> {
    const res: any = await apiClient.post('/repositories/open', { path });
    return res.data;
  },

  async getInfo(path: string): Promise<RepositoryInfo> {
    const res: any = await apiClient.get('/repositories/info', { params: { path } });
    return res.data;
  },

  async getBranches(path: string): Promise<BranchInfo[]> {
    const res: any = await apiClient.get('/repositories/branches', { params: { path } });
    return res.data;
  },

  async getStatus(path: string): Promise<GitStatusSummary> {
    const res: any = await apiClient.get('/repositories/status', { params: { path } });
    return res.data;
  },

  async getRecentRepositories(): Promise<any[]> {
    const res: any = await apiClient.get('/repositories/recent');
    return res.data;
  },

  async createSampleRepo(): Promise<{ path: string; sourceBranch: string; targetBranch: string; message: string }> {
    const res: any = await apiClient.post('/demo/create-sample-repo');
    return res.data;
  },
};
