'use client';

import { useRef } from 'react';
import { usePointerTilt } from '@/gsap-lab/primitives';
import { DemoShell } from '@/gsap-lab/demo-shell';

const CARDS = Array.from({ length: 6 }, (_, i) => ({
  title: `제품 ${i + 1}`,
  background: `linear-gradient(135deg, hsl(${330 + i * 12} 60% 40%), hsl(${
    350 + i * 12
  } 55% 30%))`,
}));

/**
 * `/gsap-lab/tilt-card-grid` — 커서 위치에 따라 카드가 3D로 기운다.
 *
 * `pointermove`에서 커서의 카드 내 상대 위치를 -0.5~0.5로 정규화해
 * `rotateX`/`rotateY`에 매핑하고, 광택 하이라이트의 위치도 함께 옮긴다.
 * 벗어나면 원위치. 데스크탑 전용.
 */
export function TiltCardGridPage() {
  const container = useRef<HTMLDivElement>(null);

  usePointerTilt(container, {
    target: '.tilt-card',
    glare: '.tilt-glare',
    maxTilt: 18,
  });

  return (
    <DemoShell
      title="3D 틸트 카드 그리드"
      summary="커서 위치로 카드가 rotateX/rotateY 기울고 광택이 움직인다 (데스크탑 전용)"
    >
      <div
        ref={container}
        className="mx-auto grid max-w-4xl gap-8 px-6 py-16 sm:grid-cols-3"
        style={{ perspective: '1200px' }}
      >
        {CARDS.map((card) => (
          <article
            key={card.title}
            className="tilt-card relative overflow-hidden rounded-2xl p-6 text-white"
            style={{
              background: card.background,
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="mb-4 h-28 w-full rounded-lg bg-white/15"
              aria-hidden
            />
            <h3 className="text-lg font-semibold">{card.title}</h3>
            {/* 광택 */}
            <div
              className="tilt-glare pointer-events-none absolute -inset-1/2 opacity-0"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(255,255,255,0.8), transparent 60%)',
              }}
              aria-hidden
            />
          </article>
        ))}
      </div>
    </DemoShell>
  );
}
