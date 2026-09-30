import { Router } from 'express';
import { repositoryController } from '../controllers/repository.controller.js';

const router = Router();

router.post('/open', (req, res, next) => repositoryController.openRepository(req, res, next));
router.get('/info', (req, res, next) => repositoryController.getRepositoryInfo(req, res, next));
router.get('/branches', (req, res, next) => repositoryController.getBranches(req, res, next));
router.get('/status', (req, res, next) => repositoryController.getStatus(req, res, next));
router.get('/recent', (req, res, next) => repositoryController.getRecentRepositories(req, res, next));

export default router;
