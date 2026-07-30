import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { getAnalytics } from '../controllers/analytics.controller.js';

const analyticsRouter = Router();

analyticsRouter.get('/', authMiddleware, getAnalytics);

export default analyticsRouter;
