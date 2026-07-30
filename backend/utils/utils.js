import crypto from 'crypto'

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateResetToken() {
    return crypto.randomBytes(32).toString('hex')
}

export function getResetPasswordHtml(resetUrl) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 16px;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table width="520" cellpadding="0" cellspacing="0" style="
                    max-width:520px;
                    width:100%;
                    background: linear-gradient(145deg, rgba(30,27,75,0.95), rgba(15,15,26,0.98));
                    border-radius: 24px;
                    border: 1px solid rgba(239,68,68,0.2);
                    box-shadow: 0 0 60px rgba(239,68,68,0.08), 0 20px 60px rgba(0,0,0,0.5);
                    overflow: hidden;
                ">

                    <!-- Header -->
                    <tr>
                        <td style="
                            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
                            padding: 36px 40px 32px;
                            text-align: center;
                        ">
                            <div style="
                                display: inline-block;
                                width: 60px;
                                height: 60px;
                                background: rgba(255,255,255,0.15);
                                border-radius: 50%;
                                line-height: 60px;
                                font-size: 28px;
                                margin-bottom: 14px;
                                border: 1.5px solid rgba(255,255,255,0.3);
                            ">🔑</div>
                            <div style="
                                font-size: 26px;
                                font-weight: 800;
                                color: #ffffff;
                                letter-spacing: -0.5px;
                                margin-bottom: 6px;
                            ">Reset Your Password</div>
                            <div style="
                                font-size: 14px;
                                color: rgba(255,255,255,0.75);
                                font-weight: 400;
                            ">We received a request to reset your account password</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 40px;">

                            <p style="
                                margin: 0 0 28px;
                                font-size: 15px;
                                color: #94a3b8;
                                line-height: 1.7;
                                text-align: center;
                            ">
                                Click the button below to set a new password.<br/>
                                This link expires in <strong style="color:#f87171;">10 minutes</strong>.
                            </p>

                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                                <tr>
                                    <td style="
                                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                                        border-radius: 12px;
                                        box-shadow: 0 4px 20px rgba(220,38,38,0.4);
                                    ">
                                        <a href="${resetUrl}" style="
                                            display: inline-block;
                                            padding: 14px 36px;
                                            color: #ffffff;
                                            font-size: 15px;
                                            font-weight: 700;
                                            text-decoration: none;
                                            letter-spacing: 0.3px;
                                        ">Reset Password →</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Fallback URL -->
                            <p style="margin: 0 0 8px; font-size: 12px; color: #475569; text-align: center;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="
                                margin: 0 0 28px;
                                font-size: 11px;
                                color: #6366f1;
                                text-align: center;
                                word-break: break-all;
                                line-height: 1.6;
                            ">${resetUrl}</p>

                            <!-- Divider -->
                            <div style="
                                height: 1px;
                                background: linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent);
                                margin-bottom: 24px;
                            "></div>

                            <!-- Warning -->
                            <table cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="
                                        background: rgba(239,68,68,0.08);
                                        border: 1px solid rgba(239,68,68,0.2);
                                        border-radius: 12px;
                                        padding: 14px 18px;
                                    ">
                                        <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">
                                            ⚠️ If you did <strong>not</strong> request a password reset, please ignore this email. Your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background: rgba(0,0,0,0.25);
                            border-top: 1px solid rgba(239,68,68,0.12);
                            padding: 20px 40px;
                            text-align: center;
                        ">
                            <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                                This link will expire in 10 minutes for your security.
                            </p>
                            <p style="margin:0;font-size:11px;color:#334155;">
                                © ${new Date().getFullYear()} Your App. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;
}

export function getRenewalReminderHtml(userName, serviceName, renewalDate, daysLeft, price, currency) {
    const urgencyColor  = daysLeft <= 1 ? '#ef4444' : daysLeft <= 2 ? '#f97316' : '#f59e0b';
    const urgencyBg     = daysLeft <= 1 ? 'rgba(239,68,68,0.12)' : daysLeft <= 2 ? 'rgba(249,115,22,0.12)' : 'rgba(245,158,11,0.12)';
    const urgencyBorder = daysLeft <= 1 ? 'rgba(239,68,68,0.3)' : daysLeft <= 2 ? 'rgba(249,115,22,0.3)' : 'rgba(245,158,11,0.3)';
    const urgencyLabel  = daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow!' : `In ${daysLeft} Days`;
    const urgencyEmoji  = daysLeft <= 1 ? '🚨' : '⏰';

    const formattedDate = new Date(renewalDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Subscription Renewal Reminder</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 16px;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table width="520" cellpadding="0" cellspacing="0" style="
                    max-width:520px;
                    width:100%;
                    background: linear-gradient(145deg, rgba(30,27,75,0.95), rgba(15,15,26,0.98));
                    border-radius: 24px;
                    border: 1px solid ${urgencyBorder};
                    box-shadow: 0 0 60px ${urgencyBg}, 0 20px 60px rgba(0,0,0,0.5);
                    overflow: hidden;
                ">

                    <!-- Header -->
                    <tr>
                        <td style="
                            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%);
                            padding: 36px 40px 32px;
                            text-align: center;
                            border-bottom: 1px solid ${urgencyBorder};
                        ">
                            <div style="
                                display: inline-block;
                                width: 64px;
                                height: 64px;
                                background: ${urgencyBg};
                                border-radius: 50%;
                                line-height: 64px;
                                font-size: 30px;
                                margin-bottom: 14px;
                                border: 1.5px solid ${urgencyBorder};
                            ">${urgencyEmoji}</div>
                            <div style="
                                font-size: 26px;
                                font-weight: 800;
                                color: #ffffff;
                                letter-spacing: -0.5px;
                                margin-bottom: 6px;
                            ">Renewal Reminder</div>
                            <div style="
                                font-size: 14px;
                                color: rgba(255,255,255,0.7);
                                font-weight: 400;
                            ">Your subscription is coming up for renewal</div>
                        </td>
                    </tr>

                    <!-- Urgency Badge -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="
                                background: ${urgencyBg};
                                border: 1px solid ${urgencyBorder};
                                border-radius: 0 0 14px 14px;
                                padding: 10px 20px;
                                text-align: center;
                                font-size: 13px;
                                font-weight: 700;
                                color: ${urgencyColor};
                                letter-spacing: 0.5px;
                                text-transform: uppercase;
                            ">Renews ${urgencyLabel}</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 40px;">

                            <p style="margin: 0 0 24px; font-size: 15px; color: #94a3b8; line-height: 1.7;">
                                Hi <strong style="color: #e2e8f0;">${userName}</strong> 👋, just a heads-up that your subscription is renewing soon.
                            </p>

                            <!-- Subscription Details Card -->
                            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                                <tr>
                                    <td style="
                                        background: rgba(255,255,255,0.04);
                                        border: 1px solid rgba(255,255,255,0.08);
                                        border-radius: 16px;
                                        padding: 24px;
                                    ">
                                        <!-- Service Name -->
                                        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                                            <tr>
                                                <td style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; padding-bottom: 4px;">Service</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 800; color: #e2e8f0; letter-spacing: -0.3px;">${serviceName}</td>
                                            </tr>
                                        </table>

                                        <!-- Divider -->
                                        <div style="height: 1px; background: rgba(255,255,255,0.07); margin-bottom: 16px;"></div>

                                        <!-- Date + Price row -->
                                        <table cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="50%" style="padding-right: 12px;">
                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Renewal Date</div>
                                                    <div style="font-size: 13px; color: #cbd5e1; font-weight: 600;">${formattedDate}</div>
                                                </td>
                                                <td width="50%" style="padding-left: 12px; border-left: 1px solid rgba(255,255,255,0.07);">
                                                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px;">Amount Due</div>
                                                    <div style="font-size: 22px; color: ${urgencyColor}; font-weight: 800;">${currency} ${price}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent); margin-bottom: 24px;"></div>

                            <!-- Info note -->
                            <table cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="
                                        background: rgba(99,102,241,0.08);
                                        border: 1px solid rgba(99,102,241,0.2);
                                        border-radius: 12px;
                                        padding: 14px 18px;
                                    ">
                                        <p style="margin:0;font-size:13px;color:#a5b4fc;line-height:1.6;">
                                            💡 Make sure your payment method is up to date to avoid any service interruptions.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background: rgba(0,0,0,0.25);
                            border-top: 1px solid rgba(139,92,246,0.15);
                            padding: 20px 40px;
                            text-align: center;
                        ">
                            <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                                This is an automated reminder. You're receiving this because you have an active subscription.
                            </p>
                            <p style="margin:0;font-size:11px;color:#334155;">
                                © ${new Date().getFullYear()} SubTracker. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>`;
}

export function getOTPHtml(otp) {
    const digits = otp.split('');
    const digitBoxes = digits.map(d => `
        <td style="padding: 0 6px;">
            <div style="
                width: 48px;
                height: 60px;
                background: rgba(255,255,255,0.07);
                border: 1.5px solid rgba(139,92,246,0.5);
                border-radius: 12px;
                font-size: 28px;
                font-weight: 700;
                color: #a78bfa;
                text-align: center;
                line-height: 60px;
                font-family: 'Courier New', monospace;
                letter-spacing: 0;
                box-shadow: 0 0 12px rgba(139,92,246,0.2);
            ">${d}</div>
        </td>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 16px;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table width="520" cellpadding="0" cellspacing="0" style="
                    max-width:520px;
                    width:100%;
                    background: linear-gradient(145deg, rgba(30,27,75,0.95), rgba(15,15,26,0.98));
                    border-radius: 24px;
                    border: 1px solid rgba(139,92,246,0.25);
                    box-shadow: 0 0 60px rgba(139,92,246,0.15), 0 20px 60px rgba(0,0,0,0.5);
                    overflow: hidden;
                ">

                    <!-- Header gradient banner -->
                    <tr>
                        <td style="
                            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
                            padding: 36px 40px 32px;
                            text-align: center;
                        ">
                            <!-- Lock icon -->
                            <div style="
                                display: inline-block;
                                width: 60px;
                                height: 60px;
                                background: rgba(255,255,255,0.15);
                                border-radius: 50%;
                                line-height: 60px;
                                font-size: 28px;
                                margin-bottom: 14px;
                                border: 1.5px solid rgba(255,255,255,0.3);
                            ">🔐</div>
                            <div style="
                                font-size: 26px;
                                font-weight: 800;
                                color: #ffffff;
                                letter-spacing: -0.5px;
                                margin-bottom: 6px;
                            ">Verify Your Email</div>
                            <div style="
                                font-size: 14px;
                                color: rgba(255,255,255,0.75);
                                font-weight: 400;
                            ">Use the code below to complete your sign-up</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 40px;">

                            <p style="
                                margin: 0 0 28px;
                                font-size: 15px;
                                color: #94a3b8;
                                line-height: 1.7;
                                text-align: center;
                            ">
                                Hi there 👋 — here's your one-time password.<br/>
                                It expires in <strong style="color:#a78bfa;">10 minutes</strong>.
                            </p>

                            <!-- OTP digit boxes -->
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                                <tr>${digitBoxes}</tr>
                            </table>

                            <!-- Divider -->
                            <div style="
                                height: 1px;
                                background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);
                                margin-bottom: 28px;
                            "></div>

                            <!-- Warning note -->
                            <table cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="
                                        background: rgba(239,68,68,0.08);
                                        border: 1px solid rgba(239,68,68,0.2);
                                        border-radius: 12px;
                                        padding: 14px 18px;
                                    ">
                                        <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.6;">
                                            ⚠️ <strong>Never share this code</strong> with anyone. We will never ask for your OTP via phone or email.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            background: rgba(0,0,0,0.25);
                            border-top: 1px solid rgba(139,92,246,0.15);
                            padding: 20px 40px;
                            text-align: center;
                        ">
                            <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                                Didn't request this? You can safely ignore this email.
                            </p>
                            <p style="margin:0;font-size:11px;color:#334155;">
                                © ${new Date().getFullYear()} Your App. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- End card -->

            </td>
        </tr>
    </table>

</body>
</html>`;
}