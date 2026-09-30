import { apiClient } from './api.js';

export const aiApi = {
  async getStatus(): Promise<{ configured: boolean; model: string; message: string }> {
    const res: any = await apiClient.get('/ai/status');
    return res.data;
  },

  async analyzeConflict(context: any): Promise<any> {
    const res: any = await apiClient.post('/ai/analyze-conflict', context);
    return res.data;
  },

  async generateResolution(context: any): Promise<any> {
    const res: any = await apiClient.post('/ai/generate-resolution', context);
    return res.data;
  },
};
