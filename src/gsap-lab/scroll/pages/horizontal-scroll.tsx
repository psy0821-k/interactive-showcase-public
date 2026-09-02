"use client";

import { useRef } from "react";
import { useGsapDom } from "@/hooks/use-gsap-dom";
import {
  pinnedTriggerDefaults,
  refreshAfterLayout,
} from "@/gsap-lab/scroll/scroll-trigger-setup";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

const PANELS = [
  { title: "01 · 캡처", background: "#500724" },
  { title: "02 · 정리", background: "#831843" },
  { title: "03 · 연결", background: "#9d174d" },
  { title: "04 · 공유", background: "#be185d" },
  { title: "05 · 게시", background: "#db2777" },
];

/**
 * `/gsap-lab/horizontal-scroll` — 세로 스크롤을 가로 트랙 이동으로.
 *
 * 섹션을 `pin` 고정하고, 세로 스크롤 진행에 맞춰 가로 트랙을
 * `xPercent`로 이동시킨다. `end`는 트랙 폭에 비례.
 */
export function HorizontalScrollPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      refreshAfterLayout();

      const track = container.current?.querySelector<HTMLElement>(".h-track");
      if (!track) return;

      if (reduced) {
        // 모션 축소: 가로 트랙을 세로로 쌓아 그냥 스크롤되게 한다.
        track.classList.remove("flex-row");
        track.classList.add("flex-col");
        g.set(track, { xPercent: 0 });
        return;
      }

      // 트랙이 뷰포트보다 넘치는 만큼(픽셀)이 곧 스크롤 구간이자 이동량이다.
      // refresh 때 다시 재므로 함수형으로.
      g.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          ...pinnedTriggerDefaults,
          trigger: ".h-stage",
          start: "top top",
          end: () => "+=" + (track.scrollWidth - window.innerWidth),
          pin: true,
          scrub: 1,
        },
      });
    },
    container,
  );

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="가로 스크롤"
        summary="세로 스크롤 입력이 가로 트랙 이동으로 바뀐다 (pin + xPercent 스크럽)"
      >
        <section className="h-stage relative h-screen overflow-hidden">
          <div className="h-track flex flex-row items-center gap-8 px-[8vw] h-full w-max">
            {PANELS.map((panel) => (
              <article
                key={panel.title}
                className="flex h-[60vh] w-[70vw] shrink-0 flex-col justify-end rounded-3xl p-10 text-white sm:w-[45vw]"
                style={{ background: panel.background }}
              >
                <div
                  className="mb-6 h-32 w-full rounded-xl bg-white/15"
                  aria-hidden
                />
                <h3 className="text-2xl font-semibold">{panel.title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          섹션이 고정된 동안 세로로 스크롤한 만큼 트랙이 왼쪽으로 이동합니다.
          트랙을 다 지나면 고정이 풀리고 아래로 계속 스크롤됩니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
