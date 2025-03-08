const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const admin = require('../firebase');

// Registration endpoint: device sends sessionCode and its FCM token
router.post('/register', async (req, res) => {
  const { sessionCode, deviceToken } = req.body;
  if (!sessionCode || !deviceToken) {
    return res.status(400).json({ error: 'sessionCode and deviceToken are required' });
  }

  try {
    let session = await Session.findOne({ sessionCode });
    if (session) {
      // Add token if not already present
      if (!session.deviceTokens.includes(deviceToken)) {
        session.deviceTokens.push(deviceToken);
        await session.save();
      }
    } else {
      // Create a new session document
      session = new Session({ sessionCode, deviceTokens: [deviceToken] });
      await session.save();
    }
    console.log(`Device token ${deviceToken} registered to session ${sessionCode}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering session' });
  }
});

// Alert trigger endpoint: one device triggers an alert for its session partner(s)
router.post('/trigger-alert', async (req, res) => {
  const { sessionCode, senderToken } = req.body;
  if (!sessionCode) {
    return res.status(400).json({ error: 'sessionCode is required' });
  }

  try {
    const session = await Session.findOne({ sessionCode });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Exclude sender's token
    const targetTokens = session.deviceTokens.filter(token => token !== senderToken);
    if (targetTokens.length === 0) {
      return res.status(404).json({ error: 'No target devices found for this session' });
    }

    // Construct the push notification payload
    const messagePromises = targetTokens.map(token => {
      const message = {
          token,
          notification: {
              title: "Alert!",
              body: "This is an important notification."
          },
          data: {
              playSound: "true",
              session: sessionCode,
              action: "ring"
          },
          android: {
              priority: "high",
              notification: {
                  channelId: "alert-channel", // ✅ Correct key
                  sound: "sound_2" // ✅ Correct placement
              }
          },
          apns: {
              payload: {
                  aps: {
                      sound: "sound_2", // ✅ Correct placement for iOS
                      contentAvailable: true
                  }
              }
          }
      };
      return admin.messaging().send(message);
  });
  
  
  
    const responses = await Promise.all(messagePromises);
    console.log('Successfully sent message:', responses);
    res.status(200).json({ success: true, responses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Optional debug route to list all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find({});
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a device from all sessions
router.post('/remove-device', async (req, res) => {
  const { deviceToken } = req.body;
  if (!deviceToken) {
    return res.status(400).json({ error: 'deviceToken is required' });
  }

  try {
    // Find all sessions containing this deviceToken
    const sessions = await Session.find({ deviceTokens: deviceToken });

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Device token not found in any session' });
    }

    // Remove the device token from all sessions
    await Promise.all(sessions.map(async (session) => {
      session.deviceTokens = session.deviceTokens.filter(token => token !== deviceToken);
      await session.save();
    }));

    console.log(`Device token ${deviceToken} removed from all sessions`);
    res.status(200).json({ success: true, message: 'Device token removed from all sessions' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error removing device from sessions' });
  }
});

// Check if a device is connected to any session
router.post('/check-device', async (req, res) => {
  const { deviceToken } = req.body;
  if (!deviceToken) {
    return res.status(400).json({ error: 'deviceToken is required' });
  }

  try {
    const sessions = await Session.find({ deviceTokens: deviceToken });

    if (sessions.length === 0) {
      return res.status(404).json({ connected: false, message: 'Device token not connected to any session' });
    }

    // Return the list of session codes the device is connected to
    const sessionCodes = sessions.map(session => session.sessionCode);
    res.status(200).json({ connected: true, sessionCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error checking device connection' });
  }
});



module.exports = router;
