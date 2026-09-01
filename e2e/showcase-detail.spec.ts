import { test, expect } from '@playwright/test';

// 3D 렌더 자체는 자동화가 불안정하므로 캔버스의 접근성 속성만 검증한다.

test.describe('gesture-guide-viewer 상세 페이지', () => {
  test('캔버스가 role="img"와 비어있지 않은 aria-label을 가진다', async ({
    page,
  }) => {
    await page.goto('/showcase/gesture-guide-viewer');

    const canvas = page.locator('[role="img"]').first();
    await expect(canvas).toBeVisible();

    const label = await canvas.getAttribute('aria-label');
    // meta.a11yLabel이 채워진 씬 — 자연어 대체 텍스트가 있어야 한다.
    expect(label?.trim().length ?? 0).toBeGreaterThan(10);
    // description(개발자용)이 아니라 a11yLabel이 쓰였는지: 코드 식별자가 없어야 한다.
    expect(label).not.toMatch(/<[A-Z]|OrbitControls|ISSUE-\d/);
  });
});

test.describe('physics-block-tower 상세 페이지', () => {
  test('페이지가 로드되고 제목·캔버스·복귀 버튼이 보인다', async ({ page }) => {
    await page.goto('/showcase/physics-block-tower');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '물리 블록 타워',
    );
    await expect(page.locator('[role="img"]').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /갤러리로 돌아가기/ }),
    ).toBeVisible();
  });
});
