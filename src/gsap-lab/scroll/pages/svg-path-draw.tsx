'use client';

import { useRef } from 'react';
import { useDrawSvgPaths } from '@/gsap-lab/primitives';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

/**
 * `/gsap-lab/svg-path-draw` — 스크롤에 따라 SVG 경로가 그려진다.
 *
 * `strokeDasharray`를 경로 전체 길이로 두고 `strokeDashoffset`을 길이 → 0으로
 * 스크럽한다. `getTotalLength()`로 각 경로 길이를 구한다. 유료 DrawSVG
 * 플러그인 없이 순수 SVG 속성만 사용.
 */
export function SvgPathDrawPage() {
  const container = useRef<HTMLDivElement>(null);

  useDrawSvgPaths(container, {
    target: '.draw-path',
    trigger: '.draw-stage',
    mode: 'scrub',
    start: 'top 60%',
    end: 'bottom 80%',
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="SVG 경로 그리기"
        summary="스크롤 진행에 맞춰 선이 그려진다 (strokeDasharray/Dashoffset 스크럽)"
      >
        <section className="draw-stage mx-auto flex min-h-[160vh] max-w-3xl flex-col items-center justify-center px-6 py-32">
          <svg
            viewBox="0 0 400 300"
            className="w-full max-w-lg"
            fill="none"
            aria-hidden
          >
            {/* 연결선 */}
            <path
              className="draw-path"
              d="M40 250 C 120 250, 120 60, 200 60 S 280 250, 360 250"
              stroke="#2dd4bf"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* 밑줄 강조 */}
            <path
              className="draw-path"
              d="M60 285 Q 200 265, 340 285"
              stroke="#0d9488"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* 체크 아이콘 */}
            <path
              className="draw-path"
              d="M170 150 l 25 25 l 50 -60"
              stroke="#5eead4"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-10 text-center text-white/70">
            세 경로가 각자의 길이에 맞춰 스크롤 구간 동안 그려집니다.
          </p>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          되감으면 선이 지워집니다. 실무에서는 서명·다이어그램 연결선·아이콘
          윤곽에 자주 씁니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
