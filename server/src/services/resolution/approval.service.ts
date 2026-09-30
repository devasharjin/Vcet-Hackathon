import { DataStore } from '../../models/store.js';
import { ResolutionSource } from '../../types/resolution.types.js';
import { logger } from '../../utils/logger.js';

export class ApprovalService {
  /**
   * Approve conflict resolution as proposed by AI
   */
  async approveAIResolution(conflictId: string) {
    const conflict = await DataStore.getConflict(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found.`);
    }

    const updated = await DataStore.updateConflict(conflictId, {
      status: 'APPROVED',
      resolutionSource: 'ai_approved',
    });

    await DataStore.saveResolution({
      conflictId,
      sessionId: conflict.sessionId,
      originalContent: conflict.oursContent,
      resolvedContent: conflict.proposedResolution,
      approved: true,
      editedByHuman: false,
    });

    await DataStore.logOperation(
      conflict.sessionId,
      'APPROVE_RESOLUTION',
      'SUCCESS',
      `Approved AI resolution for ${conflict.filePath}`
    );

    return updated;
  }

  /**
   * Approve conflict resolution modified by developer in Monaco Editor
   */
  async approveHumanModifiedResolution(conflictId: string, modifiedCode: string) {
    const conflict = await DataStore.getConflict(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found.`);
    }

    const updated = await DataStore.updateConflict(conflictId, {
      status: 'APPROVED',
      proposedResolution: modifiedCode,
      resolutionSource: 'human_modified',
    });

    await DataStore.saveResolution({
      conflictId,
      sessionId: conflict.sessionId,
      originalContent: conflict.oursContent,
      resolvedContent: modifiedCode,
      approved: true,
      editedByHuman: true,
    });

    await DataStore.logOperation(
      conflict.sessionId,
      'EDIT_RESOLUTION',
      'SUCCESS',
      `Human developer modified and approved resolution for ${conflict.filePath}`
    );

    return updated;
  }

  /**
   * Reject proposed resolution
   */
  async rejectResolution(conflictId: string, reason?: string) {
    const conflict = await DataStore.getConflict(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found.`);
    }

    const updated = await DataStore.updateConflict(conflictId, {
      status: 'REJECTED',
    });

    await DataStore.logOperation(
      conflict.sessionId,
      'REJECT_RESOLUTION',
      'WARNING',
      `Rejected resolution for ${conflict.filePath}: ${reason || 'User rejected'}`
    );

    return updated;
  }
}

export const approvalService = new ApprovalService();
