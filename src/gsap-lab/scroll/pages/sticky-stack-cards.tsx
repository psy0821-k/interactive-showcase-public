'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { refreshAfterLayout } from '@/gsap-lab/scroll/scroll-trigger-setup';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

const CARDS = [
  {
    title: '캡처',
    body: '어디서든 단축키로 노트를 띄운다.',
    background: '#431407',
  },
  {
    title: '정리',
    body: '태그와 백링크로 노트가 스스로 연결된다.',
    background: '#7c2d12',
  },
  {
    title: '협업',
    body: '실시간으로 함께 편집하고 댓글을 남긴다.',
    background: '#8a3213',
  },
  {
    title: '게시',
    body: '링크 하나로 노트를 웹 페이지로 공개한다.',
    background: '#9a3a17',
  },
];

/**
 * `/gsap-lab/sticky-stack-cards` — 카드가 화면 중앙에 쌓이며 넘어간다.
 *
 * CSS `position: sticky`로 각 카드를 화면 중앙에 붙이고(스킬 5절: 단순 고정은
 * pin보다 sticky), GSAP는 스크롤 진행에 따라 이전 카드를 살짝 축소·회전시켜
 * "아래에 깔리는" 느낌만 더한다.
 */
export function StickyStackCardsPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();

    if (reduced) return; // sticky만으로 충분. 추가 트윈 생략.

    const cards =
      container.current?.querySelectorAll<HTMLElement>('.stack-card');
    if (!cards) return;

    cards.forEach((card, index) => {
      if (index === cards.length - 1) return;
      // 다음 카드가 올라오는 동안 이 카드가 살짝 뒤로 물러난다(축소만).
      g.to(card, {
        scale: 0.94,
        ease: 'none',
        scrollTrigger: {
          trigger: cards[index + 1],
          start: 'top 80%',
          end: 'top 30%',
          scrub: true,
        },
      });
    });
  }, container);

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="스티키 스택 카드"
        summary="카드가 화면 중앙에 차례로 고정되며 쌓인다 (CSS sticky + 스크럽 보정)"
      >
        <section className="mx-auto max-w-2xl px-6 py-24">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              className="stack-card sticky top-24 mb-8 rounded-3xl p-10 text-white shadow-2xl"
              style={{
                background: card.background,
                // 뒤 카드일수록 살짝 아래에서 시작해 겹침이 보이게.
                zIndex: index + 1,
              }}
            >
              <div
                className="mb-6 h-32 w-full rounded-xl bg-white/15"
                aria-hidden
              />
              <h3 className="text-2xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-white/90">{card.body}</p>
            </div>
          ))}
          {/* 마지막 카드가 풀릴 여백 */}
          <div className="h-[70vh]" />
        </section>
      </ScrollDemoShell>
    </div>
  );
}
