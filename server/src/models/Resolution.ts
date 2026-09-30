import mongoose, { Schema } from 'mongoose';

export interface IResolution {
  _id?: string;
  conflictId: string;
  sessionId: string;
  originalContent: string;
  resolvedContent: string;
  approved: boolean;
  editedByHuman: boolean;
  verificationStatus: string;
  createdAt?: Date;
}

const ResolutionSchema = new Schema<IResolution>(
  {
    _id: { type: String },
    conflictId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    originalContent: { type: String, default: '' },
    resolvedContent: { type: String, required: true },
    approved: { type: Boolean, default: false },
    editedByHuman: { type: Boolean, default: false },
    verificationStatus: { type: String, default: 'PENDING' },
  },
  { timestamps: true }
);

export const ResolutionModel = mongoose.model<IResolution>('Resolution', ResolutionSchema);
