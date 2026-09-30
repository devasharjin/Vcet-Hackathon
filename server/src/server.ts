import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { isGeminiConfigured } from './config/gemini.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  logger.info('Initializing MergeMind Backend Server...');

  // Connect to Database (with automatic graceful fallback)
  await connectDatabase();

  // Check Gemini Status
  if (isGeminiConfigured()) {
    logger.info('✓ Google Gemini AI is active and configured.');
  } else {
    logger.info('ℹ Google Gemini API key not detected in .env. MergeMind intelligent local engine enabled.');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`✓ MergeMind Backend running on port ${env.PORT}`);
    logger.info(`✓ Health endpoint: http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = async () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('Server terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});
