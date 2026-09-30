import mongoose, { Schema, Document } from 'mongoose';
import { ConflictType } from '../types/conflict.types.js';
import { ResolutionSource, ResolutionStatus } from '../types/resolution.types.js';

export interface IConflict {
  _id?: string;
  sessionId: string;
  filePath: string;
  language: string;
  baseContent: string;
  oursContent: string;
  theirsContent: string;
  hunks?: any[];
  diffTargetAgainstBase?: string;
  diffSourceAgainstBase?: string;
  proposedResolution: string;
  confidence: number;
  conflictType: ConflictType;
  aiExplanation: {
    summary: string;
    targetIntent: string;
    sourceIntent: string;
    combinedIntent: string;
    risks: string[];
    verificationSuggestions: string[];
    changes?: Array<{
      description: string;
      reason: string;
      changeType?: string;
      source?: string;
      originalSnippet?: string;
      resolvedSnippet?: string;
      lineStart?: number;
      lineEnd?: number;
    }>;
  };
  status: ResolutionStatus;
  resolutionSource: ResolutionSource;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConflictSchema = new Schema<IConflict>(
  {
    _id: { type: String },
    sessionId: { type: String, required: true, index: true },
    filePath: { type: String, required: true },
    language: { type: String, default: 'plaintext' },
    baseContent: { type: String, default: '' },
    oursContent: { type: String, default: '' },
    theirsContent: { type: String, default: '' },
    hunks: [{ type: Schema.Types.Mixed }],
    diffTargetAgainstBase: { type: String },
    diffSourceAgainstBase: { type: String },
    proposedResolution: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    conflictType: {
      type: String,
      default: 'UNKNOWN',
    },
    aiExplanation: {
      summary: { type: String, default: '' },
      targetIntent: { type: String, default: '' },
      sourceIntent: { type: String, default: '' },
      combinedIntent: { type: String, default: '' },
      risks: [{ type: String }],
      verificationSuggestions: [{ type: String }],
      changes: [
        {
          description: String,
          reason: String,
          changeType: String,
          source: String,
          originalSnippet: String,
          resolvedSnippet: String,
          lineStart: Number,
          lineEnd: Number,
        },
      ],
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'APPLIED'],
      default: 'PENDING',
    },
    resolutionSource: {
      type: String,
      enum: ['ai_approved', 'human_modified', 'human_required'],
      default: 'human_required',
    },
  },
  { timestamps: true }
);

export const ConflictModel = mongoose.model<IConflict>('Conflict', ConflictSchema);
