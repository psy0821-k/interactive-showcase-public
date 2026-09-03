"use client";

import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { LandingCanvas } from "./landing-canvas";
import { LandingDomHeader } from "./landing-dom-header";
import { useLandingScroll } from "./use-landing-scroll";
import type { LandingEntry } from "./registry";

/** Scene에 넘어가는 컨텍스트. 진행률은 ref로 읽어 리렌더를 피한다. */
export interface LandingSceneContext {
  /** 스크롤 진행률(0~1)을 담은 ref. Scene의 useFrame이 매 프레임 읽는다. */
  progress: RefObject<number>;
  /** 모션 축소 여부. Scene이 등장/자전 분기에 쓴다. */
  reduced: boolean;
}

interface LandingShellProps {
  entry: LandingEntry;
  /** 3D 히어로. progress ref를 받아 useFrame에서 보간한다. */
  renderScene: (ctx: LandingSceneContext) => ReactNode;
  /** 스크롤에 따라 나타나는 본문 섹션들. */
  children: ReactNode;
}

/**
 * `/landings/{slug}` 공통 레이아웃.
 *
 * 셸(`showcase-canvas.tsx`) 밖 독립 페이지다(gsap-scrolltrigger-scene 형태 B).
 * 스크롤은 **window 스크롤**을 쓴다 — 커스텀 `overflow-y` 컨테이너 안에 R3F
 * 캔버스를 넣으면 R3F의 가시성 판정이 어긋나 스크롤 끝에서 렌더가 멈추는
 * 문제가 있어, `/gsap-lab` 랜딩과 동일하게 문서 스크롤로 통일한다.
 *
 * 구조:
 * - breadcrumb + "요구사항" 패널 (일반 문서 흐름)
 * - 스크롤 트랙(`trackRef`) 안에:
 *   - `position: sticky` 캔버스 (스크롤 내내 화면에 고정)
 *   - 그 위를 흐르는 본문 섹션(`children`)
 *
 * ScrollTrigger는 window를 scroller로 잡고 트랙 기준 진행률을 `progressRef`에
 * 쓴다. Scene은 그 ref를 `useFrame`에서 읽어 3D를 보간한다(3절 b).
 */
export function LandingShell({ entry, renderScene, children }: LandingShellProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const reduced = useLandingScroll({
    track: trackRef,
    onProgress: (p) => {
      progressRef.current = p;
    },
  });

  return (
    <main className="flex-1">
      <LandingDomHeader entry={entry} />

      {/*
        스크롤 트랙. 이 안에서 캔버스는 sticky로 화면에 고정되고,
        본문 섹션이 그 위를 흐른다. ScrollTrigger는 이 요소를 trigger로,
        window를 scroller로 잡는다.
      */}
      <div ref={trackRef} className="relative bg-neutral-950 text-neutral-50">
        {/*
          캔버스는 fixed로 뷰포트에 완전히 고정한다. sticky/pin 트릭은
          트랙 높이를 왜곡하거나 스크롤 중간에 풀리는 문제가 있었다.
          fixed면 R3F 가시성 판정도 항상 안전하다. pointer-events-none으로
          본문 위 스크롤·클릭을 방해하지 않는다.
        */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-screen">
          <LandingCanvas label={entry.tag}>
            {renderScene({ progress: progressRef, reduced })}
          </LandingCanvas>
        </div>

        {/* 스크롤에 따라 흐르는 본문. 고정된 캔버스 위를 지나간다. */}
        <div className="relative z-10">{children}</div>
      </div>

      <footer className="bg-neutral-950 px-6 py-16 text-center text-sm text-neutral-400">
        Landings · Fluxnote(가상 SaaS) 소재 · 이미지 자리는 색 블록으로 대체
      </footer>
    </main>
  );
}

/**
 * 스크롤 섹션 하나. 한 화면 높이 여백 뒤에 콘텐츠를 놓아
 * 스크롤 트랙 길이를 만든다.
 */
export function LandingSection({
  children,
  align = "start",
}: {
  children: ReactNode;
  /** 콘텐츠 가로 정렬. */
  align?: "start" | "center" | "end";
}) {
  const justify =
    align === "center"
      ? "items-center text-center"
      : align === "end"
        ? "items-end text-right"
        : "items-start text-left";
  return (
    <section
      className={`flex min-h-screen flex-col justify-center gap-4 px-6 py-24 ${justify}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

/**
 * 3D 캔버스 위에 겹쳐 읽히는 텍스트 카드.
 * 반투명 어두운 배경 + blur로 뒤 3D와 대비를 확보한다.
 */
export function LandingCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-neutral-950/75 p-8 shadow-xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
