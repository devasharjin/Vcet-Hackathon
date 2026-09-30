import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let genAIClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenerativeAI(apiKey.trim());
      logger.info('Gemini AI client successfully initialized');
    } catch (err: any) {
      logger.error('Failed to initialize Gemini AI client:', err.message);
      return null;
    }
  }

  return genAIClient;
}

export function isGeminiConfigured(): boolean {
  return getGeminiClient() !== null;
}
