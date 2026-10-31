import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', testMatch: 'engine-browser.spec.ts', workers: 1, timeout: 120_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174', viewport: { width: 800, height: 450 },
    headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: {
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : process.platform === 'win32' ? { channel: 'msedge' } : {}),
      args: ['--mute-audio', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI, timeout: 30_000,
  },
});
