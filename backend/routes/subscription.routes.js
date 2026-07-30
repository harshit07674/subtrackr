import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import {
    addSubscription,
    getSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
    searchSubscriptions,
    bulkImportSubscriptions
} from "../controllers/subscription.controller.js";
import { getCatalog } from "../controllers/catalog.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.get('/catalog', getCatalog)
subscriptionRouter.post('/bulk-import', authMiddleware, bulkImportSubscriptions)
subscriptionRouter.post('/',    authMiddleware, addSubscription)
subscriptionRouter.get('/',     authMiddleware, getSubscriptions)

// ── HTTP QUERY method (RFC 10008) ─────────────────────────────────────────────
// Safe + idempotent like GET, but accepts a JSON body for complex filter criteria.
// Express 5 + Node 22 support this natively via router.query()
subscriptionRouter.query('/',   authMiddleware, searchSubscriptions)

subscriptionRouter.patch('/:id',  authMiddleware, updateSubscription)
subscriptionRouter.delete('/:id', authMiddleware, deleteSubscription)
subscriptionRouter.get('/:id',    authMiddleware, getSubscriptionById)

export default subscriptionRouter;
