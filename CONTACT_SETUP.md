# Contact email

The **Send message** button sends JSON to `/api/contact`. The server sends the message over authenticated SMTP; visitors do not need an email app. A success message appears only after SMTP accepts delivery. Inbox placement still depends on the mail provider.

1. Copy `.env.example` to `.env.local` (ignored by Git).
2. Set `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` (your receiving address), and optionally `MAIL_FROM` (defaults to `SMTP_USER`). `SMTP_USER` must be the account that generated the app password, which may differ from your receiving address. Use a provider-specific app password, not your normal account password. Paste Gmail app passwords without the display spaces. Never use a `VITE_` prefix for these secrets.
3. `npm run dev` runs the frontend and contact API together. Restart after changing environment variables. If using another port/origin, add its exact origin to `CONTACT_ORIGINS`.
4. For a production-style local run: `npm run build`, then `npm start` (port 5174, or `PORT`).

Vercel automatically discovers `api/contact.mjs`. Configure the same server-side variables in its project settings and redeploy. Keep the Render frontend as a free static site and set its build variable `VITE_CONTACT_API_URL=https://shubhangampandey.vercel.app/api/contact`. Add the exact Render origin to the Vercel mail API's `CONTACT_ORIGINS` (the example already includes it). The handler supports allowlisted CORS preflights, so the Render frontend can use the Vercel mail backend without sharing SMTP secrets with the browser. Render free web services block outbound SMTP ports; do not upgrade to a paid service just for this form. See [Render's free-service limitations](https://render.com/docs/free#other-limitations).

For other Node hosts that allow SMTP, build with `npm ci && npm run build` and start with `npm start`. A static host cannot execute the handler itself. No cloud configuration was changed by this local implementation.

Messages use the configured sender and recipient, with the visitor as Reply-To. The handler validates and bounds input, blocks unexpected origins, uses a honeypot, and limits each client to five attempts per ten minutes per running server instance. Serverless instances do not share this in-memory limiter; use a provider/WAF quota or shared limiter for sustained public traffic. Do not regard Origin checks as bot authentication.

If Gmail returns `535 / BadCredentials`, generate a fresh Google app password for the exact account in `SMTP_USER`; a randomly generated password or your normal Gmail password will not work. Port 587 uses required STARTTLS. Restart the local server after updating `.env.local`.

Project source/live links are centralized in `src/personal-links.ts` and shown in the project cards and project explorer.
