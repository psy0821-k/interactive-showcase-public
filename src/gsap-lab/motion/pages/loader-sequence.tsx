'use client';

import { useRef } from 'react';
import type gsap from 'gsap';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { DemoShell } from '@/gsap-lab/demo-shell';

const CONTENT_CARDS = [
  { title: '받은 편지함', background: '#1e293b' },
  { title: '오늘 할 일', background: '#334155' },
  { title: '최근 노트', background: '#475569' },
  { title: '팀 활동', background: '#64748b' },
];

/**
 * `/gsap-lab/loader-sequence` — 하나의 마스터 타임라인이 오프닝 전체를 제어.
 *
 * 로고 등장 → 프로그레스 바 채움 → 오버레이가 위아래로 갈라져 이탈 →
 * 콘텐츠 카드 stagger 등장. 클릭하면 다시 재생(`restart`).
 */
export function LoaderSequencePage() {
  const container = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGsapDom(({ gsap: g, reduced, contextSafe }) => {
    if (reduced) {
      g.set('.loader-overlay', { autoAlpha: 0 });
      g.set('.content-card', { autoAlpha: 1, y: 0 });
      return;
    }

    const tl = g.timeline({ defaults: { ease: 'power3.out' } });
    tlRef.current = tl;

    tl.from('.loader-logo', {
      scale: 0.4,
      autoAlpha: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
    })
      .to(
        '.loader-progress',
        { scaleX: 1, duration: 0.9, ease: 'power1.inOut' },
        '+=0.1',
      )
      .to('.loader-logo', { autoAlpha: 0, y: -20, duration: 0.3 })
      .to(
        '.overlay-top',
        { yPercent: -100, duration: 0.6, ease: 'power3.inOut' },
        'split',
      )
      .to(
        '.overlay-bottom',
        { yPercent: 100, duration: 0.6, ease: 'power3.inOut' },
        'split',
      )
      .from(
        '.content-card',
        { y: 40, autoAlpha: 0, duration: 0.5, stagger: 0.1 },
        '-=0.2',
      );

    const replay = contextSafe(() => tlRef.current?.restart());
    const btn = container.current?.querySelector('.replay-btn');
    btn?.addEventListener('click', replay);
    return () => btn?.removeEventListener('click', replay);
  }, container);

  return (
    <DemoShell
      title="로더 → 콘텐츠 공개"
      summary="마스터 타임라인이 로고·프로그레스·오버레이 이탈·콘텐츠 등장을 순서대로 제어"
    >
      <div ref={container} className="relative min-h-[80vh] overflow-hidden">
        {/* 콘텐츠 */}
        <div className="mx-auto max-w-3xl px-6 py-16">
          <button
            type="button"
            className="replay-btn mb-8 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            다시 재생
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTENT_CARDS.map((card) => (
              <div
                key={card.title}
                className="content-card rounded-2xl p-6 text-white"
                style={{ background: card.background }}
              >
                <div
                  className="mb-3 h-20 w-full rounded-lg bg-white/15"
                  aria-hidden
                />
                <h3 className="font-semibold">{card.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* 오버레이 (위/아래 반쪽) */}
        <div className="loader-overlay pointer-events-none absolute inset-0 z-20">
          <div className="overlay-top absolute inset-x-0 top-0 h-1/2 bg-neutral-900" />
          <div className="overlay-bottom absolute inset-x-0 bottom-0 h-1/2 bg-neutral-900" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="loader-logo text-2xl font-bold tracking-widest text-white">
              FLUXNOTE
            </span>
            <span className="h-1 w-48 overflow-hidden rounded-full bg-white/20">
              <span className="loader-progress block h-full w-full origin-left scale-x-0 bg-white" />
            </span>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}
