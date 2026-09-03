"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// ScrollTrigger 등록은 모듈 스코프 1회 (gsap-scrolltrigger-scene 0절).
gsap.registerPlugin(ScrollTrigger);

/** 진행률(0~1)을 받는 콜백. useFrame에서 읽을 ref에 쓰는 용도. */
type ProgressSink = (progress: number) => void;

interface UseLandingScrollOptions {
  /** 스크롤 트랙(sticky 캔버스를 감싼, 높이가 스크롤 길이를 만드는 요소). */
  track: RefObject<HTMLElement | null>;
  /** 진행률이 갱신될 때마다 호출된다. */
  onProgress: ProgressSink;
}

/**
 * `/landings/*` 전용 스크롤 진행률 훅.
 *
 * 이 라우트는 셸(`showcase-canvas.tsx`) 밖 독립 페이지이고, R3F 캔버스를
 * 커스텀 스크롤 컨테이너에 넣으면 가시성 판정이 어긋나므로 **window 스크롤**을
 * 쓴다(gsap-scrolltrigger-scene 형태 B, `/gsap-lab` 랜딩과 동일).
 *
 * - `onUpdate`로 진행률만 넘기고 실제 3D 보간은 각 Scene의 `useFrame`이 한다
 *   (3절 (b) — 이 프로젝트의 다른 씬과 코드 스타일 일치).
 * - `prefers-reduced-motion`이면 ScrollTrigger를 만들지 않고 진행률 0으로
 *   고정한다. DOM 콘텐츠는 그대로 스크롤로 읽을 수 있다(8절).
 * - 폰트 로드 후 `ScrollTrigger.refresh()`로 start/end를 재계산한다(6절).
 *
 * @returns 현재 모션 축소 여부. Scene이 등장 애니메이션 분기에 쓴다.
 */
export function useLandingScroll({
  track,
  onProgress,
}: UseLandingScrollOptions): boolean {
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) {
        onProgress(0);
        return;
      }

      const trackEl = track.current;
      if (!trackEl) return;

      const trigger = ScrollTrigger.create({
        trigger: trackEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => onProgress(self.progress),
      });

      // 폰트 로드로 레이아웃이 밀리면 start/end가 어긋난다(6절).
      void document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => trigger.kill();
    },
    { dependencies: [reduced], revertOnUpdate: true },
  );

  return reduced;
}
