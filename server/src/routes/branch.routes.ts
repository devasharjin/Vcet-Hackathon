import { Router } from 'express';
import { branchController } from '../controllers/branch.controller.js';

const router = Router();

router.post('/compare', (req, res, next) => branchController.compareBranches(req, res, next));

export default router;
