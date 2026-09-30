import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import repositoryRoutes from './routes/repository.routes.js';
import branchRoutes from './routes/branch.routes.js';
import conflictRoutes from './routes/conflict.routes.js';
import resolutionRoutes from './routes/resolution.routes.js';
import aiRoutes from './routes/ai.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import { conflictController } from './controllers/conflict.controller.js';
import { demoController } from './controllers/demo.controller.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

export const app = express();

// Security & CORS
app.use(
  cors({
    origin: '*', // Allow local frontend Vite dev server
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MergeMind Backend API',
  });
});

// Routes
app.use('/api/repositories', repositoryRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/merge', conflictRoutes);
app.use('/api/resolutions', resolutionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/verification', verificationRoutes);

// History endpoint
app.get('/api/history', (req, res, next) => conflictController.getHistory(req, res, next));

// 1-Click Demo repository generator
app.post('/api/demo/create-sample-repo', (req, res, next) =>
  demoController.createSampleRepo(req, res, next)
);

// Centralized error handling
app.use(errorHandler);
