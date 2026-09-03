"use client";

import { useRef } from "react";
import { useGsapDom } from "@/hooks/use-gsap-dom";
import { useMagnetic, usePointerTilt } from "@/gsap-lab/primitives";

// 배경은 전부 어두운 채도로 통일한다 — 위에 얹는 흰 텍스트가 WCAG AA(4.5:1)를
// 넘도록. 밝은 끝(amber-700·lime-700 등)은 text-sm 흰색과 대비가 부족했다.
const TILT_CARDS = [
  { title: "캡처", background: "#7f1d1d" },
  { title: "정리", background: "#7c2d12" },
  { title: "연결", background: "#854d0e" },
  { title: "공유", background: "#3f6212" },
  { title: "검색", background: "#155e75" },
  { title: "자동화", background: "#5b21b6" },
];

/**
 * `/landings/pointer-play` — 포인터 인터랙션 랜딩.
 *
 * 세 가지를 조합한다.
 * - 마그네틱 CTA 버튼 → `useMagnetic`
 * - 호버 틸트 그리드 → `usePointerTilt`
 * - 커스텀 커서 팔로워 → 이 데모 고유(window 레벨 pointermove) → 인라인
 *
 * breadcrumb·caveat·프롬프트 패널은 `landings/[slug]/page.tsx`가
 * `LandingDomHeader`로 씌운다. 이 컴포넌트는 콘텐츠만 렌더한다.
 */
export function PointerPlayLandingPage() {
  const container = useRef<HTMLDivElement>(null);

  useMagnetic(container, {
    target: ".magnet-cta",
    range: 90,
    strength: 0.4,
  });

  usePointerTilt(container, {
    target: ".tilt-card",
    maxTilt: 16,
    hoverScale: 1.06,
  });

  // 커스텀 커서 팔로워 — 화면 전체를 추적하므로 프리미티브로 빼지 않는다.
  useGsapDom(
    ({ gsap: g, reduced }) => {
      const cursor = container.current?.querySelector<HTMLElement>(".cursor-dot");
      if (!cursor) return;

      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (!mq.matches || reduced) {
        g.set(cursor, { autoAlpha: 0 });
        return;
      }

      g.set(cursor, { autoAlpha: 1, xPercent: -50, yPercent: -50 });
      const moveX = g.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
      const moveY = g.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
      const onMove = (e: PointerEvent) => {
        moveX(e.clientX);
        moveY(e.clientY);
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    },
    container,
  );

  return (
    <div
      ref={container}
      className="relative min-h-screen bg-neutral-950 text-neutral-100"
      style={{ perspective: "1000px" }}
    >
      {/* 커스텀 커서 (데스크탑에서만 표시) */}
      <div
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-50 h-6 w-6 rounded-full bg-white mix-blend-difference"
        style={{ opacity: 0 }}
        aria-hidden
      />

      {/* 히어로 */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">
          Fluxnote
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          커서에 반응하는 인터페이스
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/85">
          마우스를 움직여 보세요. 버튼이 커서에 끌려오고, 카드가 기울고, 흰 점이
          부드럽게 따라옵니다.
        </p>
        <button
          type="button"
          className="magnet-cta mt-10 rounded-full bg-white px-8 py-4 text-base font-semibold text-neutral-900"
        >
          14일 무료로 시작하기
        </button>
      </section>

      {/* 틸트 그리드 */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-32 sm:grid-cols-3">
        {TILT_CARDS.map((card) => (
          <article
            key={card.title}
            className="tilt-card rounded-2xl p-6 text-white"
            style={{ background: card.background, transformStyle: "preserve-3d" }}
          >
            <div className="mb-4 h-28 w-full rounded-lg bg-white/15" aria-hidden />
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-white/85">
              호버하면 커서 위치에 따라 3D로 기울어집니다.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
