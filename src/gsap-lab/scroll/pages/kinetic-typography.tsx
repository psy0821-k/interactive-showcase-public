'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { refreshAfterLayout } from '@/gsap-lab/scroll/scroll-trigger-setup';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

const HEADLINE = 'SCROLL SHAPES WORDS';

/** 제목을 글자 <span>으로 쪼갠다. 공백은 pre로 보존(스킬 core 6절). */
function SplitWords({ text }: { text: string }) {
  return (
    <h2
      className="kinetic-heading text-[12vw] font-black leading-none tracking-tight"
      aria-label={text}
    >
      {text.split('').map((ch, index) => (
        <span
          key={`${ch}-${index}`}
          aria-hidden
          className="char inline-block"
          style={{ whiteSpace: 'pre' }}
        >
          {ch}
        </span>
      ))}
    </h2>
  );
}

/**
 * `/gsap-lab/kinetic-typography` — 스크롤로 글자가 변형된다.
 *
 * - 제목 전체: `scale`·`xPercent` 스크럽 (transform이라 리플로우 없음)
 * - 글자 단위: 각 `.char`가 스크롤 진행에 따라 흩어졌다 모인다
 *   (`letterSpacing` 대신 per-char `x`/`rotation`)
 */
export function KineticTypographyPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();

    if (reduced) {
      g.set(['.kinetic-heading', '.char'], {
        scale: 1,
        xPercent: 0,
        x: 0,
        rotation: 0,
      });
      return;
    }

    // 제목 전체 스케일·이동
    g.fromTo(
      '.kinetic-heading',
      { scale: 0.7, xPercent: 8 },
      {
        scale: 1.05,
        xPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.kinetic-stage',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      },
    );

    // 글자 단위 — 가운데에서 멀수록 더 크게 흩어졌다 모인다.
    const chars = container.current?.querySelectorAll<HTMLElement>('.char');
    if (chars) {
      const mid = (chars.length - 1) / 2;
      chars.forEach((char, index) => {
        const offset = index - mid;
        g.fromTo(
          char,
          { x: offset * 24, y: Math.abs(offset) * 10, rotation: offset * 6 },
          {
            x: 0,
            y: 0,
            rotation: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '.kinetic-stage',
              start: 'top center',
              end: 'center center',
              scrub: 1,
            },
          },
        );
      });
    }
  }, container);

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="키네틱 타이포"
        summary="스크롤에 따라 제목의 크기·위치가 변하고 글자가 흩어졌다 모인다 (scrub)"
      >
        <section className="kinetic-stage flex min-h-[180vh] items-center justify-center overflow-hidden px-6">
          <div className="text-center text-white">
            <SplitWords text={HEADLINE} />
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          제목 전체는 스크롤 구간 내내 스케일·좌우 이동합니다. 글자는 섹션이
          중앙에 올 때까지 제자리로 모입니다. transform만 사용해 리플로우가
          없습니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
