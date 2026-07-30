import config from "../config/config.js";
import sessionModel from "../models/refresh_token.model.js";
import userModel from "../models/user.model.js";
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendEmail } from "../services/email.service.js";
import { generateOTP, getOTPHtml, generateResetToken, getResetPasswordHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import passwordResetModel from "../models/password_reset.model.js";
import subscriptionModel from "../models/subscription.model.js";
import { getExchangeRatesMap, convertCurrency } from "../jobs/currencyFetch.js";



async function registerUser(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Username, email, and password are required"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[@#$%^&*!_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (password.length < 8 || !hasUpper || !hasDigit || !hasSpecial) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one digit, and one special character (@#$%^&*)"
        });
    }

    const isAlreadyRegistered = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyRegistered) {
        return res.status(409).json({
            message: "User already existed either with given username or given email"
        })
    }

    const hashPassword = crypto.createHash(config.CRYPT_ALGORITHM).update(password).digest('hex');

    const newUser = await userModel.create({
        username,
        email,
        password: hashPassword
    })

    const otp = generateOTP()
    const otpHtml = getOTPHtml(otp)

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    await otpModel.create({
        email,
        otpHash,
        userId: newUser._id,
        expiredAt: new Date(Date.now() + 10 * 60 * 1000)
    })

    await sendEmail(email, 'OTP verification', `Your OTP code is ${otp}`, otpHtml)

    return res.status(201).json({
        message: 'User created successfully',
        user: {
            username: newUser.username,
            email: newUser.email,
            verified: newUser.verified,
        }
    })

}

async function loginUser(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password both are required for login"
            })
        }

        const user = await userModel.findOne({ username: username })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (!user.verified) {
            return res.status(401).json({
                message: "email is not verified. please verify email before attempting to login"
            })
        }

        const hashPassword = crypto.createHash(config.CRYPT_ALGORITHM).update(password).digest('hex');

        if (user.password !== hashPassword) {
            return res.status(401).json({
                message: "Incorrect password"
            })
        }

        const refreshToken = jwt.sign({
            id: user._id
        }, config.JWS_SECRET, {
            expiresIn: '7d'
        })

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")


        const session = await sessionModel.create({
            userId: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })


        const accessToken = jwt.sign({
            id: user._id,
            sessionId: session._id,
            name: user.username,
        }, config.JWS_SECRET, {
            expiresIn: '3d'
        })




        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })


        return res.status(201).json({
            message: "Login successfully",
            accessToken,
            user: {
                username: user.username,
                email: user.email
            }
        })

    }
    catch (e) {
        return res.status(500).json({
            message: 'internal server error',
            errorInfo: `${e}`
        })
    }
}

async function refreshToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({
                message: 'token is not found or invalid'
            })
        }

        const decoded = jwt.verify(refreshToken, config.JWS_SECRET)
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

        const refreshExpiry = decoded.exp;

        if (refreshExpiry * 1000 < Date.now()) {
            return res.status(403).json({
                message: "token is expired. please login"
            })
        }

        const userId = decoded.id;
        const session = await sessionModel.findOne({ refreshTokenHash, revoked: false })

        if (!session) {
            return res.status(403).json({
                message: "token is invalid"
            })
        }

        const user = await userModel.findOne({ _id: userId })

        const newAccessToken = jwt.sign({
            name: user.username,
            id: user._id,
            sessionId: session._id
        }, config.JWS_SECRET, {
            expiresIn: '3d'
        })

        const newRefreshToken = jwt.sign({
            id: decoded.id,
        }, config.JWS_SECRET, {
            expiresIn: '7d'
        })

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex")

        session.refreshTokenHash = newRefreshTokenHash;
        session.expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await session.save();

        return res.status(200).json({
            message: 'new access token created',
            accessToken: newAccessToken,
            user: {
                user_id: user._id,
                username: user.username,
                email: user.email,
            }
        })

    }
    catch (e) {
        return res.status(500).json({
            message: 'internal server error',
            errorInfo: `${e}`
        })
    }
}

async function logoutUser(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return res.status(400).json({
                message: 'no token found'
            })
        }
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        })

        if (session) {
            session.revoked = true
            await session.save();
        }

        res.clearCookie('refreshToken')

        return res.status(200).json({
            message: 'logged out successfully'
        })
    } catch (e) {
        return res.status(500).json({
            message: 'internal server error',
            errorInfo: `${e}`
        })
    }
}

async function logoutFromAllDevices(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            return res.status(400).json({
                message: 'no token found'
            })
        }
        const decoded = jwt.verify(refreshToken, config.JWS_SECRET)
        await sessionModel.updateMany({
            userId: decoded.id,
            revoked: false,
        }, {
            revoked: true
        })
        res.clearCookie('refreshToken')
        return res.status(200).json({
            message: 'logged out from all devices successfully'
        })
    } catch (e) {
        return res.status(500).json({
            message: 'internal server error',
            errorInfo: `${e}`
        })
    }
}

async function verifyEmail(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: 'Email and OTP are required'
            })
        }

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        const otpRecord = await otpModel.findOne({ email, otpHash })

        if (!otpRecord) {
            return res.status(400).json({
                message: 'Invalid OTP'
            })
        }

        if (otpRecord.expiredAt < new Date()) {
            await otpModel.deleteMany({ _id: otpRecord._id })
            return res.status(400).json({
                message: 'OTP has expired. Please request a new one.'
            })
        }

        await userModel.updateOne({ _id: otpRecord.userId }, { $set: { verified: true } })

        await otpModel.deleteMany({ _id: otpRecord._id })

        return res.status(200).json({
            message: 'Email verified successfully. You can now log in.'
        })

    } catch (e) {
        return res.status(500).json({
            message: 'Internal server error',
            errorInfo: `${e}`
        })
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: 'User with this email does not exist'
            })
        }

        // Delete any existing unused reset tokens for this user
        await passwordResetModel.deleteMany({ userId: user._id })

        // Generate a plain random token (sent to user) and store only its hash
        const plainToken = generateResetToken()
        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')

        await passwordResetModel.create({
            userId: user._id,
            tokenHash,
            expiredAt: new Date(Date.now() + 10 * 60 * 1000)
        })

        const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${plainToken}`
        const html = getResetPasswordHtml(resetUrl)

        await sendEmail(
            email,
            'Reset your password',
            `Reset your password here: ${resetUrl}`,
            html
        )

        return res.status(200).json({
            message: 'If that email is registered, a reset link has been sent.'
        })

    } catch (e) {
        return res.status(500).json({
            message: 'Internal server error',
            errorInfo: `${e}`
        })
    }
}

async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' })
        }

        const hasUpper = /[A-Z]/.test(newPassword);
        const hasDigit = /\d/.test(newPassword);
        const hasSpecial = /[@#$%^&*!_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        if (newPassword.length < 8 || !hasUpper || !hasDigit || !hasSpecial) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one digit, and one special character (@#$%^&*)'
            });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        const resetRecord = await passwordResetModel.findOne({ tokenHash })

        if (!resetRecord) {
            return res.status(400).json({ message: 'Invalid or already used reset token' })
        }

        if (resetRecord.expiredAt < new Date()) {
            await passwordResetModel.deleteOne({ _id: resetRecord._id })
            return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' })
        }

        const hashedPassword = crypto.createHash(config.CRYPT_ALGORITHM).update(newPassword).digest('hex')

        await userModel.updateOne(
            { _id: resetRecord.userId },
            { $set: { password: hashedPassword } }
        )

        // Invalidate the used token (and any duplicates)
        await passwordResetModel.deleteMany({ userId: resetRecord.userId })

        return res.status(200).json({
            message: 'Password has been reset successfully. You can now log in.'
        })

    } catch (e) {
        return res.status(500).json({
            message: 'Internal server error',
            errorInfo: `${e}`
        })
    }
}

async function getCurrentUser(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'unauthorized',
                message: 'Unauthorized'
            })
        }

        const user = await userModel.findById(req.user._id);

        return res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            verified: user.verified,
            primaryCurrency: user.primaryCurrency || 'INR',
            defaultNotificationDays: user.defaultNotificationDays || 3,
        })
    }
    catch (e) {
        return res.status(500).json({
            message: 'internal server error',
            errorInfo: `${e}`
        })
    }
}

async function updateUserSettings(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { primaryCurrency, defaultNotificationDays } = req.body;
        const updateFields = {};

        if (primaryCurrency !== undefined) {
            const validCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'INR'];
            const formattedCurr = String(primaryCurrency).toUpperCase().trim();
            if (!validCurrencies.includes(formattedCurr)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
                });
            }
            updateFields.primaryCurrency = formattedCurr;
        }

        if (defaultNotificationDays !== undefined) {
            const days = Number(defaultNotificationDays);
            if (isNaN(days) || days < 1 || days > 30) {
                return res.status(400).json({
                    success: false,
                    message: 'defaultNotificationDays must be a number between 1 and 30'
                });
            }
            updateFields.defaultNotificationDays = days;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid setting fields provided to update'
            });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        return res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                verified: updatedUser.verified,
                primaryCurrency: updatedUser.primaryCurrency,
                defaultNotificationDays: updatedUser.defaultNotificationDays,
            }
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: `Internal server error: ${e.message || e}`
        });
    }
}

function calculateMonthlyCost(price, billingCycle) {
    const cycle = (billingCycle || 'monthly').toLowerCase();
    switch (cycle) {
        case 'yearly':
            return price / 12;
        case 'weekly':
            return (price * 52) / 12;
        case 'daily':
            return price * 30.4375;
        case 'monthly':
        default:
            return price;
    }
}

async function getDashboardKPIs(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'unauthorized',
                message: 'Unauthorized'
            })
        }

        const user = await userModel.findById(req.user._id);
        const primaryCurrency = user?.primaryCurrency || 'INR';

        const subscriptions = await subscriptionModel.find({ userId: req.user._id });
        const ratesMap = await getExchangeRatesMap();

        let totalExpensesAmount = 0;
        const now = new Date();
        let activeCount = 0;
        let pausedCount = 0;
        let cancelledCount = 0;
        let expiredCount = 0;
        let freeTrialCount = 0;

        for (const sub of subscriptions) {
            const status = (sub.status || 'active').toLowerCase();

            if (sub.isFreeTrial) {
                freeTrialCount++;
            }

            if (status === 'paused') {
                pausedCount++;
            } else if (status === 'cancelled') {
                cancelledCount++;
            } else {
                // active status
                if (sub.renewalDate && new Date(sub.renewalDate) >= now) {
                    activeCount++;
                } else {
                    expiredCount++;
                }

                // Add normalized monthly cost to total expenses for active subscriptions
                const subCurrency = sub.currency || 'USD';
                const mCost = calculateMonthlyCost(sub.price || 0, sub.billingCycle);
                const converted = convertCurrency(mCost, subCurrency, primaryCurrency, ratesMap);
                totalExpensesAmount += converted;
            }
        }

        return res.status(200).json({
            success: true,
            primaryCurrency,
            totalSubscriptionCount: subscriptions.length,
            activeSubscriptionCount: activeCount,
            pausedSubscriptionCount: pausedCount,
            cancelledSubscriptionCount: cancelledCount,
            expiredSubscriptionCount: expiredCount,
            freeTrialCount: freeTrialCount,
            totalExpensesAmount: Math.round(totalExpensesAmount * 100) / 100,
            totalExpensesAmountINR: Math.round(convertCurrency(totalExpensesAmount, primaryCurrency, 'INR', ratesMap) * 100) / 100
        })

    }
    catch (e) {
        return res.status(500).json({
            message: 'Internal server error',
            errorInfo: `${e}`
        })
    }
}

export { registerUser, getDashboardKPIs, getCurrentUser, updateUserSettings, loginUser, refreshToken, logoutUser, logoutFromAllDevices, verifyEmail, forgotPassword, resetPassword }