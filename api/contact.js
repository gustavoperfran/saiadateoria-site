// Vercel serverless function backing the contact form on /contact. Calls Resend's REST
// API directly over fetch (Node 18+ runtime has it built in) instead of pulling in their
// SDK - this is the only endpoint on an otherwise static site, so it isn't worth adding a
// package.json/build step just for one dependency.
//
// Requires RESEND_API_KEY to be set as an environment variable in the Vercel project, and
// the sending domain (saiadateoria.com) verified in Resend - otherwise Resend will reject
// the send and this returns a 502 rather than silently losing the message.
//
// Also requires TURNSTILE_SECRET_KEY (from the same Cloudflare account the domain's DNS
// already lives in) to verify the cf-turnstile-response token the widget on the page
// produces. The honeypot alone only stops bots that fill every field blind; Turnstile adds
// a real check against a scripted submitter that fills the form correctly.

const SUBJECTS = new Set(['Private beta', 'Product support', 'Privacy or security']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { name, email, subject, message, hp_field: honeypot, 'cf-turnstile-response': turnstileToken } = body;

  // Honeypot - a real visitor never sees or fills this field. Named something no browser
  // autofill heuristic recognises (an earlier version used "website", which some browsers'
  // address autofill will happily populate for a real visitor who has one saved, silently
  // discarding their legitimate submission). Report success without sending anything, so a
  // bot gets no signal that it was caught.
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Please fill in every field.' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!SUBJECTS.has(subject)) {
    return res.status(400).json({ error: 'Choose what this is about.' });
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: 'One of the fields is too long.' });
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!turnstileToken) {
      return res.status(400).json({ error: 'Please complete the verification before sending.' });
    }
    try {
      const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: req.headers?.['x-forwarded-for'],
        }),
      });
      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        console.error('Turnstile verification failed', verifyResult['error-codes']);
        return res.status(400).json({ error: 'Verification failed. Please try again.' });
      }
    } catch (err) {
      console.error('Turnstile verification request failed', err);
      return res.status(500).json({ error: 'Could not verify your request. Please try again.' });
    }
  } else {
    // Not configured yet - log it rather than silently skipping, so the gap is visible in
    // the function logs instead of looking like Turnstile is protecting the form when
    // nothing is actually checking the token.
    console.warn('TURNSTILE_SECRET_KEY is not configured - submissions are not being verified');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: 'Email is not configured yet. Please email contact@saiadateoria.com directly.' });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Saia da Teoria website <contact@saiadateoria.com>',
        to: ['contact@saiadateoria.com'],
        reply_to: email,
        subject: `[${subject}] ${name}`,
        text: `From: ${name} <${email}>\nCategory: ${subject}\n\n${message}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Category:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      console.error('Resend rejected the send', resendResponse.status, detail);
      return res.status(502).json({ error: 'Could not send the message right now. Please try again shortly.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error sending contact email', err);
    return res.status(500).json({ error: 'Unexpected error. Please try again.' });
  }
};
