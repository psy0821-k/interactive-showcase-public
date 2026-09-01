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
    expect(label?.trim().length ?? 0).toBeGreaterThan(0);
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
