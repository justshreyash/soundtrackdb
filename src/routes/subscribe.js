const express = require('express');
const router = express.Router();
const { respond, respondError } = require('../response');
const { ErrorCodes } = require('../errors');
const { addSubscriber } = require('../services/soundtrack-db');
const { sendWelcomeEmail } = require('../services/mailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribe — Developer beta waitlist & notification subscription
router.post('/subscribe', async (req, res) => {
  const { email, source = 'beta_notice' } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return respondError(res, 400, 'Please provide a valid developer email address.', ErrorCodes.INVALID_REQUEST);
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Persist subscriber to Turso DB
    await addSubscriber({ email: cleanEmail, source });

    // 2. Dispatch Brevo welcome email in background (non-blocking)
    sendWelcomeEmail(cleanEmail, source).catch(err => {
      console.warn(`[Subscribe] Failed to send welcome email to ${cleanEmail}: ${err.message}`);
    });

    if (req.telemetry) {
      req.telemetry.cacheHit = true;
      req.telemetry.outcome = 'SUCCESS';
    }

    return respond(res, 200, {
      message: "You're registered! We will notify you well before any API key or rate tier launch.",
      email: cleanEmail,
      status: 'subscribed',
    });
  } catch (err) {
    console.error(`[Subscribe] Subscription failed: ${err.message}`);
    return respondError(res, 500, 'Could not complete subscription. Please try again.', ErrorCodes.INTERNAL_ERROR);
  }
});
module.exports = router;
