import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) return true;

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    logger.info(`Successfully connected to MongoDB at ${env.MONGODB_URI}`);
    return true;
  } catch (err: any) {
    logger.warn(`Could not connect to MongoDB at ${env.MONGODB_URI}: ${err.message}`);
    logger.warn('MergeMind will run in resilient in-memory storage mode for local sessions.');
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
