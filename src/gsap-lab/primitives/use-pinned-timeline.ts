"use client";

import { useGsapDom } from "@/hooks/use-gsap-dom";
import {
  pinnedTriggerDefaults,
  refreshAfterLayout,
  viewportScrollLength,
} from "@/gsap-lab/scroll/scroll-trigger-setup";

/** `usePinnedTimeline` 콜백이 받는 인자. */
export interface PinnedTimelineContext {
  /** 새로 만든 스크럽 타임라인. 여기에 트윈을 add 한다. */
  tl: gsap.core.Timeline;
  /** gsap 인스턴스. */
  gsap: typeof import("gsap").default;
  /** 현재 뷰포트가 모바일(<768px)인지. */
  isMobile: boolean;
}

/** `usePinnedTimeline` 옵션. */
export interface PinnedTimelineOptions {
  /** 핀 고정 + 스크롤 구간을 정하는 트리거 셀렉터. */
  trigger: string;
  /**
   * 핀 대상. `true`(기본)면 `trigger`를 핀 고정, 문자열이면 그 셀렉터를 핀,
   * `false`면 GSAP 핀을 걸지 않는다(CSS `position: sticky`로 고정하는 경우).
   */
  pin?: boolean | string;
  /**
   * 스크롤 구간 길이. 숫자 배열 `[desktop, mobile]`이면
   * `viewportScrollLength(desktop, mobile)`, 문자열이면 그대로 `end`.
   * 기본 `[2, 1.3]`.
   */
  length?: [number, number] | string;
  /** scrub 값(초). 기본 1. */
  scrub?: number;
  /** 타임라인 `defaults`. */
  defaults?: gsap.TweenVars;
  /** 재실행 의존성. */
  deps?: readonly unknown[];
}

/**
 * 섹션을 핀 고정하고 그 구간 동안 스크럽 타임라인을 진행시키는 프리미티브.
 *
 * `pinnedTriggerDefaults`(anticipatePin·invalidateOnRefresh·fastScrollEnd)를
 * 자동으로 얹어 iOS 관성 충돌·스크롤 점프 시 값 튐을 줄인다.
 * `build` 콜백에 빈 타임라인을 넘기므로, 데모는 트윈만 add 하면 된다.
 * `reduced` 모션에서는 타임라인을 만들지 않고 `reduced` 브랜치를 콜백이
 * 직접 처리하도록 `build`를 호출하지 않는다 — 대신 `onReduced`를 준다.
 *
 * 사용처: hero-to-section, image-mask-reveal, pinned-caption-swap,
 * zoom-out-reveal, pin-progress.
 *
 * @param scope 컨테이너 ref.
 * @param options 핀 설정.
 * @param build 타임라인에 트윈을 추가하는 콜백.
 * @param onReduced 모션 축소 시 최종 상태를 세팅하는 콜백(선택).
 */
export function usePinnedTimeline(
  scope: React.RefObject<HTMLElement | null>,
  options: PinnedTimelineOptions,
  build: (ctx: PinnedTimelineContext) => void,
  onReduced?: (gsap: typeof import("gsap").default) => void,
): void {
  const {
    trigger,
    pin = true,
    length = [2, 1.3] as [number, number],
    scrub = 1,
    defaults,
    deps = [],
  } = options;

  useGsapDom(
    ({ gsap: g, reduced }) => {
      refreshAfterLayout();

      if (reduced) {
        onReduced?.(g);
        return;
      }

      const end =
        typeof length === "string"
          ? length
          : viewportScrollLength(length[0], length[1]);

      const tl = g.timeline({
        ...(defaults ? { defaults } : {}),
        scrollTrigger: {
          ...pinnedTriggerDefaults,
          trigger,
          start: "top top",
          end,
          // pin: false면 아예 넘기지 않는다(CSS sticky로 고정하는 경우).
          ...(pin === false ? {} : { pin }),
          scrub,
        },
      });

      build({ tl, gsap: g, isMobile: window.innerWidth < 768 });
    },
    scope,
    deps,
  );
}
