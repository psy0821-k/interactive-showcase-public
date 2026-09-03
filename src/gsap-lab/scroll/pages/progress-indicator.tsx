'use client';

import { useRef } from 'react';
import { useScrollProgress } from '@/gsap-lab/primitives';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

const SECTIONS = [
  // 어두운 cyan 그라데이션 — 위에 얹는 흰 텍스트가 WCAG AA(4.5:1)를 넘도록.
  { id: 'intro', label: '소개', background: '#083344' },
  { id: 'features', label: '기능', background: '#0b556a' },
  { id: 'pricing', label: '요금', background: '#0e627a' },
  { id: 'faq', label: 'FAQ', background: '#116d87' },
];

/**
 * `/gsap-lab/progress-indicator` — 진행바 + 현재 섹션 하이라이트.
 *
 * 역할 분리(실무 표준):
 * - **진행률**은 ScrollTrigger 하나 — `onUpdate`에서 `self.progress`로 진행바
 *   `scaleX` 갱신(`width` 아님, 리플로우 방지).
 * - **현재 섹션 판정**은 `IntersectionObserver` — 섹션 수만큼 트리거를 만드는
 *   대신 옵저버 하나가 모든 섹션의 가시성을 관찰한다. 트리거 예산 = 1.
 */
export function ProgressIndicatorPage() {
  const container = useRef<HTMLDivElement>(null);

  useScrollProgress(container, {
    bar: '.doc-progress',
    tocLink: '.toc-link',
    section: '[data-progress-section]',
  });

  return (
    <div ref={container}>
      {/* 상단 진행바 */}
      <div className="fixed left-0 top-0 z-50 h-1 w-full bg-white/10">
        <div className="doc-progress h-full w-full origin-left scale-x-0 bg-cyan-400" />
      </div>

      <ScrollDemoShell
        title="진행 인디케이터"
        summary="진행바는 ScrollTrigger 1개, 현재 섹션은 IntersectionObserver 1개 (트리거 예산 최소)"
      >
        <div className="mx-auto flex max-w-5xl gap-10 px-6 py-16">
          {/* 목차 */}
          <nav className="sticky top-24 hidden h-max w-40 shrink-0 flex-col gap-2 text-sm sm:flex">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                data-id={section.id}
                className="toc-link rounded px-2 py-1 text-white/50 transition-colors"
              >
                {section.label}
              </a>
            ))}
          </nav>

          {/* 섹션들 */}
          <div className="flex-1 space-y-8">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                data-progress-section
                className="flex min-h-[80vh] flex-col justify-center rounded-3xl p-10 text-white"
                style={{ background: section.background }}
              >
                <h2 className="text-3xl font-semibold">{section.label}</h2>
                <div
                  className="mt-6 h-40 w-full rounded-xl bg-white/15"
                  aria-hidden
                />
                <p className="mt-6 max-w-lg text-white/90">
                  이 섹션이 화면 중앙을 지나는 동안 왼쪽 목차의 “{section.label}
                  ” 항목이 밝게 활성화됩니다.
                </p>
              </section>
            ))}
          </div>
        </div>
      </ScrollDemoShell>
    </div>
  );
}
