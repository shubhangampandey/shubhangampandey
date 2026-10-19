import { defineConfig, loadEnv } from 'vite';
import { createContactHandler } from './server/contact.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [{
    name: 'portfolio-contact',
    configureServer(server) {
      const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
      const handler = createContactHandler({ env });
      server.middlewares.use('/api/contact', (req, res) => { void handler(req, res); });
    },
  }],
}));
