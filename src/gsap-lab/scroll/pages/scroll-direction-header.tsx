'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import {
  refreshAfterLayout,
  ScrollTrigger,
} from '@/gsap-lab/scroll/scroll-trigger-setup';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

const ROWS = Array.from({ length: 20 }, (_, i) => ({
  title: `콘텐츠 블록 ${i + 1}`,
  background: `hsl(${(i * 31) % 360} 45% 28%)`,
}));

/**
 * `/gsap-lab/scroll-direction-header` — 스크롤 방향에 따라 헤더가 숨고 나타남.
 *
 * 문서 전체에 ScrollTrigger 하나를 만들고, `onUpdate`에서 `self.direction`
 * (1=아래, -1=위)을 읽어 데모용 헤더 바를 `y`로 밀어 넣거나 뺀다.
 * 맨 위 근처에서는 항상 보이게 한다.
 */
export function ScrollDirectionHeaderPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();

    const bar = container.current?.querySelector<HTMLElement>('.dir-header');
    if (!bar) return;

    if (reduced) {
      g.set(bar, { yPercent: 0 });
      return;
    }

    let hidden = false;
    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      g.to(bar, {
        // -110%: 바 자기 높이의 110%만큼 위로 = 완전히 밖 + 그림자까지 클리어.
        // yPercent라 바 높이가 달라져도 항상 정확히 사라진다(실측 불필요).
        yPercent: next ? -110 : 0,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: true,
      });
    };

    ScrollTrigger.create({
      trigger: container.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        // 맨 위 근처거나 위로 스크롤 중이면 보이게, 아래로 스크롤 중이면 숨김.
        if (self.scroll() < 140 || self.direction === -1) {
          setHidden(false);
        } else {
          setHidden(true);
        }
      },
    });
  }, container);

  return (
    <div ref={container}>
      {/* 방향 반응 헤더 */}
      <div className="dir-header fixed left-0 right-0 top-0 z-50 flex items-center gap-3 bg-violet-600 px-6 py-4 text-base font-semibold text-white shadow-xl">
        <span className="h-3 w-3 rounded-full bg-white/90" aria-hidden />
        Fluxnote — 아래로 스크롤하면 사라지고, 위로 스크롤하면 나타납니다
      </div>

      <ScrollDemoShell
        title="스크롤 방향 헤더"
        summary="아래로 스크롤하면 헤더가 숨고, 위로 스크롤하면 다시 나타난다 (self.direction)"
        stickyHeader={false}
      >
        <section className="mx-auto max-w-2xl space-y-4 px-6 py-24">
          {ROWS.map((row) => (
            <div
              key={row.title}
              className="flex items-center gap-4 rounded-xl p-5 text-white"
              style={{ background: row.background }}
            >
              <div
                className="h-12 w-12 shrink-0 rounded-lg bg-white/20"
                aria-hidden
              />
              <span className="text-sm font-medium">{row.title}</span>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          긴 목록·아티클에서 읽기 공간을 확보하면서도 내비게이션을 한 번의 위
          스크롤로 되찾게 하는 패턴입니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
