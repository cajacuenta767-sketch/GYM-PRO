import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de extremo a extremo. Requieren la API en :4000 y la web en :5173
 * (se levantan solas con `webServer` si no están corriendo).
 * Define PW_CHROMIUM_PATH para usar un Chromium preinstalado.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    locale: 'es-CO',
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH, args: ['--no-sandbox'] } } : {}),
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: /portal\.spec\.ts/ },
  ],
  webServer: process.env.E2E_NO_SERVER ? undefined : [
    { command: 'npm run start -w apps/api', cwd: '../..', port: 4000, reuseExistingServer: true, timeout: 60_000, env: { PORT: '4000' } },
    { command: 'npm run dev -w apps/web', cwd: '../..', port: 5173, reuseExistingServer: true, timeout: 60_000 },
  ],
});
