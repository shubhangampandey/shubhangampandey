import nodemailer from 'nodemailer';

const emailPattern = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
const attempts = new Map();

export function createContactHandler({ env = process.env, createTransport = nodemailer.createTransport, now = Date.now } = {}) {
  return async function contact(req, res) {
    const respond = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(body));
    };
    const origin = req.headers.origin;
    const allowed = (env.CONTACT_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (origin && !allowed.includes(origin)) {
      respond(403, { error: 'This site is not allowed to send messages.' });
      return;
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      respond(405, { error: 'Use POST to send a message.' });
      return;
    }
    if (!(req.headers['content-type'] || '').startsWith('application/json')) {
      respond(415, { error: 'Send a JSON message.' });
      return;
    }
    const key = env.VERCEL ? String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown') : req.socket?.remoteAddress || 'unknown';
    const timestamp = now();
    for (const [address, entry] of attempts) if (entry.until <= timestamp) attempts.delete(address);
    const entry = attempts.get(key) || { count: 0, until: timestamp + 600000 };
    if (entry.count >= 5 || (!attempts.has(key) && attempts.size >= 10000)) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((entry.until - timestamp) / 1000))));
      respond(429, { error: 'Too many messages. Please wait ten minutes before trying again.' });
      return;
    }
    entry.count++;
    attempts.set(key, entry);
    let body;
    try {
      if (req.body !== undefined) {
        const serialized = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (Buffer.byteLength(serialized) > 16384) throw new Error('Too large');
        body = JSON.parse(serialized);
      } else {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 16384) throw new Error('Too large');
        }
        body = JSON.parse(raw);
      }
    } catch {
      respond(400, { error: 'The message is invalid or too large.' });
      return;
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      respond(400, { error: 'Enter your name, a valid email, and a message between 10 and 5000 characters.' });
      return;
    }
    if (body.website) {
      respond(200, { ok: true });
      return;
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (name.length < 1 || name.length > 120 || /[\r\n]/.test(name) || email.length > 200 || !emailPattern.test(email) || message.length < 10 || message.length > 5000) {
      respond(400, { error: 'Enter your name, a valid email, and a message between 10 and 5000 characters.' });
      return;
    }
    const from = env.MAIL_FROM || env.SMTP_USER || '';
    const to = env.MAIL_TO || '';
    const port = Number(env.SMTP_PORT || 587);
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !emailPattern.test(from) || !emailPattern.test(to) || !Number.isInteger(port) || port < 1 || port > 65535) {
      respond(503, { error: 'Email delivery is not configured yet. Please use the GitHub contact link for now.' });
      return;
    }
    try {
      const transport = createTransport({
        host: env.SMTP_HOST,
        port,
        secure: env.SMTP_SECURE === 'true' || port === 465,
        requireTLS: port !== 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      const result = await transport.sendMail({
        from: { name: 'Portfolio contact', address: from },
        to,
        replyTo: { name, address: email },
        subject: `Portfolio message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      });
      if (!result.accepted?.length || result.rejected?.length) throw new Error('Recipient rejected');
      respond(200, { ok: true });
    } catch {
      respond(502, { error: 'Email delivery failed. Your message has not been sent. Please try again later.' });
    }
  };
}

export default createContactHandler();
