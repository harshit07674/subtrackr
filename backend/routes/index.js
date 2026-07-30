import { Router } from "express";
import authRouter from "./auth.routes.js";
import subscriptionRouter from "./subscription.routes.js";
import workspaceRouter from "./workspace.routes.js";
import analyticsRouter from "./analytics.routes.js";

const route = Router();

route.use('/auth', authRouter);
route.use('/subscription', subscriptionRouter);
route.use('/workspace', workspaceRouter);
route.use('/analytics', analyticsRouter);

export default route;