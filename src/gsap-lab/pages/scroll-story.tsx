"use client";

import { useRef } from "react";
import { useGsapDom } from "@/hooks/use-gsap-dom";
import {
  pinnedTriggerDefaults,
  ScrollTrigger,
} from "@/gsap-lab/scroll/scroll-trigger-setup";

/** 이미지 대신 쓰는 색 블록들. 배경색을 전부 다르게 준다. */
const PARALLAX_LAYERS = [
  { label: "배경 레이어", background: "#0f172a", speed: -12 },
  { label: "중간 레이어", background: "#1e3a8a", speed: 6 },
  { label: "전경 레이어", background: "#7c3aed", speed: 20 },
];

// 배경은 어둡게 — 위에 얹는 흰 텍스트(text-white/80 본문 포함)가
// WCAG AA(4.5:1)를 넘도록. sky-700·teal-600은 흰색과 3.4~4.4:1이었다.
const FEATURE_BLOCKS = [
  { title: "실시간 협업", background: "#075985" },
  { title: "버전 히스토리", background: "#115e59" },
  { title: "AI 요약", background: "#6b21a8" },
  { title: "오프라인 우선", background: "#9a3412" },
];

/**
 * `/gsap-lab/scroll-story` — ScrollTrigger 스크롤 연동 랜딩.
 *
 * 시연 항목:
 * - 히어로 `pin` + `scrub` (스크롤로 배경 스케일·텍스트 이동)
 * - 패럴랙스 레이어별 `yPercent` 스크럽
 * - 스크롤 진행 인디케이터(상단 바 `scaleX` 스크럽 — transform이라 리플로우 없음)
 * - 기능 블록 뷰포트 진입 시 1회 재생(`toggleActions`)
 */
export function ScrollStoryPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      // 폰트·레이아웃이 자리 잡은 뒤 트리거 위치를 다시 잡는다.
      if (document.fonts?.ready) {
        void document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

      // 진행 인디케이터: 전체 문서 스크롤 진행률을 바 scaleX로.
      // width 대신 transform(scaleX)이라 매 프레임 리플로우가 없다.
      g.fromTo(
        ".progress-bar",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: container.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );

      // 기능 블록은 모션 축소와 무관하게 항상 보여야 하므로 먼저 최종 상태.
      g.set(".feature-block", { autoAlpha: 1, y: 0 });

      if (reduced) {
        // 모션 축소: 히어로·패럴랙스를 최종 상태로 고정하고 스크럽을 걸지 않는다.
        g.set(".hero-bg", { scale: 1 });
        g.set(".hero-copy", { yPercent: 0, autoAlpha: 1 });
        g.set(".parallax-layer", { yPercent: 0 });
        return;
      }

      // 히어로 핀 + 스크럽.
      const heroTl = g.timeline({
        scrollTrigger: {
          ...pinnedTriggerDefaults,
          trigger: ".hero",
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 0.6,
        },
      });
      heroTl
        .from(".hero-bg", { scale: 1.25, ease: "none" })
        .from(".hero-copy", { yPercent: 40, autoAlpha: 0, ease: "none" }, 0);

      // 패럴랙스: 레이어마다 다른 속도로 스크롤에 따라 이동.
      PARALLAX_LAYERS.forEach((_, index) => {
        g.to(`.parallax-layer[data-index="${index}"]`, {
          yPercent: PARALLAX_LAYERS[index].speed,
          ease: "none",
          scrollTrigger: {
            trigger: ".parallax",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // 기능 블록: 뷰포트 진입 시 아래에서 올라오며 등장(1회).
      g.from(".feature-block", {
        y: 48,
        autoAlpha: 0,
        stagger: { amount: 0.4 },
        scrollTrigger: {
          trigger: ".feature-grid",
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    },
    container,
  );

  return (
    <div ref={container} className="bg-neutral-950 text-neutral-100">
      {/* 스크롤 진행 인디케이터 — 바는 scaleX(왼쪽 기준)로 채워진다 */}
      <div className="fixed left-0 top-0 z-50 h-1 w-full bg-white/10">
        <div className="progress-bar h-full w-full origin-left scale-x-0 bg-white" />
      </div>

      {/* 히어로 (핀 고정) */}
      <section className="hero relative flex h-screen items-center justify-center overflow-hidden">
        <div
          className="hero-bg absolute inset-0"
          style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
          aria-hidden
        />
        <div className="hero-copy relative z-10 max-w-2xl px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Fluxnote
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
            스크롤이 이야기를 끌고 간다
          </h1>
          <p className="mt-6 text-lg text-white/80">
            아래로 스크롤하면 배경이 밀려나고, 레이어가 서로 다른 속도로
            움직이며, 진행 바가 채워집니다.
          </p>
        </div>
      </section>

      {/* 패럴랙스 구간 */}
      <section className="parallax relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden py-32">
        {PARALLAX_LAYERS.map((layer, index) => (
          <div
            key={layer.label}
            className="parallax-layer flex h-32 w-4/5 max-w-3xl items-center justify-center rounded-xl text-sm font-medium text-white/90"
            data-index={index}
            style={{ background: layer.background }}
          >
            {layer.label} (속도 {layer.speed > 0 ? "+" : ""}
            {layer.speed})
          </div>
        ))}
      </section>

      {/* 기능 그리드 */}
      <section className="feature-grid mx-auto grid max-w-5xl gap-6 px-6 py-32 sm:grid-cols-2">
        {FEATURE_BLOCKS.map((block) => (
          <article
            key={block.title}
            className="feature-block gsap-reveal rounded-2xl p-8"
            style={{ background: block.background }}
          >
            <div
              className="mb-4 h-24 w-full rounded-lg bg-white/15"
              aria-hidden
            />
            <h2 className="text-xl font-semibold">{block.title}</h2>
            <p className="mt-2 text-sm text-white/85">
              뷰포트에 들어올 때 한 번 등장합니다. 스크롤을 되돌려도 다시 재생되지
              않습니다.
            </p>
          </article>
        ))}
      </section>

      <footer className="bg-neutral-950 px-6 py-20 text-center text-sm text-neutral-400">
        Fluxnote — 스크롤 스토리 데모 · 모든 이미지 자리는 색 블록으로 대체
      </footer>
    </div>
  );
}
