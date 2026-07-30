import { Router } from "express";
import { loginUser, logoutFromAllDevices, logoutUser, refreshToken, registerUser, verifyEmail, forgotPassword, resetPassword, getCurrentUser, getDashboardKPIs, updateUserSettings } from "../controllers/auth.controller.js";
import { getVapidPublicKey, subscribePush, unsubscribePush, sendTestPush } from "../controllers/push.controller.js";
import authMiddleware from "../middleware/auth.js";


const authRouter = Router();

authRouter.post('/register', registerUser)
authRouter.post('/login', loginUser)
authRouter.get('/refresh', refreshToken)
authRouter.get('/logout', logoutUser)
authRouter.get('/logout-all-devices', logoutFromAllDevices)
authRouter.post('/verify-email', verifyEmail)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.get('/me', authMiddleware, getCurrentUser)
authRouter.get('/dashboard-kpi', authMiddleware, getDashboardKPIs)
authRouter.put('/settings', authMiddleware, updateUserSettings)

// ── Web Push Notification Endpoints (Flow 5.1) ────────────────────────────────
authRouter.get('/vapid-public-key', getVapidPublicKey)
authRouter.post('/subscribe-push', authMiddleware, subscribePush)
authRouter.post('/unsubscribe-push', authMiddleware, unsubscribePush)
authRouter.post('/test-push', authMiddleware, sendTestPush)

export default authRouter;