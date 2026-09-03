'use client';

import { useRef } from 'react';
import { usePinnedTimeline } from '@/gsap-lab/primitives';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

/** 그리드 열/행 수. 시작 배율 계산에 쓴다. */
const GRID_COLS = 3;
const TILES = Array.from({ length: GRID_COLS * GRID_COLS }, (_, i) => ({
  background: `hsl(${(i * 40) % 360} 55% ${34 + (i % 3) * 8}%)`,
}));

/**
 * `/gsap-lab/zoom-out-reveal` — 확대된 조각에서 전체 레이아웃으로.
 *
 * 처음엔 그리드의 한 칸이 화면을 채우도록 전체 그리드를 크게 `scale` 해두고,
 * 스크롤하면 `scale`이 1로 줄며 전체 그리드가 드러난다. 핀 + 스크럽.
 *
 * 시작 배율은 하드코딩이 아니라 **실측**: "한 칸이 화면을 채우려면 그리드
 * 전체를 몇 배 키워야 하는가" = 그리드 폭 / 한 칸 폭 = `GRID_COLS`에 갭 보정.
 * refresh 때 다시 잰다(`invalidateOnRefresh`).
 */
export function ZoomOutRevealPage() {
  const container = useRef<HTMLDivElement>(null);

  usePinnedTimeline(
    container,
    { trigger: '.zoom-stage', length: [2, 1.3] },
    ({ tl }) => {
      const grid = container.current?.querySelector<HTMLElement>('.zoom-grid');
      if (!grid) return;

      // 한 칸이 뷰포트 짧은 변을 채우도록 하는 배율.
      // `offsetWidth`(레이아웃 폭)를 쓴다 — `getBoundingClientRect`는 이미
      // 적용된 scale에 오염돼 피드백 루프가 생긴다.
      const startScale = () => {
        const gapPx = 8; // gap-2
        const tileSize =
          (grid.offsetWidth - gapPx * (GRID_COLS - 1)) / GRID_COLS;
        const viewportShort = Math.min(window.innerWidth, window.innerHeight);
        return Math.max(1.2, (viewportShort * 0.9) / tileSize);
      };

      tl.fromTo(
        grid,
        { scale: startScale, transformOrigin: '50% 50%' },
        { scale: 1, ease: 'none', immediateRender: false },
      );
    },
    (g) => {
      g.set('.zoom-grid', { scale: 1, xPercent: 0, yPercent: 0 });
    },
  );

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="줌아웃 공개"
        summary="화면을 채운 확대 상태에서 스크롤하면 축소되며 전체 그리드가 드러난다 (scale + 핀 스크럽)"
      >
        <section className="zoom-stage relative h-[240vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
            <div className="zoom-grid grid aspect-square w-[min(80vw,80vh)] grid-cols-3 gap-2">
              {TILES.map((tile, i) => (
                <div
                  key={i}
                  className="rounded-lg"
                  style={{ background: tile.background }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          되감으면 다시 한 칸으로 확대됩니다. 제품의 세부 → 전체 흐름을 보여줄
          때 씁니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
