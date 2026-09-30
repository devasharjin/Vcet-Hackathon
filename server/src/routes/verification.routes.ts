import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller.js';

const router = Router();

router.post('/:sessionId/verify', (req, res, next) =>
  verificationController.verifySession(req, res, next)
);

export default router;
