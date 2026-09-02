"use client";

import { useRef } from "react";
import { usePinnedTimeline } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

const STEPS = [
  { caption: "노트를 적으면", visual: "#7c2d12" },
  { caption: "AI가 관련 노트를 찾아", visual: "#9a3412" },
  { caption: "자동으로 연결하고", visual: "#c2410c" },
  { caption: "팀 지식으로 쌓입니다", visual: "#ea580c" },
];

/**
 * `/gsap-lab/pinned-caption-swap` — 고정된 비주얼, 바뀌는 설명.
 *
 * 왼쪽 비주얼 패널이 `pin`으로 고정된 채, 스크롤 진행에 따라 오른쪽 캡션이
 * 단계별로 교체되고 비주얼 색도 함께 전환된다. 하나의 스크럽 타임라인.
 */
export function PinnedCaptionSwapPage() {
  const container = useRef<HTMLDivElement>(null);

  usePinnedTimeline(
    container,
    { trigger: ".pcs-stage", pin: ".pcs-pin", length: [2.6, 1.6] },
    ({ tl }) => {
      STEPS.forEach((step, index) => {
        const at = index / STEPS.length;
        tl.to(".pcs-visual", { backgroundColor: step.visual, duration: 0.2 }, at);
        tl.to(
          `.caption-step[data-index="${index}"]`,
          { autoAlpha: 1, x: 0, duration: 0.2 },
          at,
        );
        if (index > 0) {
          tl.to(
            `.caption-step[data-index="${index - 1}"]`,
            { autoAlpha: 0.2, x: -10, duration: 0.2 },
            at,
          );
        }
      });
    },
    (g) => {
      // 모션 축소: 캡션을 세로로 나열해 읽히게 한다.
      g.set(".caption-step", { position: "relative", autoAlpha: 1, x: 0 });
    },
  );

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="핀 + 캡션 전환"
        summary="왼쪽 비주얼이 고정된 채 오른쪽 설명이 단계별로 교체된다 (pin + 스크럽 타임라인)"
      >
        <section className="pcs-stage relative h-[320vh]">
          <div className="pcs-pin flex h-screen items-center">
            <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 sm:grid-cols-2">
              {/* 고정 비주얼 */}
              <div
                className="pcs-visual flex aspect-square items-center justify-center rounded-3xl"
                style={{ background: STEPS[0].visual }}
              >
                <div className="h-2/3 w-2/3 rounded-2xl bg-white/15" aria-hidden />
              </div>

              {/* 바뀌는 캡션 (겹쳐 쌓임) */}
              <div className="relative flex items-center">
                {STEPS.map((step, index) => (
                  <p
                    key={index}
                    data-index={index}
                    className="caption-step absolute text-3xl font-semibold leading-snug text-white sm:text-4xl"
                    style={{ opacity: index === 0 ? 1 : 0 }}
                  >
                    {step.caption}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          비주얼은 스크롤 내내 화면에 고정되고, 스크롤 진행이 곧 설명 단계입니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
