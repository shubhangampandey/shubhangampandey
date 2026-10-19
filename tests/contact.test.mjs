import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createContactHandler } from '../server/contact.mjs';

const env = { SMTP_HOST: 'smtp.example.test', SMTP_PORT: '587', SMTP_USER: 'sender@example.test', SMTP_PASS: 'test-only-secret', MAIL_TO: 'owner@example.test', CONTACT_ORIGINS: 'https://portfolio.example.test' };
const message = { name: 'Visitor', email: 'visitor@example.test', message: 'I would like to discuss a project.' };
let addressIndex = 0;

async function fixture(run, options = {}) {
  const messages = [];
  const transports = [];
  const timestamp = ++addressIndex * 600001;
  const handler = createContactHandler({ env, now: () => timestamp, createTransport: config => { transports.push(config); return { sendMail: async mail => { messages.push(mail); return { accepted: [env.MAIL_TO], rejected: [] }; } }; }, ...options });
  const server = createServer((req, res) => { void handler(req, res); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const send = (body = message, headers = {}, method = 'POST') => fetch(url, { method, headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.example.test', ...headers }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
  try { await run({ send, messages, transports }); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('sends to the configured inbox with visitor Reply-To, never an arbitrary recipient', async () => fixture(async ({ send, messages, transports }) => {
  const response = await send({ ...message, to: 'attacker@example.test' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(messages[0].to, env.MAIL_TO);
  assert.equal(messages[0].from.address, env.SMTP_USER);
  assert.equal(messages[0].replyTo.address, message.email);
  assert.match(messages[0].text, /discuss a project/);
  assert.equal(transports[0].requireTLS, true);
  assert.equal(transports[0].disableFileAccess, true);
}));

test('rejects invalid inputs, header injection, non-JSON and unexpected origins', async () => fixture(async ({ send, messages }) => {
  assert.equal((await send({ ...message, email: 'invalid' })).status, 400);
  assert.equal((await send({ ...message, name: 'Visitor\r\nBcc: attacker@example.test' })).status, 400);
  assert.equal((await send(message, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await send(message, { Origin: 'https://evil.example.test' })).status, 403);
  assert.equal((await send(null)).status, 400);
  assert.equal(messages.length, 0);
}));

test('honeypot does not send email, and excess requests are throttled', async () => fixture(async ({ send, messages }) => {
  for (let attempt = 0; attempt < 5; attempt++) assert.equal((await send({ ...message, website: 'spam' })).status, 200);
  assert.equal((await send()).status, 429);
  assert.equal(messages.length, 0);
}));

test('missing credentials and SMTP failures never report successful delivery', async () => {
  await fixture(async ({ send }) => assert.equal((await send()).status, 503), { env: { CONTACT_ORIGINS: env.CONTACT_ORIGINS } });
  await fixture(async ({ send }) => {
    const response = await send();
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /has not been sent/);
  }, { createTransport: () => ({ sendMail: async () => { throw new Error('private SMTP details'); } }) });
});

test('rejects oversized messages and unsupported methods', async () => fixture(async ({ send }) => {
  assert.equal((await send({ ...message, message: 'a'.repeat(17000) })).status, 400);
  const response = await send(message, {}, 'GET');
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'POST, OPTIONS');
}));

test('allows a configured static frontend to call the Vercel mail API', async () => fixture(async ({ send }) => {
  const response = await send(message, {}, 'OPTIONS');
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://portfolio.example.test');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal((await send(message, { Origin: 'https://evil.example.test' }, 'OPTIONS')).status, 403);
}));
