import config from "../config/config.js";
import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'oauth2',
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN
    }
})

transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error?.message || error)
    } else {
        console.log('Email server is ready to send message')
    }
})

export const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Your Name" <${config.GOOGLE_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    catch (e) {
        console.error('Error sending email:', e.message || e);
    }
}