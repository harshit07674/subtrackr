import { verifyAccessToken } from "../services/auth.service.js";

/**
 * Validates the Bearer JWT in Authorization header against the session database.
 * Attaches the authenticated user to req.user.
 */
async function authMiddleware(req, res, next) {
    let token = null;
    const header = req.headers.authorization;

    if (header && header.startsWith('Bearer ')) {
        token = header.slice(7);
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Missing or malformed authorization credentials'
        });
    }

    try {
        const user = await verifyAccessToken(token);
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: err.message || 'Invalid or expired credentials'
        });
    }
}

export default authMiddleware;