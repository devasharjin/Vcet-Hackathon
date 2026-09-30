import { Router } from 'express';
import { conflictController } from '../controllers/conflict.controller.js';
import { demoController } from '../controllers/demo.controller.js';

const router = Router();

// Merge & conflict analysis
router.post('/analyze', (req, res, next) => conflictController.analyzeMerge(req, res, next));
router.get('/:sessionId', (req, res, next) => conflictController.getSession(req, res, next));
router.get('/:sessionId/conflicts', (req, res, next) => conflictController.getSessionConflicts(req, res, next));
router.post('/:sessionId/apply', (req, res, next) => conflictController.applyResolution(req, res, next));
router.post('/:sessionId/rollback', (req, res, next) => conflictController.rollbackSession(req, res, next));
router.post('/:sessionId/push', (req, res, next) => conflictController.pushCommit(req, res, next));

export default router;
