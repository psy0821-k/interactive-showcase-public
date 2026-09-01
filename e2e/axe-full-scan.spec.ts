import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 전체 페이지 axe 전수 스캔.
 *
 * showcase-detail.spec.ts 등 일반 E2E와 분리한다 — 35개 상세 페이지를 순회하며
 * 매번 캔버스 마운트를 기다려 느리다. CI 기본 실행에는 포함하되(느려도 신호가
 * 크다), 로컬에서는 `bunx playwright test axe-full-scan`으로 따로 돌린다.
 *
 * WCAG 2.0/2.1 A·AA 태그. color-contrast는 캔버스 위 텍스트에서 배경 판정이
 * 불가능해 axe가 incomplete로 남기므로 규칙에서 제외하고, 사람이 별도 확인한다
 * (docs/ACCESSIBILITY.md §3).
 */

const SHOWCASES_DIR = join(process.cwd(), 'src', 'showcases');

/** src/showcases/{category}/{slug} 를 걷어 slug 목록을 만든다. */
function collectSlugs(): string[] {
  const slugs: string[] = [];
  for (const category of readdirSync(SHOWCASES_DIR, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const categoryDir = join(SHOWCASES_DIR, category.name);
    for (const showcase of readdirSync(categoryDir, { withFileTypes: true })) {
      if (showcase.isDirectory()) slugs.push(showcase.name);
    }
  }
  return slugs.sort();
}

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .disableRules(['color-contrast']) // 캔버스 위 텍스트 배경 판정 불가 — 사람 확인
    .analyze();
}

test.describe('axe 전수 스캔', () => {
  test('갤러리 홈 (/)', async ({ page }) => {
    await page.goto('/');
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('GSAP 갤러리 (/gsap)', async ({ page }) => {
    await page.goto('/gsap');
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  for (const slug of collectSlugs()) {
    test(`상세: ${slug}`, async ({ page }) => {
      await page.goto(`/showcase/${slug}`);
      // 캔버스(role="img")가 DOM에 올라올 때까지 대기 — 접근성 속성 검증 대상
      await page.locator('[role="img"]').first().waitFor({ timeout: 15_000 });
      const results = await scan(page);
      expect(
        results.violations,
        JSON.stringify(
          results.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
          null,
          2,
        ),
      ).toEqual([]);
    });
  }
});
