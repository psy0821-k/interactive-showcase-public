import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 테스트 설정.
 * 3D 렌더 자체는 자동화가 불안정하므로 DOM·라우팅·접근성 속성 중심으로 검증한다.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* 테스트 실행 전 프로덕션 서버를 띄운다 (dev보다 실제 배포 동작에 가까움) */
  webServer: {
    command: 'bun run build && bun run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
