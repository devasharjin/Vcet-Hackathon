import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';

const router = Router();

router.get('/status', (req, res) => aiController.getStatus(req, res));
router.post('/analyze-conflict', (req, res, next) => aiController.analyzeConflict(req, res, next));
router.post('/generate-resolution', (req, res, next) => aiController.generateResolution(req, res, next));

export default router;
