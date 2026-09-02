"use client";

import { useRef } from "react";
import { usePinnedTimeline } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

/**
 * `/gsap-lab/image-mask-reveal` — clip-path로 이미지 블록이 펼쳐진다.
 *
 * `usePinnedTimeline` — 핀 + 스크럽 타임라인. 좁은 띠(`inset(45%)`)에서
 * `inset(0%)`로 확장. `clip-path`는 컴포지팅 단계 처리라 리플로우 없음.
 */
export function ImageMaskRevealPage() {
  const container = useRef<HTMLDivElement>(null);

  usePinnedTimeline(
    container,
    { trigger: ".mask-stage", length: [1.8, 1.1] },
    ({ tl }) => {
      tl.fromTo(
        ".mask-image",
        { clipPath: "inset(45% 10% round 1rem)" },
        { clipPath: "inset(0% 0% round 0rem)", ease: "none" },
      ).from(".mask-caption", { autoAlpha: 0, y: 20, ease: "none" }, ">-0.3");
    },
    (g) => {
      g.set(".mask-image", { clipPath: "inset(0% 0%)" });
      g.set(".mask-caption", { autoAlpha: 1 });
    },
  );

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="이미지 마스크 공개"
        summary="좁은 띠였던 이미지가 clip-path로 확장되며 화면을 채운다 (핀 + 스크럽)"
      >
        <section className="mask-stage relative flex min-h-screen items-center justify-center overflow-hidden">
          <div
            className="mask-image absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #4a044e, #c026d3 55%, #f0abfc)",
              clipPath: "inset(45% 10% round 1rem)",
            }}
            aria-hidden
          />
          <p className="mask-caption relative z-10 max-w-md px-6 text-center text-2xl font-semibold text-white">
            스크롤하면 이 영역이 열립니다
          </p>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          되감으면 다시 좁은 띠로 닫힙니다. 실제 서비스에서는 배경 div 대신
          제품 스크린샷·영상을 넣습니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
