import { geminiService } from './gemini.service.js';
import { ConflictContext, AIConflictAnalysisResult } from '../../types/conflict.types.js';
import { logger } from '../../utils/logger.js';

export class ConflictAnalyzer {
  /**
   * Deep analysis of what both branches were trying to achieve
   */
  async analyzeConflict(context: ConflictContext): Promise<AIConflictAnalysisResult> {
    logger.info(`Starting AI Intent Analysis for: ${context.filePath}`);
    const analysis = await geminiService.analyzeAndResolveConflict(context);
    return analysis;
  }
}

export const conflictAnalyzer = new ConflictAnalyzer();
