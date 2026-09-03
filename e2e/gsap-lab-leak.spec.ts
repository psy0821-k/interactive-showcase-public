import { test, expect, type Page } from '@playwright/test';
import { LAB_ENTRIES } from '../src/gsap-lab/registry';

/**
 * `/gsap-lab` 트윈·ScrollTrigger 누수 검증 (gsap-dom-performance 스킬 5절).
 *
 * 각 데모에 진입해 살아있는 트윈·ScrollTrigger 개수를 기록하고, 인덱스로
 * 나갔다가 같은 데모로 재진입해 개수가 진입 시 값으로 복귀하는지 확인한다.
 * 복귀하지 않으면 `useGsapDom` scope 밖 생성 / `contextSafe` 누락 / 커스텀
 * 리스너 cleanup 누락 중 하나다.
 *
 * Playwright는 `requestAnimationFrame`이 스로틀되어 프레임레이트는 못 재지만,
 * `window.__gsapLab`(개발 빌드 + `NEXT_PUBLIC_E2E=1` 프로덕션 빌드에서 노출되는
 * 디버그 핸들)의 카운터는 정확하다.
 *
 * @see src/hooks/use-gsap-dom.ts — __gsapLab 정의
 */

/** 재진입 후 허용 오차 (StrictMode 이중 마운트·GSAP 내부 정리 지연 흡수). */
const TOLERANCE = 2;

interface Counters {
  tweens: number;
  scrollTriggers: number;
}

/** `window.__gsapLab`이 노출될 때까지 기다렸다가 카운터를 읽는다. */
async function readCounters(page: Page): Promise<Counters> {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __gsapLab?: unknown }).__gsapLab !==
      'undefined',
    undefined,
    { timeout: 5_000 },
  );
  return page.evaluate(() => {
    const lab = (
      window as unknown as {
        __gsapLab: {
          liveTweenCount: () => number;
          scrollTriggers: () => number;
        };
      }
    ).__gsapLab;
    return {
      tweens: lab.liveTweenCount(),
      scrollTriggers: lab.scrollTriggers(),
    };
  });
}

/**
 * ScrollTrigger가 생성되도록 페이지 전체를 한 번 훑고 맨 위로 돌아온다.
 * 스크롤 데모는 진입 직후엔 트리거가 지연 생성될 수 있어 필요하다.
 */
async function primeScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const steps = 8;
    const max = document.documentElement.scrollHeight;
    for (let i = 1; i <= steps; i += 1) {
      window.scrollTo(0, (max * i) / steps);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 120));
  });
}

test.describe('/gsap-lab 트윈·ScrollTrigger 누수', () => {
  for (const entry of LAB_ENTRIES) {
    test(`${entry.slug} — 라우트 왕복 후 GSAP 객체가 쌓이지 않는다`, async ({
      page,
    }) => {
      // 1차 진입
      await page.goto(`/gsap-lab/${entry.slug}`);
      await primeScroll(page);
      const first = await readCounters(page);

      // 인덱스로 이탈했다가 같은 데모로 재진입
      await page.goto('/gsap-lab');
      await page.goto(`/gsap-lab/${entry.slug}`);
      await primeScroll(page);
      const second = await readCounters(page);

      // 재진입 후 개수가 1차 진입 시 값(+오차) 이하여야 한다.
      expect(
        second.tweens,
        `${entry.slug}: 살아있는 트윈이 ${first.tweens} → ${second.tweens}로 증가 (누수 의심)`,
      ).toBeLessThanOrEqual(first.tweens + TOLERANCE);

      expect(
        second.scrollTriggers,
        `${entry.slug}: ScrollTrigger가 ${first.scrollTriggers} → ${second.scrollTriggers}로 증가 (누수 의심)`,
      ).toBeLessThanOrEqual(first.scrollTriggers + TOLERANCE);
    });
  }
});
