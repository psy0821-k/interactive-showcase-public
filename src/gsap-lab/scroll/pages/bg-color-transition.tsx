'use client';

import { useRef } from 'react';
import type gsapType from 'gsap';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import {
  refreshAfterLayout,
  ScrollTrigger,
} from '@/gsap-lab/scroll/scroll-trigger-setup';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

/** 섹션별 (배경색, 글자색). 스크롤 진행에 따라 인접 색끼리 보간된다. */
const SECTIONS = [
  { id: 'a', title: '캡처', bg: '#0c4a6e', fg: '#e0f2fe' },
  { id: 'b', title: '정리', bg: '#134e4a', fg: '#ccfbf1' },
  { id: 'c', title: '공유', bg: '#713f12', fg: '#fef3c7' },
  { id: 'd', title: '게시', bg: '#581c87', fg: '#f3e8ff' },
];

/**
 * `/gsap-lab/bg-color-transition` — 스크롤에 따라 페이지 배경색이 전환.
 *
 * ScrollTrigger **하나**의 `onUpdate`에서 문서 진행률(0~1)을 섹션 구간으로
 * 나눠 **인접 두 색 사이를 보간**한다. 섹션마다 트리거를 만들던 방식(트리거 N개,
 * 딱딱한 전환) 대신, 트리거 1개로 스크롤에 직결된 부드러운 크로스페이드.
 * `gsap.utils.interpolate`가 hex 색 보간을 처리한다.
 */
export function BgColorTransitionPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();
    const layer = container.current?.querySelector<HTMLElement>('.bg-layer');
    if (!layer) return;

    const bgAt = (t: number) => interpolateStops(g, t, (s) => s.bg);
    const fgAt = (t: number) => interpolateStops(g, t, (s) => s.fg);

    if (reduced) {
      g.set(layer, { backgroundColor: bgAt(0) });
      g.set('.bg-fg', { color: fgAt(0) });
      return;
    }

    // quickSetter로 매 프레임 값만 갱신 (트윈 생성 없음).
    const setBg = g.quickSetter(layer, 'backgroundColor') as (
      v: string,
    ) => void;
    const setFgList = [
      ...(container.current?.querySelectorAll('.bg-fg') ?? []),
    ].map((el) => g.quickSetter(el, 'color') as (v: string) => void);

    ScrollTrigger.create({
      trigger: container.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setBg(bgAt(self.progress));
        const fg = fgAt(self.progress);
        setFgList.forEach((set) => set(fg));
      },
    });
  }, container);

  return (
    <div ref={container} className="relative">
      <div
        className="bg-layer fixed inset-0 -z-10"
        style={{ backgroundColor: SECTIONS[0].bg }}
      />

      <ScrollDemoShell
        title="배경색 스크롤 전환"
        summary="ScrollTrigger 1개가 진행률로 인접 섹션 색을 보간한다 (트리거 예산 1, 진짜 크로스페이드)"
        transparent
      >
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`bg-section-${section.id}`}
            className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
            // 전환 효과는 위 fixed `.bg-layer`가 담당하지만, 섹션에도 자기
            // 배경색을 깔아 둔다 — 스크립트 없이도 대비가 성립하고(진행적 향상),
            // axe가 fixed·음수 z-index 레이어를 배경으로 계산하지 못하는
            // false positive도 없앤다.
            style={{ backgroundColor: section.bg }}
          >
            <h2
              className="bg-fg text-5xl font-semibold"
              style={{ color: SECTIONS[0].fg }}
            >
              {section.title}
            </h2>
            <div
              className="mt-8 h-40 w-full max-w-md rounded-2xl bg-white/15"
              aria-hidden
            />
            <p
              className="bg-fg mt-6 max-w-sm text-sm opacity-80"
              style={{ color: SECTIONS[0].fg }}
            >
              스크롤하면 배경이 인접 섹션 색으로 연속적으로 섞입니다.
            </p>
          </section>
        ))}
      </ScrollDemoShell>
    </div>
  );
}

/**
 * 진행률 t(0~1)에서 SECTIONS의 색 스톱을 보간한다.
 * 구간 [i/N, (i+1)/N]을 SECTIONS[i] → SECTIONS[i+1] 사이로 매핑.
 */
function interpolateStops(
  g: typeof gsapType,
  t: number,
  pick: (s: (typeof SECTIONS)[number]) => string,
): string {
  const n = SECTIONS.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.min(Math.floor(scaled), n - 1);
  const local = scaled - i;
  return g.utils.interpolate(pick(SECTIONS[i]), pick(SECTIONS[i + 1]), local);
}
