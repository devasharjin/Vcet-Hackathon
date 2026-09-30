import { apiClient } from './api.js';
import { VerificationResult } from '../types/verification.js';

export const verificationApi = {
  async verifySession(sessionId: string): Promise<VerificationResult> {
    const res: any = await apiClient.post(`/verification/${sessionId}/verify`);
    return res.data;
  },
};
