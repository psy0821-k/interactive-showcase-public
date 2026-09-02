"use client";

import { useRef } from "react";
import { useRevealOnScroll } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

const CARDS = [
  { title: "빠른 캡처", background: "#052e16" },
  { title: "자동 정리", background: "#064e3b" },
  { title: "팀 공유", background: "#065f46" },
  { title: "버전 관리", background: "#047857" },
  { title: "오프라인", background: "#059669" },
  { title: "API", background: "#10b981" },
];

/**
 * `/gsap-lab/reveal-sequence` — 콘텐츠가 하나씩 시간차로 올라온다.
 *
 * `useRevealOnScroll` + `stagger`. 아래 `reveal-together`와 유일한 차이는
 * `stagger` 유무.
 */
export function RevealSequencePage() {
  const container = useRef<HTMLDivElement>(null);

  useRevealOnScroll(container, {
    target: ".seq-card",
    trigger: ".seq-grid",
    stagger: 0.15,
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="순차 등장"
        summary="카드가 아래에서 하나씩 시간차로 올라온다 (stagger + toggleActions)"
      >
        <section className="seq-grid mx-auto grid max-w-4xl gap-6 px-6 py-32 sm:grid-cols-2">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="seq-card rounded-2xl p-8 text-white"
              style={{ background: card.background }}
            >
              <div className="mb-4 h-24 w-full rounded-lg bg-white/15" aria-hidden />
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm text-white/75">
                앞 카드가 올라온 뒤 0.15초 간격으로 따라 올라옵니다.
              </p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          위로 다시 스크롤하면 카드들이 역순으로 사라집니다. 아래{" "}
          <code className="rounded bg-white/10 px-1">동시 등장</code> 데모와
          비교해 보세요.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
