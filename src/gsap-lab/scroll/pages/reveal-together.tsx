"use client";

import { useRef } from "react";
import { useRevealOnScroll } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

const BLOCKS = [
  { title: "지표 A", background: "#422006" },
  { title: "지표 B", background: "#713f12" },
  { title: "지표 C", background: "#854d0e" },
  { title: "지표 D", background: "#a16207" },
  { title: "지표 E", background: "#ca8a04" },
  { title: "지표 F", background: "#eab308" },
];

/**
 * `/gsap-lab/reveal-together` — 콘텐츠가 한꺼번에 올라온다.
 *
 * `stagger` 없이 하나의 트윈이 여러 요소를 동시에 움직인다. 순차 등장과의
 * 유일한 차이는 `stagger` 유무. 강조·임팩트를 줄 때 쓴다.
 */
export function RevealTogetherPage() {
  const container = useRef<HTMLDivElement>(null);

  // stagger를 주지 않으면 모든 요소가 동시에 등장한다.
  useRevealOnScroll(container, {
    target: ".together-block",
    trigger: ".together-grid",
    from: { autoAlpha: 0, y: 40 },
    duration: 0.7,
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="동시 등장"
        summary="섹션 진입 순간 모든 콘텐츠가 함께 페이드업 (stagger 없음)"
      >
        <section className="together-grid mx-auto grid max-w-4xl gap-6 px-6 py-32 sm:grid-cols-3">
          {BLOCKS.map((block) => (
            <article
              key={block.title}
              className="together-block rounded-2xl p-6 text-white"
              style={{ background: block.background }}
            >
              <div className="mb-3 h-20 w-full rounded-lg bg-white/15" aria-hidden />
              <h3 className="text-base font-semibold">{block.title}</h3>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          모든 블록이 같은 순간에 같은 속도로 올라옵니다. 정보 우선순위가 같은
          그리드(지표 대시보드 등)에 어울립니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
