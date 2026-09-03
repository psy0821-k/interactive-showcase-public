"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";

/**
 * slug → 랜딩 페이지 컴포넌트. registry와 1:1 대응.
 *
 * 각 페이지는 R3F `<Canvas>`(재조정자가 SSR 하이드레이션을 지원하지 않음)와
 * GSAP ScrollTrigger(window·DOM 접근)를 쓰므로 `ssr: false`로 로드한다.
 * `dynamic()`은 모듈 스코프에서 한 번만 부른다 — 렌더 중 호출하면 매 렌더
 * 새 컴포넌트가 생겨 상태가 초기화된다.
 */
const PAGE_COMPONENTS: Record<string, ComponentType> = {
  // 순수 DOM + GSAP 페이지. R3F가 없어 SSR 가능하지만, useGsapDom이
  // 클라이언트 훅이라 나머지와 동일하게 dynamic 로드한다.
  forest: dynamic(
    () => import("@/landings/pages/forest-page").then((m) => m.ForestPage),
    { ssr: false },
  ),
  "cloud-sync": dynamic(
    () => import("@/landings/pages/cloud-sync-page").then((m) => m.CloudSyncPage),
    { ssr: false },
  ),
  "orbit-launch": dynamic(
    () =>
      import("@/landings/pages/orbit-launch-page").then(
        (m) => m.OrbitLaunchPage,
      ),
    { ssr: false },
  ),
  "prism-pricing": dynamic(
    () =>
      import("@/landings/pages/prism-pricing-page").then(
        (m) => m.PrismPricingPage,
      ),
    { ssr: false },
  ),
  "grid-metrics": dynamic(
    () =>
      import("@/landings/pages/grid-metrics-page").then(
        (m) => m.GridMetricsPage,
      ),
    { ssr: false },
  ),
  "ribbon-story": dynamic(
    () =>
      import("@/landings/pages/ribbon-story-page").then(
        (m) => m.RibbonStoryPage,
      ),
    { ssr: false },
  ),
  "crystal-features": dynamic(
    () =>
      import("@/landings/pages/crystal-features-page").then(
        (m) => m.CrystalFeaturesPage,
      ),
    { ssr: false },
  ),
};

export function LandingRenderer({ slug }: { slug: string }) {
  const PageComponent = PAGE_COMPONENTS[slug];
  if (!PageComponent) {
    return (
      <main className="flex-1 px-6 py-24 text-center text-sm text-neutral-500">
        이 랜딩을 불러올 수 없습니다.
      </main>
    );
  }
  return <PageComponent />;
}
