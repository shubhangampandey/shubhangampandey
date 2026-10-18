import {defineConfig} from '@playwright/test';
import config from './playwright.config';

// Exercise Vite's development CSS pipeline, separately from the built preview.
export default defineConfig({
  ...config,
  use:{...config.use,baseURL:'http://127.0.0.1:5173'},
  webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:30000},
});
