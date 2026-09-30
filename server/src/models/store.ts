import { isDbConnected } from '../config/database.js';
import { RepositoryModel, IRepository } from './Repository.js';
import { AnalysisSessionModel, IAnalysisSession } from './AnalysisSession.js';
import { ConflictModel, IConflict } from './Conflict.js';
import { ResolutionModel, IResolution } from './Resolution.js';
import { OperationLogModel, IOperationLog } from './OperationLog.js';
import { logger } from '../utils/logger.js';

// In-memory fallbacks if MongoDB is not active
const memoryStore = {
  repositories: new Map<string, any>(),
  sessions: new Map<string, any>(),
  conflicts: new Map<string, any>(),
  resolutions: new Map<string, any>(),
  logs: [] as any[],
};

export const DataStore = {
  // Repositories
  async findRepository(path: string) {
    if (isDbConnected()) {
      return await RepositoryModel.findOne({ path });
    }
    return memoryStore.repositories.get(path) || null;
  },

  async saveRepository(data: { path: string; name: string; currentBranch: string }) {
    if (isDbConnected()) {
      return await RepositoryModel.findOneAndUpdate(
        { path: data.path },
        { ...data, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    const existing = memoryStore.repositories.get(data.path) || {
      _id: `repo_${Date.now()}`,
      createdAt: new Date(),
    };
    const updated = { ...existing, ...data, updatedAt: new Date() };
    memoryStore.repositories.set(data.path, updated);
    return updated;
  },

  async listRepositories() {
    if (isDbConnected()) {
      return await RepositoryModel.find().sort({ updatedAt: -1 }).limit(20);
    }
    return Array.from(memoryStore.repositories.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  // Sessions
  async createSession(data: Partial<IAnalysisSession>) {
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionData = {
      _id: id,
      ...data,
      createdAt: new Date(),
      status: data.status || 'INITIALIZED',
    };

    if (isDbConnected()) {
      return await AnalysisSessionModel.create(sessionData);
    }
    memoryStore.sessions.set(id, sessionData);
    return sessionData;
  },

  async getSession(sessionId: string) {
    if (isDbConnected()) {
      return await AnalysisSessionModel.findById(sessionId);
    }
    return memoryStore.sessions.get(sessionId) || null;
  },

  async updateSession(sessionId: string, updates: Partial<IAnalysisSession>) {
    if (isDbConnected()) {
      return await AnalysisSessionModel.findByIdAndUpdate(sessionId, updates, { new: true });
    }
    const session = memoryStore.sessions.get(sessionId);
    if (!session) return null;
    const updated = { ...session, ...updates };
    memoryStore.sessions.set(sessionId, updated);
    return updated;
  },

  async listSessions(limit = 20) {
    if (isDbConnected()) {
      return await AnalysisSessionModel.find().sort({ createdAt: -1 }).limit(limit);
    }
    return Array.from(memoryStore.sessions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  // Conflicts
  async saveConflict(data: any) {
    const id = data._id || `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const conflictData = {
      _id: id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDbConnected()) {
      return await ConflictModel.create(conflictData);
    }
    memoryStore.conflicts.set(id, conflictData);
    return conflictData;
  },

  async getConflict(conflictId: string) {
    if (isDbConnected()) {
      return await ConflictModel.findById(conflictId);
    }
    return memoryStore.conflicts.get(conflictId) || null;
  },

  async getSessionConflicts(sessionId: string) {
    if (isDbConnected()) {
      return await ConflictModel.find({ sessionId });
    }
    return Array.from(memoryStore.conflicts.values()).filter(
      (c) => c.sessionId === sessionId
    );
  },

  async updateConflict(conflictId: string, updates: any) {
    if (isDbConnected()) {
      return await ConflictModel.findByIdAndUpdate(
        conflictId,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
    }
    const conflict = memoryStore.conflicts.get(conflictId);
    if (!conflict) return null;
    const updated = { ...conflict, ...updates, updatedAt: new Date() };
    memoryStore.conflicts.set(conflictId, updated);
    return updated;
  },

  // Resolutions
  async saveResolution(data: any) {
    const id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const resData = {
      _id: id,
      ...data,
      createdAt: new Date(),
    };

    if (isDbConnected()) {
      return await ResolutionModel.create(resData);
    }
    memoryStore.resolutions.set(id, resData);
    return resData;
  },

  // Operation Logs
  async logOperation(
    sessionId: string,
    operation: string,
    status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO',
    message: string,
    meta?: any
  ) {
    const logData = {
      sessionId,
      operation,
      status,
      message,
      meta,
      timestamp: new Date(),
    };

    logger.info(`[${operation}] ${message}`, meta);

    if (isDbConnected()) {
      try {
        await OperationLogModel.create(logData);
      } catch (err: any) {
        logger.debug('Failed to write log to MongoDB:', err.message);
      }
    }
    memoryStore.logs.push(logData);
  },

  async getLogs(sessionId: string) {
    if (isDbConnected()) {
      return await OperationLogModel.find({ sessionId }).sort({ timestamp: 1 });
    }
    return memoryStore.logs.filter((l) => l.sessionId === sessionId);
  },
};
