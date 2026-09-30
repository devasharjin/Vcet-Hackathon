import mongoose, { Schema, Document } from 'mongoose';
import { SessionStatus } from '../types/resolution.types.js';

export interface IAnalysisSession {
  _id?: string;
  repositoryId: string;
  repositoryPath: string;
  sourceBranch: string;
  targetBranch: string;
  mergeBase: string;
  status: SessionStatus;
  conflictCount: number;
  resolvedCount: number;
  commitHash?: string;
  createdAt?: Date;
  completedAt?: Date;
}

const AnalysisSessionSchema = new Schema<IAnalysisSession>(
  {
    _id: { type: String },
    repositoryId: { type: String, required: true, index: true },
    repositoryPath: { type: String, required: true },
    sourceBranch: { type: String, required: true },
    targetBranch: { type: String, required: true },
    mergeBase: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'INITIALIZED',
        'SIMULATING',
        'CONFLICTS_DETECTED',
        'NO_CONFLICTS',
        'ANALYZED',
        'APPROVED',
        'APPLIED',
        'VERIFIED',
        'VERIFICATION_FAILED',
        'COMMITTED',
        'ROLLED_BACK',
      ],
      default: 'INITIALIZED',
    },
    conflictCount: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },
    commitHash: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const AnalysisSessionModel = mongoose.model<IAnalysisSession>(
  'AnalysisSession',
  AnalysisSessionSchema
);
