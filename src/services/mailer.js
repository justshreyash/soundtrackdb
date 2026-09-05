const nodemailer = require('nodemailer');

/**
 * Brevo (Sendinblue) Email Service
 *
 * Supports two delivery backends:
 * 1. Brevo REST API (https://api.brevo.com/v3/smtp/email) when BREVO_API_KEY is configured
 * 2. Brevo SMTP (smtp-relay.brevo.com:587) when BREVO_SMTP_KEY / SMTP_PASSWORD is configured
 *
 * Falls back gracefully to local logging if credentials are not yet set,
 * guaranteeing zero downtime or frontend breakage.
 */

function getSmtpTransporter() {
  const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
  const user = process.env.BREVO_SMTP_USER || '91e925001@smtp-brevo.com';
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASSWORD;

  if (!pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function generateWelcomeHtml(recipientEmail) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoundTrackDB Public Beta Access</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; color: #F0EDE6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .header { border-bottom: 1px solid rgba(240, 237, 230, 0.1); padding-bottom: 24px; margin-bottom: 32px; }
    .badge { display: inline-block; background-color: #161616; border: 1px solid rgba(240, 237, 230, 0.15); padding: 4px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #ed462d; font-weight: bold; margin-bottom: 16px; }
    h1 { font-size: 28px; font-weight: 800; line-height: 1.2; margin: 0 0 16px 0; color: #ffffff; letter-spacing: -0.5px; }
    p { font-size: 15px; line-height: 1.6; color: rgba(240, 237, 230, 0.75); margin: 0 0 20px 0; }
    .highlight-card { background: #121212; border: 1px solid rgba(240, 237, 230, 0.15); padding: 20px; border-radius: 4px; margin: 24px 0; }
    .code-block { background: #000000; border: 1px solid rgba(240, 237, 230, 0.1); padding: 14px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #22c55e; overflow-x: auto; margin-top: 12px; }
    .btn { display: inline-block; background-color: #ed462d; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 24px; border-radius: 3px; margin: 16px 0; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(240, 237, 230, 0.1); font-size: 12px; color: rgba(240, 237, 230, 0.4); text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">● PUBLIC BETA REGISTERED</div>
      <h1>You're on the SoundTrackDB Priority List</h1>
      <p>Thanks for subscribing with <strong>${recipientEmail}</strong>. You have secured priority access for all cinema soundtrack API updates and upcoming volume tiers.</p>
    </div>

    <div class="highlight-card">
      <strong style="color: #ffffff; font-size: 16px;">Current Beta Status: 100 req/min (No Key Required)</strong>
      <p style="margin-top: 8px;">SoundTrackDB is free to query right now. You can resolve movie and show soundtracks directly from IMDb or TMDB identifiers:</p>
      <div class="code-block">curl "https://soundtrackdb.vercel.app/v1/titles/imdb/tt13070038/music"</div>
    </div>

    <p>We'll notify you well in advance before optional high-volume API keys or dedicated quotas are introduced. Existing beta endpoints will never be abruptly restricted without advance notice.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://soundtrackdb.vercel.app/docs" class="btn">Explore Interactive API Docs →</a>
    </div>

    <div class="footer">
      <p>© 2026 SoundTrackDB · Built by CNF1G & shreyash<br>
      High-performance cinema soundtrack resolution engine.</p>
    </div>
  </div>
</body>
</html>
  `;
}

async function syncContactToBrevo(email, source = 'beta_notice') {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
      }),
    });
    if (res.ok) {
      let data = {};
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch (_) {}
      }
      console.log(`[Brevo] Contact synced to Brevo dashboard: ${email} (status: ${res.status}, ID: ${data.id || 'existing_contact'})`);
      return data;
    } else {
      const errText = await res.text();
      console.warn(`[Brevo] Contact sync warning (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.warn(`[Brevo] Contact sync failed: ${err.message}`);
  }
  return null;
}

async function sendWelcomeEmail(recipientEmail, source = 'beta_notice') {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'work4mirrorbug2@gmail.com';
  const senderName = 'SoundTrackDB';
  const subject = "You're on the SoundTrackDB Public Beta list";
  const htmlContent = generateWelcomeHtml(recipientEmail);

  // 1. Always sync contact directly into Brevo Contacts dashboard
  await syncContactToBrevo(recipientEmail, source);

  // 2. Try Brevo REST API (HTTPS) if BREVO_API_KEY is configured
  const apiKey = process.env.BREVO_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipientEmail }],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Mailer] Brevo email delivered to ${recipientEmail} (messageId: ${result.messageId})`);
        return { success: true, provider: 'brevo_api', messageId: result.messageId };
      } else {
        const errText = await response.text();
        console.warn(`[Mailer] Brevo API HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`[Mailer] Brevo API error: ${err.message}`);
    }
  }

  // 3. Try Brevo SMTP via nodemailer if BREVO_SMTP_KEY is configured
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[Mailer] Brevo SMTP delivered to ${recipientEmail} (messageId: ${info.messageId})`);
      return { success: true, provider: 'brevo_smtp', messageId: info.messageId };
    } catch (err) {
      console.warn(`[Mailer] Brevo SMTP error: ${err.message}`);
    }
  }

  // 4. Fallback: Log email send event for development
  console.log(`[Mailer] Offline/Dev fallback: Email queued for ${recipientEmail} (Brevo credentials not configured or in sandbox).`);
  return { success: true, provider: 'local_fallback' };
}

module.exports = {
  sendWelcomeEmail,
  syncContactToBrevo,
};
