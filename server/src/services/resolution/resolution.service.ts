import { DataStore } from '../../models/store.js';
import { gitService } from '../git/git.service.js';
import { conflictAnalyzer } from '../ai/conflict-analyzer.js';
import { geminiService } from '../ai/gemini.service.js';
import { approvalService } from './approval.service.js';
import { applyResolutionService } from './apply-resolution.service.js';
import { logger } from '../../utils/logger.js';

export class ResolutionService {
  /**
   * Run full safe merge analysis pipeline:
   * 1. Inspect repo
   * 2. Find merge base
   * 3. Simulate merge in sandbox worktree
   * 4. Extract conflicts & context
   * 5. Analyze intent via Gemini AI
   * 6. Generate proposed resolutions with confidence scores
   */
  async startMergeAnalysis(
    repoPath: string,
    sourceBranch: string,
    targetBranch: string
  ) {
    logger.info(`Starting merge analysis: ${sourceBranch} -> ${targetBranch} in ${repoPath}`);

    // Create session
    const session = await DataStore.createSession({
      repositoryId: repoPath,
      repositoryPath: repoPath,
      sourceBranch,
      targetBranch,
      status: 'SIMULATING',
    });

    const sessionId = session._id.toString();

    try {
      await DataStore.logOperation(
        sessionId,
        'SIMULATION_START',
        'INFO',
        `Simulating merge of ${sourceBranch} into ${targetBranch}`
      );

      // Simulate merge in isolated temporary worktree
      const simResult = await gitService.simulateMerge(
        repoPath,
        sourceBranch,
        targetBranch,
        sessionId
      );

      await DataStore.updateSession(sessionId, {
        mergeBase: simResult.mergeBase,
      });

      if (!simResult.hasConflicts) {
        logger.info(`No conflicts detected between ${sourceBranch} and ${targetBranch}`);
        await DataStore.updateSession(sessionId, {
          status: 'NO_CONFLICTS',
          conflictCount: 0,
        });

        await DataStore.logOperation(
          sessionId,
          'SIMULATION_END',
          'SUCCESS',
          'Branches merge cleanly with zero conflicts.'
        );

        await gitService.cleanupSimulation(simResult.simulationDir);

        return {
          sessionId,
          hasConflicts: false,
          conflicts: [],
          mergeBase: simResult.mergeBase,
          status: 'NO_CONFLICTS',
        };
      }

      await DataStore.updateSession(sessionId, {
        status: 'CONFLICTS_DETECTED',
        conflictCount: simResult.conflictContexts.length,
      });

      await DataStore.logOperation(
        sessionId,
        'CONFLICTS_DETECTED',
        'WARNING',
        `Detected ${simResult.conflictContexts.length} conflicted file(s). Commencing AI intent analysis.`
      );

      // Process each conflict with Gemini AI
      const savedConflicts: any[] = [];

      for (const context of simResult.conflictContexts) {
        logger.info(`Analyzing conflict with AI for ${context.filePath}...`);

        const aiAnalysis = await conflictAnalyzer.analyzeConflict(context);

        const conflictRecord = await DataStore.saveConflict({
          sessionId,
          filePath: context.filePath,
          language: context.language,
          baseContent: context.baseContent,
          oursContent: context.oursContent,
          theirsContent: context.theirsContent,
          hunks: context.hunks,
          diffTargetAgainstBase: context.diffTargetAgainstBase,
          diffSourceAgainstBase: context.diffSourceAgainstBase,
          proposedResolution: aiAnalysis.resolution.mergedCode,
          confidence: aiAnalysis.confidence,
          conflictType: aiAnalysis.conflictType,
          aiExplanation: {
            summary: aiAnalysis.summary,
            targetIntent: aiAnalysis.intentAnalysis.targetIntent,
            sourceIntent: aiAnalysis.intentAnalysis.sourceIntent,
            combinedIntent: aiAnalysis.intentAnalysis.combinedIntent,
            risks: aiAnalysis.risks,
            verificationSuggestions: aiAnalysis.verificationSuggestions,
            changes: aiAnalysis.resolution.changes,
          },
          status: 'PENDING',
          resolutionSource: aiAnalysis.confidence < 70 ? 'human_required' : 'ai_approved',
        });

        savedConflicts.push(conflictRecord);
      }

      // Cleanup simulation sandbox
      await gitService.cleanupSimulation(simResult.simulationDir);

      await DataStore.updateSession(sessionId, {
        status: 'ANALYZED',
      });

      await DataStore.logOperation(
        sessionId,
        'ANALYSIS_COMPLETE',
        'SUCCESS',
        `AI intent analysis completed for all ${savedConflicts.length} conflict(s). Awaiting human review.`
      );

      return {
        sessionId,
        hasConflicts: true,
        conflicts: savedConflicts,
        mergeBase: simResult.mergeBase,
        status: 'ANALYZED',
      };
    } catch (err: any) {
      logger.error(`Merge analysis failed for session ${sessionId}:`, err);
      await DataStore.updateSession(sessionId, { status: 'INITIALIZED' });
      await DataStore.logOperation(
        sessionId,
        'ANALYSIS_ERROR',
        'FAILED',
        err.message
      );
      throw err;
    }
  }

  async getSession(sessionId: string) {
    return DataStore.getSession(sessionId);
  }

  async getSessionConflicts(sessionId: string) {
    return DataStore.getSessionConflicts(sessionId);
  }

  async approveConflict(conflictId: string) {
    return approvalService.approveAIResolution(conflictId);
  }

  async editConflictResolution(conflictId: string, modifiedCode: string) {
    return approvalService.approveHumanModifiedResolution(conflictId, modifiedCode);
  }

  async rejectConflictResolution(conflictId: string, reason?: string) {
    return approvalService.rejectResolution(conflictId, reason);
  }

  async applyAndCommit(sessionId: string) {
    return applyResolutionService.applyAndCommit(sessionId);
  }

  async rollback(sessionId: string) {
    return applyResolutionService.rollbackSession(sessionId);
  }

  async pushSession(
    sessionId: string,
    options?: { remote?: string; branch?: string; force?: boolean }
  ) {
    return applyResolutionService.pushSession(sessionId, options);
  }

  /**
   * Refine conflict resolution based on developer prompt ("needs")
   * Modifies ONLY the conflicted sections according to developer instructions
   */
  async refineConflictWithPrompt(conflictId: string, userPrompt: string) {
    const conflict = await DataStore.getConflict(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const session = await DataStore.getSession(conflict.sessionId);

    const context: any = {
      filePath: conflict.filePath,
      language: conflict.language,
      baseContent: conflict.baseContent,
      oursContent: conflict.oursContent,
      theirsContent: conflict.theirsContent,
      hunks: conflict.hunks || [],
      targetBranch: session?.targetBranch || 'target',
      sourceBranch: session?.sourceBranch || 'source',
    };

    const refinement = await geminiService.refineResolutionWithPrompt(
      context,
      conflict.proposedResolution,
      userPrompt
    );

    const updated = await DataStore.updateConflict(conflictId, {
      proposedResolution: refinement.mergedCode,
      confidence: refinement.confidence,
      resolutionSource: 'human_modified',
      'aiExplanation.summary': refinement.summary,
      'aiExplanation.changes': refinement.changes,
    });

    await DataStore.logOperation(
      conflict.sessionId,
      'PROMPT_REFINE_RESOLUTION',
      'INFO',
      `Applied prompt refinement for ${conflict.filePath}: "${userPrompt.slice(0, 80)}"`
    );

    return {
      conflict: updated,
      message: refinement.summary,
      changes: refinement.changes,
      mergedCode: refinement.mergedCode,
    };
  }
}


export const resolutionService = new ResolutionService();
