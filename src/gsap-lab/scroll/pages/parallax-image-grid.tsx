"use client";

import { useRef } from "react";
import { usePinnedTimeline } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

/**
 * 3개 세로 컬럼. 컬럼마다 시작 위치와 스크롤 이동량이 다르다.
 * 가운데 컬럼은 아래로 흐르고(+), 바깥 컬럼은 위로 흐른다(−) → 서로 엇갈린다.
 */
const COLUMNS = [
  { travel: -520, startY: 0, hue: 280 },
  { travel: 520, startY: -520, hue: 200 },
  { travel: -420, startY: 0, hue: 330 },
];

/** 각 컬럼에 들어갈 카드 6장. */
const CARDS_PER_COLUMN = 6;

/**
 * `/gsap-lab/parallax-image-grid` — 컬럼마다 스크롤 속도가 다른 갤러리.
 *
 * stage를 `pin` 고정해 배경 스크롤을 멈추고, 그 구간 동안 3개 컬럼을 서로
 * 다른 방향·속도로 `y` 스크럽 이동시킨다. 배경이 멈춰 있으므로 컬럼 간
 * 속도차만 남아 패럴랙스가 선명하게 보인다.
 */
export function ParallaxImageGridPage() {
  const container = useRef<HTMLDivElement>(null);

  // 핀 고정 + 컬럼별 y 스크럽. 배경이 멈춰 컬럼 간 속도차만 보인다.
  usePinnedTimeline(
    container,
    { trigger: ".pg-stage", length: [2.4, 1.6] },
    ({ tl }) => {
      COLUMNS.forEach((col, index) => {
        tl.fromTo(
          `.pg-column[data-index="${index}"]`,
          { y: col.startY },
          { y: col.startY + col.travel, ease: "none" },
          0,
        );
      });
    },
    (g) => g.set(".pg-column", { y: 0 }),
  );

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="패럴랙스 이미지 그리드"
        summary="핀 고정된 갤러리에서 컬럼마다 다른 방향·속도로 흐른다 (pin + 컬럼별 y 스크럽)"
      >
        <section className="pg-stage relative h-[280vh]">
          <div className="sticky top-0 flex h-screen items-start justify-center gap-4 overflow-hidden px-6">
            {COLUMNS.map((col, index) => (
              <div
                key={index}
                data-index={index}
                className="pg-column flex w-1/3 max-w-xs flex-col gap-4"
              >
                {Array.from({ length: CARDS_PER_COLUMN }, (_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="w-full rounded-2xl"
                    style={{
                      height: 220 + ((index + cardIndex) % 3) * 60,
                      background: `hsl(${col.hue + cardIndex * 8} 55% ${
                        32 + (cardIndex % 3) * 7
                      }%)`,
                    }}
                    aria-hidden
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          가운데 컬럼은 아래로, 양옆 컬럼은 위로 흐릅니다. 배경이 핀으로 멈춰
          있어 컬럼 간 속도차만 보입니다. 되감으면 반대로 흐릅니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
