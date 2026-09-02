import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LAB_ENTRIES } from '../src/gsap-lab/registry';

/**
 * 전체 페이지 axe 전수 스캔.
 *
 * showcase-detail.spec.ts 등 일반 E2E와 분리한다 — 상세 페이지를 순회하며
 * 매번 캔버스 마운트를 기다려 느리다. CI 기본 실행에는 포함하되(느려도 신호가
 * 크다), 로컬에서는 `bunx playwright test axe-full-scan`으로 따로 돌린다.
 *
 * WCAG 2.0/2.1 A·AA 태그.
 *
 * - `/showcase/*` (R3F 캔버스): color-contrast를 규칙에서 제외한다. 캔버스 위
 *   텍스트는 배경(WebGL 렌더)을 axe가 계산할 수 없어 incomplete로 남으므로
 *   사람이 별도 확인한다 (docs/ACCESSIBILITY.md §3).
 * - `/gsap-lab/*` (순수 DOM): color-contrast를 **켠다.** 캔버스가 없어 배경
 *   계산이 가능하므로 자동 게이트로 다룬다.
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

/**
 * @param withContrast color-contrast 규칙을 켤지. 순수 DOM 페이지는 true,
 *   WebGL 캔버스 위 텍스트가 있는 페이지는 false.
 */
async function scan(
  page: import('@playwright/test').Page,
  withContrast = false,
) {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (!withContrast) builder.disableRules(['color-contrast']);
  return builder.analyze();
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

  // 순수 DOM GSAP 랩 — 캔버스가 없으므로 color-contrast까지 자동 게이트.
  // reduced-motion으로 스캔한다: GSAP 등장 애니메이션이 `gsap.set(최종상태)`로
  // 즉시 완료되어, 페이드인 중간의 반투명 상태(false positive)가 없다.
  // "콘텐츠가 최종 상태에서 접근 가능한가"가 검증 대상이다.
  for (const entry of LAB_ENTRIES) {
    test(`GSAP Lab: ${entry.slug}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/gsap-lab/${entry.slug}`);
      const results = await scan(page, true);
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
