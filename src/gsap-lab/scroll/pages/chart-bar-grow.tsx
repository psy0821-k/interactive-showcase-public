'use client';

import { useRef } from 'react';
import { useCountUp, useRevealOnScroll } from '@/gsap-lab/primitives';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

const BARS = [
  { label: '1월', value: 42, background: '#166534' },
  { label: '2월', value: 68, background: '#15803d' },
  { label: '3월', value: 55, background: '#16a34a' },
  { label: '4월', value: 91, background: '#22c55e' },
  { label: '5월', value: 74, background: '#4ade80' },
  { label: '6월', value: 100, background: '#86efac' },
];

/**
 * `/gsap-lab/chart-bar-grow` — 막대그래프가 뷰포트 진입 시 자라난다.
 *
 * 막대 성장 = `useRevealOnScroll`(`from: { scaleY: 0 }`, `transform-origin: bottom`
 * 이라 리플로우 없음). 수치 라벨 = `useCountUp`. 둘 다 한 번만 재생.
 */
export function ChartBarGrowPage() {
  const container = useRef<HTMLDivElement>(null);

  useRevealOnScroll(container, {
    target: '.chart-bar',
    trigger: '.chart-stage',
    start: 'top 70%',
    from: { scaleY: 0 },
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.1,
    reversible: false,
  });

  useCountUp(container, {
    target: '.chart-num',
    trigger: '.chart-stage',
    targets: BARS.map((b) => ({ value: b.value })),
    duration: 0.8,
    start: 'top 70%',
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="차트 바 성장"
        summary="막대가 0에서 목표 높이까지 자라나고 수치가 카운트업된다 (scaleY + stagger)"
      >
        <section className="chart-stage mx-auto max-w-3xl px-6 py-40">
          <div className="flex h-72 items-end justify-between gap-3 border-b border-white/20 pb-0">
            {BARS.map((bar) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="chart-num text-sm font-semibold tabular-nums text-white">
                  0
                </span>
                <div
                  className="chart-bar w-full origin-bottom rounded-t-md"
                  style={{
                    height: `${bar.value * 2.2}px`,
                    background: bar.background,
                  }}
                  aria-hidden
                />
                <span className="text-xs text-white/60">{bar.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          `scaleY` + `transform-origin: bottom`이라 레이아웃 재계산 없이
          부드럽게 자랍니다. 한 번만 재생됩니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
