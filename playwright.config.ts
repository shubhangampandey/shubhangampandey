import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests', fullyParallel:false, workers:1,
  use:{baseURL:'http://127.0.0.1:5174',headless:true,viewport:{width:1440,height:1000},launchOptions:{args:['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessRestrictions','--no-proxy-server']}},
  reporter:'list', timeout:30000,
  webServer:{command:'npm run preview -- --port 5174',url:'http://127.0.0.1:5174',reuseExistingServer:true,timeout:30000},
});
