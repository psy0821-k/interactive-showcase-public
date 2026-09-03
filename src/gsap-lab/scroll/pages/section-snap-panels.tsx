'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import {
  refreshAfterLayout,
  ScrollTrigger,
} from '@/gsap-lab/scroll/scroll-trigger-setup';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

// 어두운 cyan 그라데이션 — 패널 위 흰 텍스트(text-white/60 카운터 포함)가
// WCAG AA(4.5:1)를 넘도록.
const PANELS = [
  { title: '받은 편지함 제로', background: '#0c4a6e' },
  { title: '3초 만에 캡처', background: '#0d4f5f' },
  { title: '팀과 실시간 공유', background: '#0e5568' },
  { title: '어디서나 오프라인', background: '#105a70' },
];

/**
 * `/gsap-lab/section-snap-panels` — 풀스크린 패널이 한 섹션씩 스냅된다.
 *
 * 하나의 ScrollTrigger에 `snap`을 걸어 스크롤을 놓으면 가장 가까운 패널
 * 경계로 부드럽게 스냅한다. 각 패널 콘텐츠는 자기 트리거로 진입 시 등장.
 */
export function SectionSnapPanelsPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();

    // 콘텐츠 등장
    if (!reduced) {
      PANELS.forEach((_, index) => {
        g.from(`.snap-panel[data-index="${index}"] .snap-inner`, {
          y: 40,
          autoAlpha: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: `.snap-panel[data-index="${index}"]`,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }

    // 스냅 (모션 축소 시엔 걸지 않는다)
    if (reduced) return;
    ScrollTrigger.create({
      trigger: '.snap-track',
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: 1 / (PANELS.length - 1),
        duration: { min: 0.2, max: 0.5 },
        ease: 'power2.inOut',
      },
    });
  }, container);

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="섹션 스냅 패널"
        summary="스크롤을 놓으면 가장 가까운 풀스크린 패널로 스냅된다 (ScrollTrigger snap)"
      >
        <div className="snap-track">
          {PANELS.map((panel, index) => (
            <section
              key={panel.title}
              data-index={index}
              className="snap-panel flex h-screen flex-col items-center justify-center px-6 text-center"
              style={{ background: panel.background }}
            >
              <div className="snap-inner">
                <span className="text-sm font-medium uppercase tracking-widest text-white/75">
                  {String(index + 1).padStart(2, '0')} / {PANELS.length}
                </span>
                <h2 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
                  {panel.title}
                </h2>
                <div
                  className="mx-auto mt-8 h-40 w-full max-w-md rounded-2xl bg-white/15"
                  aria-hidden
                />
              </div>
            </section>
          ))}
        </div>
      </ScrollDemoShell>
    </div>
  );
}
