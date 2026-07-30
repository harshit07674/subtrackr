import config from "../config/config.js";
import sessionModel from "../models/refresh_token.model.js";
import userModel from "../models/user.model.js";
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendEmail } from "../services/email.service.js";
import { generateOTP, getOTPHtml, generateResetToken, getResetPasswordHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import passwordResetModel from "../models/password_reset.model.js";

export async function verifyAccessToken(accessToken) {


    let payload;
    try {
        payload = jwt.verify(accessToken, config.JWS_SECRET);
    } catch {
        throw new Error('Session expired or invalid. Please log in again.', 401);
    }

    // Check if session is still active in database
    if (payload.sessionId) {
        const session = await sessionModel.findById({ _id: payload.sessionId });
        if (!session || session.expiredsIn < new Date()) {
            throw new Error('Session expired or invalid. Please log in again.', 401);
        }
    } else {
        // If no session ID exists on the token, reject it to enforce stateful validation
        throw new Error('Session expired or invalid. Please log in again.', 401);
    }

    const user = await userModel.findOne({ _id: payload.id });
    if (!user || !user.verified) {
        throw new Error('Unauthorized.');
    }

    return user;
}
