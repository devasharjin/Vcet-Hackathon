import { useState, useCallback } from 'react';
import { conflictApi } from '../services/conflictApi.js';
import { ConflictItem } from '../types/conflict.js';
import { AnalysisSession } from '../types/resolution.js';

export function useConflicts() {
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async (repoPath: string, source: string, target: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await conflictApi.analyzeMerge(repoPath, source, target);
      const sessionDetails = await conflictApi.getSession(data.sessionId);
      setSession(sessionDetails.session);
      setConflicts(sessionDetails.conflicts);
      if (sessionDetails.conflicts.length > 0) {
        setSelectedConflict(sessionDetails.conflicts[0]);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await conflictApi.getSession(sessionId);
      setSession(data.session);
      setConflicts(data.conflicts);
      if (data.conflicts.length > 0) {
        setSelectedConflict(data.conflicts[0]);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed loading session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveConflict = useCallback(async (conflictId: string) => {
    try {
      const updated = await conflictApi.approveConflict(conflictId);
      setConflicts((prev) => prev.map((c) => (c._id === conflictId ? updated : c)));
      setSelectedConflict((curr) => (curr?._id === conflictId ? updated : curr));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed approving conflict');
      throw err;
    }
  }, []);

  const editConflict = useCallback(async (conflictId: string, modifiedCode: string) => {
    try {
      const updated = await conflictApi.editConflict(conflictId, modifiedCode);
      setConflicts((prev) => prev.map((c) => (c._id === conflictId ? updated : c)));
      setSelectedConflict((curr) => (curr?._id === conflictId ? updated : curr));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed editing conflict');
      throw err;
    }
  }, []);

  const rejectConflict = useCallback(async (conflictId: string, reason?: string) => {
    try {
      const updated = await conflictApi.rejectConflict(conflictId, reason);
      setConflicts((prev) => prev.map((c) => (c._id === conflictId ? updated : c)));
      setSelectedConflict((curr) => (curr?._id === conflictId ? updated : curr));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed rejecting conflict');
      throw err;
    }
  }, []);

  const refineWithPrompt = useCallback(async (conflictId: string, userPrompt: string) => {
    try {
      const result = await conflictApi.refineConflictWithPrompt(conflictId, userPrompt);
      const updated = result.conflict;
      setConflicts((prev) => prev.map((c) => (c._id === conflictId ? updated : c)));
      setSelectedConflict((curr) => (curr?._id === conflictId ? updated : curr));
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed refining conflict with prompt');
      throw err;
    }
  }, []);

  return {
    session,
    conflicts,
    selectedConflict,
    setSelectedConflict,
    loading,
    error,
    startAnalysis,
    loadSession,
    approveConflict,
    editConflict,
    refineWithPrompt,
    rejectConflict,
    setSession,
    setConflicts,
  };
}
