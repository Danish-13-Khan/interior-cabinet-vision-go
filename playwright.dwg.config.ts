import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: 'http://127.0.0.1:1433' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 1433', url: 'http://127.0.0.1:1433', reuseExistingServer: false, timeout: 120000 },
});
