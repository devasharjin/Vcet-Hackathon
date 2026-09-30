import { apiClient } from './api.js';
import { ConflictItem } from '../types/conflict.js';
import { AnalysisSession, OperationLogItem } from '../types/resolution.js';
import { ApplyResolutionResult, PushResult } from '../types/verification.js';

export interface AnalyzeMergeResponse {
  sessionId: string;
  hasConflicts: boolean;
  conflicts: ConflictItem[];
  mergeBase: string;
  status: string;
}

export interface SessionDetailsResponse {
  session: AnalysisSession;
  conflicts: ConflictItem[];
  logs: OperationLogItem[];
}

export const conflictApi = {
  async analyzeMerge(
    repositoryPath: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<AnalyzeMergeResponse> {
    const res: any = await apiClient.post('/merge/analyze', {
      repositoryPath,
      sourceBranch,
      targetBranch,
    });
    return res.data;
  },

  async getSession(sessionId: string): Promise<SessionDetailsResponse> {
    const res: any = await apiClient.get(`/merge/${sessionId}`);
    return res.data;
  },

  async getSessionConflicts(sessionId: string): Promise<ConflictItem[]> {
    const res: any = await apiClient.get(`/merge/${sessionId}/conflicts`);
    return res.data;
  },

  async approveConflict(conflictId: string): Promise<ConflictItem> {
    const res: any = await apiClient.post(`/resolutions/${conflictId}/approve`);
    return res.data;
  },

  async editConflict(conflictId: string, modifiedCode: string): Promise<ConflictItem> {
    const res: any = await apiClient.post(`/resolutions/${conflictId}/edit`, { modifiedCode });
    return res.data;
  },

  async refineConflictWithPrompt(
    conflictId: string,
    userPrompt: string
  ): Promise<{
    conflict: ConflictItem;
    message: string;
    changes: any[];
    mergedCode: string;
  }> {
    const res: any = await apiClient.post(`/resolutions/${conflictId}/refine`, { userPrompt });
    return res.data;
  },

  async rejectConflict(conflictId: string, reason?: string): Promise<ConflictItem> {
    const res: any = await apiClient.post(`/resolutions/${conflictId}/reject`, { reason });
    return res.data;
  },

  async applyResolution(sessionId: string): Promise<ApplyResolutionResult> {
    const res: any = await apiClient.post(`/merge/${sessionId}/apply`);
    return res.data;
  },

  async pushSession(
    sessionId: string,
    options?: { remote?: string; branch?: string; force?: boolean }
  ): Promise<PushResult> {
    const res: any = await apiClient.post(`/merge/${sessionId}/push`, options || {});
    return res.data;
  },

  async rollbackSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const res: any = await apiClient.post(`/merge/${sessionId}/rollback`);
    return res;
  },

  async getHistory(): Promise<AnalysisSession[]> {
    const res: any = await apiClient.get('/history');
    return res.data;
  },
};
