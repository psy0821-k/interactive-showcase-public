'use client';

import { useRef } from 'react';
import { useRevealOnScroll } from '@/gsap-lab/primitives';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

/** 마스크 뒤에서 올라올 텍스트 줄들. 실제 서비스에선 문단을 줄 단위로 쪼갠다. */
const LINES = [
  '생각은 흘러가고,',
  '메모는 남는다.',
  'Fluxnote는 그 사이의 마찰을',
  '0에 가깝게 줄입니다.',
];

/**
 * `/gsap-lab/line-mask-text` — 문단이 줄 단위로 마스크 뒤에서 슬라이드업.
 *
 * 각 줄을 `overflow: hidden` 래퍼로 감싸고, 안쪽 `<span>`을 `yPercent: 100`
 * (줄 아래로 숨김)에서 0으로 올린다. `stagger`로 줄마다 시간차.
 * `from` + ScrollTrigger `toggleActions`로 뷰포트 진입 시 재생.
 */
export function LineMaskTextPage() {
  const container = useRef<HTMLDivElement>(null);

  // 안쪽 <span>을 줄 아래(yPercent 100)에서 0으로. `overflow: hidden` 래퍼가
  // 삐져나온 부분을 잘라준다.
  useRevealOnScroll(container, {
    target: '.mask-line-inner',
    trigger: '.mask-text-block',
    start: 'top 70%',
    from: { yPercent: 100 },
    duration: 0.9,
    stagger: 0.12,
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="텍스트 라인 마스크"
        summary="문단이 줄 단위로 마스크 뒤에서 밀려 올라온다 (overflow: hidden + yPercent 스태거)"
      >
        <section className="mask-text-block mx-auto max-w-3xl px-6 py-40">
          <h2 className="text-3xl font-semibold leading-tight sm:text-5xl">
            {LINES.map((line, index) => (
              <span key={index} className="block overflow-hidden py-1">
                <span className="mask-line-inner inline-block">{line}</span>
              </span>
            ))}
          </h2>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          되감으면 줄이 다시 마스크 아래로 내려갑니다. `overflow: hidden` 래퍼가
          삐져나온 부분을 잘라주는 것이 핵심입니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
