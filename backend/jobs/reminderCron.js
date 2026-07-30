import cron from 'node-cron';
import webpush from 'web-push';
import subscriptionModel from '../models/subscription.model.js';
import userModel from '../models/user.model.js';
import { sendEmail } from '../services/email.service.js';
import { getRenewalReminderHtml } from '../utils/utils.js';

/**
 * Finds all active subscriptions renewing within the next `daysAhead` days
 * and sends a reminder email to each user.
 */
async function sendRenewalReminders() {
    console.log('[ReminderCron] Running renewal reminder check...');

    try {
        const now = new Date();
        // Start of today (midnight)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // End of the maximum notification window (30 days from today)
        const maxWindowEnd = new Date(todayStart.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Find all active subscriptions whose renewalDate falls within [todayStart, maxWindowEnd)
        const upcomingSubscriptions = await subscriptionModel
            .find({
                status: 'active',
                renewalDate: { $gte: todayStart, $lt: maxWindowEnd }
            })
            .populate('userId', 'email username defaultNotificationDays pushSubscriptions'); // pull email + username + defaultNotificationDays + pushSubscriptions

        if (upcomingSubscriptions.length === 0) {
            console.log('[ReminderCron] No upcoming renewals found. Skipping.');
            return;
        }

        console.log(`[ReminderCron] Found ${upcomingSubscriptions.length} active subscription(s) in window. Checking user notification preferences...`);

        // Send a reminder email for each subscription
        for (const sub of upcomingSubscriptions) {
            const user = sub.userId; // populated user document

            if (!user || !user.email) {
                console.warn(`[ReminderCron] Skipping subscription ${sub._id} — user or email not found.`);
                continue;
            }

            // Calculate how many days until renewal (0 = today, 1 = tomorrow, etc.)
            const msPerDay = 24 * 60 * 60 * 1000;
            const renewalMidnight = new Date(
                sub.renewalDate.getFullYear(),
                sub.renewalDate.getMonth(),
                sub.renewalDate.getDate()
            );
            const daysLeft = Math.round((renewalMidnight - todayStart) / msPerDay);

            const userThreshold = user.defaultNotificationDays ?? 3;
            if (daysLeft > userThreshold) {
                // Subscription renewal is outside this user's preferred notification lead time
                continue;
            }

            // Check if reminder was already sent for this specific renewal cycle
            if (sub.lastReminderRenewalDate && sub.lastReminderRenewalDate.getTime() === sub.renewalDate.getTime()) {
                console.log(`[ReminderCron] ℹ️ Reminder already sent for "${sub.serviceName}" (renewal: ${sub.renewalDate.toDateString()}). Skipping duplicate.`);
                continue;
            }

            const subject = daysLeft === 0
                ? `🚨 Your ${sub.serviceName} subscription renews TODAY`
                : daysLeft === 1
                    ? `⏰ Your ${sub.serviceName} subscription renews TOMORROW`
                    : `⏰ Reminder: ${sub.serviceName} renews in ${daysLeft} days`;

            const html = getRenewalReminderHtml(
                user.username,
                sub.serviceName,
                sub.renewalDate,
                daysLeft,
                sub.price,
                sub.currency
            );

            const text = `Hi ${user.username}, your ${sub.serviceName} subscription renews on ${sub.renewalDate.toDateString()}. Amount: ${sub.currency} ${sub.price}.`;

            let emailSentSuccess = false;
            let pushSentSuccess = false;

            try {
                await sendEmail(user.email, subject, text, html);
                emailSentSuccess = true;
                console.log(`[ReminderCron] ✅ Email reminder sent to ${user.email} for "${sub.serviceName}" (renews in ${daysLeft} day(s)).`);
            } catch (emailErr) {
                console.error(`[ReminderCron] ❌ Failed to send email reminder to ${user.email}:`, emailErr.message);
            }

            // Web Push Notification Dispatch (Flow 5.1)
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                const pushPayload = JSON.stringify({
                    title: subject,
                    body: `Your ${sub.serviceName} subscription renews in ${daysLeft} day(s) (${sub.currency} ${sub.price}).`,
                    icon: '/icon.png',
                    url: '/dashboard',
                });

                for (const pushSub of user.pushSubscriptions) {
                    try {
                        await webpush.sendNotification(
                            { endpoint: pushSub.endpoint, keys: pushSub.keys },
                            pushPayload
                        );
                        pushSentSuccess = true;
                        console.log(`[ReminderCron] 🔔 Web Push notification dispatched for "${sub.serviceName}"`);
                    } catch (pushErr) {
                        console.error(`[ReminderCron] ⚠️ Failed Web Push dispatch:`, pushErr.message);
                    }
                }
            }

            // Record that reminder was sent for this renewal cycle if email or push succeeded
            if (emailSentSuccess || pushSentSuccess) {
                sub.lastReminderRenewalDate = sub.renewalDate;
                await sub.save();
                console.log(`[ReminderCron] 📌 Recorded reminder dispatch for "${sub.serviceName}" (renewal date: ${sub.renewalDate.toDateString()}).`);
            }
        }

        console.log('[ReminderCron] Renewal reminder check complete.');
    } catch (err) {
        console.error('[ReminderCron] Error during reminder check:', err);
    }
}

/**
 * Registers the cron job.
 * Schedule: every day at 08:00 AM server time.
 *
 * Cron syntax: '0 8 * * *'
 *   ┌── minute (0)
 *   │  ┌── hour (8)
 *   │  │  ┌── day of month (*)
 *   │  │  │  ┌── month (*)
 *   │  │  │  │  ┌── day of week (*)
 *   0  8  *  *  *
 */
export function startReminderCron() {
    cron.schedule('0 2 * * *', sendRenewalReminders, {
        timezone: 'Asia/Kolkata' // adjust to your server timezone
    });

    sendRenewalReminders();


}

// Export the runner directly so it can be triggered manually for testing
export { sendRenewalReminders };
