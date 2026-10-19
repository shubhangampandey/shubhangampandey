import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { loadEnvFile } from 'node:process';
import { createContactHandler } from './contact.mjs';

for (const file of [`.env.${process.env.NODE_ENV || 'production'}.local`, '.env.local', `.env.${process.env.NODE_ENV || 'production'}`, '.env']) {
  if (existsSync(file)) loadEnvFile(file);
}
const env = process.env;
const contact = createContactHandler({ env });
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf', '.gif': 'image/gif', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  const path = new URL(req.url || '/', 'http://localhost').pathname;
  if (path === '/api/contact') { await contact(req, res); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let file;
  try { file = resolve(root, `.${decodeURIComponent(path)}`); }
  catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    await stat(file);
  } catch { res.writeHead(404).end('Not found'); return; }
  res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
});
server.listen(Number(env.PORT || 5174), '0.0.0.0', () => console.log('Portfolio server ready'));
