'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { DemoShell } from '@/gsap-lab/demo-shell';

const ITEMS = Array.from({ length: 6 }, (_, i) => ({
  title: `카드 ${i + 1}`,
  // 명도 32% — 위에 얹는 흰 텍스트가 WCAG AA(4.5:1)를 넘도록.
  background: `hsl(${190 + i * 12} 55% 32%)`,
}));

/**
 * `/gsap-lab/responsive-motion-switch` — 화면 크기별 다른 애니메이션.
 *
 * `gsap.matchMedia()`로 브레이크포인트를 나눈다.
 * - 데스크탑(≥768px): 좌우 번갈아 슬라이드 + 회전
 * - 모바일(<768px): 가벼운 페이드업만
 * 창 크기를 바꾸면 matchMedia가 이전 애니메이션을 revert하고 다시 적용한다.
 * 무한 반복(`repeat: -1, yoyo`)이라 크기만 바꿔도 차이가 바로 보인다.
 */
export function ResponsiveMotionSwitchPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    if (reduced) {
      g.set('.rm-card', { x: 0, rotate: 0, autoAlpha: 1, y: 0 });
      return;
    }

    const mm = g.matchMedia();

    mm.add('(min-width: 768px)', () => {
      g.fromTo(
        '.rm-card',
        {
          x: (i) => (i % 2 === 0 ? -60 : 60),
          rotate: (i) => (i % 2 === 0 ? -6 : 6),
        },
        {
          x: (i) => (i % 2 === 0 ? 60 : -60),
          rotate: (i) => (i % 2 === 0 ? 6 : -6),
          duration: 1.6,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.15, from: 'center' },
        },
      );
    });

    mm.add('(max-width: 767px)', () => {
      g.fromTo(
        '.rm-card',
        { y: 16, autoAlpha: 0.4 },
        {
          y: -16,
          autoAlpha: 1,
          duration: 1.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          stagger: 0.1,
        },
      );
    });
  }, container);

  return (
    <DemoShell
      title="반응형 모션 분기"
      summary="gsap.matchMedia() — 데스크탑은 좌우 슬라이드+회전, 모바일은 페이드업. 창 크기를 바꿔 보세요"
    >
      <div ref={container} className="mx-auto max-w-2xl px-6 py-20">
        <p className="mb-8 text-sm text-white/60">
          브라우저 창을 768px 경계로 넓혔다 좁혔다 하면 애니메이션이 즉시
          바뀝니다.
        </p>
        <div className="space-y-4">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="rm-card flex items-center gap-4 rounded-2xl p-6 text-white"
              style={{ background: item.background }}
            >
              <div
                className="h-12 w-12 shrink-0 rounded-lg bg-white/20"
                aria-hidden
              />
              <span className="font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </DemoShell>
  );
}
