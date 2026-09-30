import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
  path: string;
  name: string;
  currentBranch: string;
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema = new Schema<IRepository>(
  {
    path: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    currentBranch: { type: String, required: true },
  },
  { timestamps: true }
);

export const RepositoryModel = mongoose.model<IRepository>('Repository', RepositorySchema);
