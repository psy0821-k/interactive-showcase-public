"use client";

import { useGsapDom } from "@/hooks/use-gsap-dom";
import { refreshAfterLayout } from "@/gsap-lab/scroll/scroll-trigger-setup";

/** `useRevealOnScroll` 옵션. */
export interface RevealOnScrollOptions {
  /** 등장할 요소 셀렉터 (scope 안에서 한정). */
  target: string;
  /** 트리거 요소 셀렉터. 생략하면 `target`. */
  trigger?: string;
  /** 시작 위치 (ScrollTrigger `start`). 기본 `"top 75%"`. */
  start?: string;
  /** 등장 전 상태(= `from` 값). 기본 `{ autoAlpha: 0, y: 48 }`. */
  from?: gsap.TweenVars;
  /** 트윈 길이(초). 기본 0.6. */
  duration?: number;
  /** 이징. 기본 `"power3.out"`. */
  ease?: string;
  /**
   * stagger. 숫자(항목당 지연) 또는 GSAP stagger 객체.
   * 생략하면 stagger 없음(동시 등장).
   */
  stagger?: number | gsap.StaggerVars;
  /**
   * `true`(기본)면 위로 벗어날 때 되돌린다(`"play none none reverse"`).
   * `false`면 한 번만 재생(`"play none none none"`) — 카운트업 등.
   */
  reversible?: boolean;
  /** 재실행 의존성. 값이 바뀌면 revert 후 다시 만든다. */
  deps?: readonly unknown[];
}

/**
 * 뷰포트 진입 시 요소를 `from` 상태에서 등장시키는 프리미티브.
 *
 * `gsap.from()` + ScrollTrigger `toggleActions` 조합을 캡슐화한다.
 * `useGSAP`가 `useLayoutEffect`라 `from`의 시작 상태가 페인트 전에 적용돼
 * FOUC가 없다. `reduced` 모션에서는 트윈을 만들지 않는다(요소는 CSS 기본
 * 상태 = 보이는 상태여야 한다 — `.gsap-reveal` 클래스를 붙이지 않는다).
 *
 * 사용처: reveal-sequence, reveal-together, line-mask-text, chart-bar-grow,
 * signature-draw, icon-line-trace.
 *
 * @param scope 셀렉터를 한정할 컨테이너 ref.
 * @param options 등장 설정.
 */
export function useRevealOnScroll(
  scope: React.RefObject<HTMLElement | null>,
  options: RevealOnScrollOptions,
): void {
  const {
    target,
    trigger,
    start = "top 75%",
    from = { autoAlpha: 0, y: 48 },
    duration = 0.6,
    ease = "power3.out",
    stagger,
    reversible = true,
    deps = [],
  } = options;

  useGsapDom(
    ({ gsap: g, reduced }) => {
      refreshAfterLayout();
      if (reduced) return;

      g.from(target, {
        ...from,
        duration,
        ease,
        ...(stagger !== undefined ? { stagger } : {}),
        scrollTrigger: {
          trigger: trigger ?? target,
          start,
          toggleActions: reversible
            ? "play none none reverse"
            : "play none none none",
        },
      });
    },
    scope,
    deps,
  );
}
