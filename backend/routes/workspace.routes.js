import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { createWorkspace, deleteWorkspace, getAllWorkspace, getWorkspaceById, getSubscriptionsInWorkspace, updateWorkspace } from "../controllers/workspace.controller.js";


const workspaceRouter = Router();

workspaceRouter.post('/create', authMiddleware, createWorkspace)
workspaceRouter.get('/', authMiddleware, getAllWorkspace)
workspaceRouter.get('/:id', authMiddleware, getWorkspaceById)
workspaceRouter.put('/:id', authMiddleware, updateWorkspace)
workspaceRouter.delete('/:id', authMiddleware, deleteWorkspace)
workspaceRouter.get('/:id/subscriptions', authMiddleware, getSubscriptionsInWorkspace)

export default workspaceRouter;
