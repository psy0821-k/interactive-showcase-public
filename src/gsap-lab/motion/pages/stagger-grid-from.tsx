'use client';

import { useRef, useState } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { DemoShell } from '@/gsap-lab/demo-shell';

const COLS = 8;
const ROWS = 6;
const TILE_COUNT = COLS * ROWS;

/** stagger from 옵션 선택지. */
const FROM_OPTIONS = [
  { id: 'start', label: '처음부터', from: 0 },
  { id: 'center', label: '가운데에서', from: 'center' as const },
  { id: 'edges', label: '모서리에서', from: 'edges' as const },
  { id: 'end', label: '끝에서', from: 'end' as const },
  { id: 'random', label: '무작위', from: 'random' as const },
];

/**
 * `/gsap-lab/stagger-grid-from` — stagger의 from·grid 옵션 비교.
 *
 * 같은 타일 그리드를 `stagger: { each, from, grid: [rows, cols] }`의 `from`만
 * 바꿔 재생한다. 버튼을 누르면 해당 옵션으로 다시 등장한다.
 */
export function StaggerGridFromPage() {
  const container = useRef<HTMLDivElement>(null);
  const [fromId, setFromId] = useState(FROM_OPTIONS[1].id);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      if (reduced) {
        g.set('.stg-tile', { autoAlpha: 1, scale: 1 });
        return;
      }

      const option =
        FROM_OPTIONS.find((o) => o.id === fromId) ?? FROM_OPTIONS[0];

      g.fromTo(
        '.stg-tile',
        { autoAlpha: 0, scale: 0.3 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          stagger: {
            each: 0.03,
            from: option.from,
            grid: [ROWS, COLS],
          },
        },
      );
    },
    container,
    [fromId],
  );

  return (
    <DemoShell
      title="그리드 stagger 방향"
      summary="stagger의 from(center·edges·end·random)과 grid 옵션을 바꿔가며 비교"
    >
      <div ref={container} className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {FROM_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFromId(option.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                option.id === fromId
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {Array.from({ length: TILE_COUNT }, (_, i) => (
            <div
              key={i}
              className="stg-tile aspect-square rounded-md"
              style={{ background: `hsl(${255 + (i % COLS) * 6} 60% 55%)` }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </DemoShell>
  );
}
