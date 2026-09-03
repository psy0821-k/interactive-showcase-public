'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** `import gsap from "gsap"`의 default export 타입. 헬퍼 시그니처에 쓴다. */
type Gsap = typeof gsap;

/**
 * ScrollTrigger 플러그인 등록 + 모바일 스크럽 튐 방지 설정.
 *
 * `registerPlugin`은 플러그인 테이블 등록일 뿐 부수효과가 없어 모듈 스코프에서
 * 부른다(스킬 1절). 모바일 주소창이 뷰포트 높이를 흔들어 스크럽이 튀는 것을
 * `ignoreMobileResize`로 막는다(스킬 모바일 1절).
 *
 * 이 모듈을 import 하는 것만으로 등록이 끝난다. 각 데모는
 * `import "@/gsap-lab/scroll/scroll-trigger-setup"` 한 줄로 준비를 마친다.
 */
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * 레이아웃이 안정된 뒤 트리거 위치를 다시 계산한다.
 * 웹폰트·이미지 로드가 끝나면 텍스트/블록 높이가 바뀌므로 필수(스킬 8절).
 *
 * `useGsapDom` 콜백 안에서 호출한다.
 */
export function refreshAfterLayout(): void {
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/**
 * 뷰포트 비례 스크롤 구간 길이. 모바일에서는 더 짧게 잡는다(스킬 모바일 3절).
 * 핀 섹션의 `end: "+=..."`에 함수형으로 넘긴다.
 */
export function viewportScrollLength(
  desktopFactor = 2,
  mobileFactor = 1.2,
): () => string {
  return () => {
    const factor = window.innerWidth < 768 ? mobileFactor : desktopFactor;
    return `+=${window.innerHeight * factor}`;
  };
}

/** 데스크탑/모바일 브레이크포인트 경계(px). */
export const SCROLL_BREAKPOINT = 768;

/**
 * pin을 쓰는 ScrollTrigger에 공통으로 얹는 옵션.
 *
 * - `anticipatePin: 1` — 핀이 걸리기 직전 프레임을 미리 계산해 iOS Safari의
 *   스크롤 관성과 충돌할 때 생기는 "한 프레임 튐"을 줄인다(스킬 5절).
 * - `invalidateOnRefresh: true` — 뷰포트·폰트 변경 후 함수형 값 재계산.
 * - `fastScrollEnd: true` — 빠른 스크롤로 구간을 지나칠 때 트윈을 끝 상태로
 *   즉시 스냅(값이 중간에 멈추는 것 방지).
 *
 * `scrollTrigger: { ...pinnedTriggerDefaults, trigger, start, end, pin, scrub }`
 * 형태로 펼쳐 쓴다.
 */
export const pinnedTriggerDefaults = {
  anticipatePin: 1,
  invalidateOnRefresh: true,
  fastScrollEnd: true,
} as const;

/**
 * pin/scrub 데모의 반응형 분기 헬퍼.
 *
 * `gsap.matchMedia()`로 `(min-width: 768px)` / `(max-width: 767px)`를 나눠
 * 각 콜백을 실행한다. matchMedia가 미디어 변경 시 이전 콜백의 GSAP 객체를
 * 자동 revert하므로, 창 크기를 넘나들면 애니메이션이 즉시 교체된다.
 *
 * - `desktop`: pin + scrub 등 무거운 연출.
 * - `mobile`: pin 없이 `toggleActions` 1회 재생 등 가벼운 연출. 생략하면
 *   모바일에서 아무 스크롤 연출도 걸지 않는다(콘텐츠는 CSS로 그대로 보임).
 *
 * `useGsapDom` 콜백 안에서 `gsap` 인스턴스를 넘겨 호출한다.
 */
export function withResponsiveScroll(
  gsapInstance: Gsap,
  handlers: {
    desktop: (context: gsap.Context) => void;
    mobile?: (context: gsap.Context) => void;
  },
): void {
  const mm = gsapInstance.matchMedia();
  mm.add(`(min-width: ${SCROLL_BREAKPOINT}px)`, (c) => handlers.desktop(c));
  if (handlers.mobile) {
    mm.add(`(max-width: ${SCROLL_BREAKPOINT - 1}px)`, (c) =>
      handlers.mobile!(c),
    );
  }
}

export { ScrollTrigger };
