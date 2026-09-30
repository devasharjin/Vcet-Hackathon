import { Router } from 'express';
import { conflictController } from '../controllers/conflict.controller.js';

const router = Router();

router.post('/:conflictId/approve', (req, res, next) => conflictController.approveConflict(req, res, next));
router.post('/:conflictId/reject', (req, res, next) => conflictController.rejectConflict(req, res, next));
router.post('/:conflictId/edit', (req, res, next) => conflictController.editConflict(req, res, next));
router.post('/:conflictId/refine', (req, res, next) => conflictController.refineConflictWithPrompt(req, res, next));

export default router;
