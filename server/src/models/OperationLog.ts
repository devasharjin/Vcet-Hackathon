import mongoose, { Schema, Document } from 'mongoose';

export interface IOperationLog extends Document {
  sessionId: string;
  operation: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
  message: string;
  meta?: any;
  timestamp: Date;
}

const OperationLogSchema = new Schema<IOperationLog>(
  {
    sessionId: { type: String, required: true, index: true },
    operation: { type: String, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'WARNING', 'FAILED', 'INFO'],
      default: 'INFO',
    },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const OperationLogModel = mongoose.model<IOperationLog>(
  'OperationLog',
  OperationLogSchema
);
