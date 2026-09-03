'use client';

import { useRef } from 'react';
import { useMagnetic } from '@/gsap-lab/primitives';
import { DemoShell } from '@/gsap-lab/demo-shell';

const NAV_ITEMS = ['제품', '요금', '고객사례', '블로그', '문의하기'];

/**
 * `/gsap-lab/magnetic-nav` — 내비 항목이 커서에 끌린다.
 *
 * `useMagnetic` — 항목마다 `quickTo` 트윈 재사용, `elastic` 복귀,
 * 데스크탑 전용(`matchMedia`).
 */
export function MagneticNavPage() {
  const container = useRef<HTMLDivElement>(null);

  useMagnetic(container, { target: '.mag-item', range: 70, strength: 0.5 });

  return (
    <DemoShell
      title="마그네틱 내비게이션"
      summary="메뉴 항목이 커서에 끌렸다가 elastic으로 복귀 (quickTo · 데스크탑 전용)"
    >
      <div
        ref={container}
        className="flex min-h-[70vh] flex-col items-center justify-center gap-10 px-6"
      >
        <nav className="flex flex-wrap items-center justify-center gap-8">
          {NAV_ITEMS.map((label) => (
            <button
              key={label}
              type="button"
              className="mag-item rounded-full px-5 py-3 text-lg font-semibold text-white/90 hover:text-white"
              style={{ background: 'rgb(79 70 229 / 0.25)' }}
            >
              {label}
            </button>
          ))}
        </nav>
        <p className="text-sm text-white/50">
          각 항목 근처로 마우스를 가져가 보세요. 터치 기기에서는 비활성입니다.
        </p>
      </div>
    </DemoShell>
  );
}
