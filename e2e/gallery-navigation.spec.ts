import { test, expect } from '@playwright/test';

test('갤러리 → 카드 클릭 → 상세 → 돌아가기 흐름', async ({ page }) => {
  await page.goto('/');

  const firstCard = page.locator('a[href^="/showcase/"]').first();
  await expect(firstCard).toBeVisible();

  const href = await firstCard.getAttribute('href');
  expect(href).toMatch(/^\/showcase\/.+/);

  // 카드 클릭 → 상세 진입
  await firstCard.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // 돌아가기 버튼 → 갤러리 복귀 (history.back)
  await page.getByRole('button', { name: /갤러리로 돌아가기/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('a[href^="/showcase/"]').first()).toBeVisible();
});
