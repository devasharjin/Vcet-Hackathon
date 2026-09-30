import { conflictAnalyzer } from './conflict-analyzer.js';
import { ConflictContext, AIConflictAnalysisResult } from '../../types/conflict.types.js';

export class ResolutionGenerator {
  /**
   * Generate proposed resolution for a given conflict context
   */
  async generateResolution(context: ConflictContext): Promise<AIConflictAnalysisResult> {
    return conflictAnalyzer.analyzeConflict(context);
  }
}

export const resolutionGenerator = new ResolutionGenerator();
