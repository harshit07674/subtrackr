import webpush from 'web-push';
import userModel from '../models/user.model.js';
import config from '../config/config.js';

// Configure Web Push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BO9G2o_WOhG7Cd1AR6ADq6O5jVBsFNvw6bte9UjWLRfFMHiz7lGTHw5pdvSN3D1SLdPqd2BxNCMkQM-4-Duabl4';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'jKNQa2zL1agQfTz7-qRAXqGf2tiNY_jhDKJfUSWa_rA';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@subtrackr.com';

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export async function getVapidPublicKey(req, res) {
  return res.status(200).json({
    status: '200',
    publicKey: vapidPublicKey,
  });
}

export async function subscribePush(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ status: '401', message: 'Unauthorized' });
    }

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ status: '400', message: 'Invalid push subscription data' });
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: '404', message: 'User not found' });
    }

    // Check if endpoint already exists
    const exists = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
      await user.save();
    }

    return res.status(200).json({
      status: '200',
      message: 'Push notification subscription saved successfully',
      pushCount: user.pushSubscriptions.length,
    });
  } catch (error) {
    return res.status(500).json({
      status: '500',
      message: `Internal server error: ${error.message || error}`,
    });
  }
}

export async function unsubscribePush(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ status: '401', message: 'Unauthorized' });
    }

    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ status: '400', message: 'Endpoint is required' });
    }

    const user = await userModel.findById(req.user._id);
    if (user) {
      user.pushSubscriptions = user.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
      await user.save();
    }

    return res.status(200).json({
      status: '200',
      message: 'Unsubscribed from push notifications',
    });
  } catch (error) {
    return res.status(500).json({
      status: '500',
      message: `Internal server error: ${error.message || error}`,
    });
  }
}

export async function sendTestPush(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ status: '401', message: 'Unauthorized' });
    }

    const user = await userModel.findById(req.user._id);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(400).json({
        status: '400',
        message: 'No active push subscriptions found for this account. Please enable push notifications first.',
      });
    }

    const payload = JSON.stringify({
      title: '🔔 SubTrackr Alert Verified!',
      body: `Hello ${user.username}! Web Push Notifications are active on your device. You will receive native OS alerts before renewal dates.`,
      icon: '/icon.png',
      url: '/dashboard',
    });

    let sentCount = 0;
    const expiredEndpoints = [];

    for (const sub of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
        sentCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up expired endpoints
    if (expiredEndpoints.length > 0) {
      user.pushSubscriptions = user.pushSubscriptions.filter((s) => !expiredEndpoints.includes(s.endpoint));
      await user.save();
    }

    return res.status(200).json({
      status: '200',
      message: `Test push notification sent successfully to ${sentCount} device(s)!`,
    });
  } catch (error) {
    return res.status(500).json({
      status: '500',
      message: `Internal server error: ${error.message || error}`,
    });
  }
}
