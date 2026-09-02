"use client";

import { useRef } from "react";
import { useCountUp } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

const STATS = [
  { label: "활성 팀", value: 12_400, suffix: "+", background: "#14532d" },
  { label: "생성된 노트", value: 3_200_000, suffix: "", background: "#166534" },
  { label: "가동률", value: 99.98, suffix: "%", decimals: 2, background: "#15803d" },
  { label: "지원 언어", value: 27, suffix: "", background: "#16a34a" },
];

/**
 * `/gsap-lab/counter-on-scroll` — 지표가 뷰포트 진입 시 0에서 목표값까지 증가.
 *
 * `useCountUp` — 프록시 트윈 + `textContent` 갱신. 한 번만 재생.
 */
export function CounterOnScrollPage() {
  const container = useRef<HTMLDivElement>(null);

  useCountUp(container, {
    target: ".stat-value",
    trigger: ".stat-grid",
    targets: STATS.map((s) => ({ value: s.value, decimals: s.decimals })),
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="숫자 카운트업"
        summary="통계 섹션이 보이면 0에서 목표값까지 숫자가 증가한다 (프록시 트윈 + textContent)"
      >
        <section className="stat-grid mx-auto grid max-w-4xl gap-6 px-6 py-40 sm:grid-cols-2">
          {STATS.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl p-8 text-white"
              style={{ background: stat.background }}
            >
              <div className="mb-4 h-16 w-16 rounded-lg bg-white/15" aria-hidden />
              <p className="text-4xl font-bold tabular-nums">
                <span className="stat-value">0</span>
                {stat.suffix}
              </p>
              <p className="mt-1 text-sm text-white/75">{stat.label}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-32 text-center text-white/60">
          숫자는 한 번만 증가하고, 위로 되돌아가도 다시 재생되지 않습니다.
          <code className="ml-1 rounded bg-white/10 px-1">
            toggleActions: play none none none
          </code>
        </section>
      </ScrollDemoShell>
    </div>
  );
}
