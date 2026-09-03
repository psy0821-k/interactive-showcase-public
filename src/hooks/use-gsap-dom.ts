'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * GSAP 인스턴스·카운터를 `window.__gsapLab`에 노출한다.
 * E2E(누수·트리거 예산) 검증용.
 *
 * - 개발 환경(`bun dev`)에서는 항상 노출된다.
 * - 프로덕션 빌드에서는 기본적으로 노출되지 않고 트리 셰이킹으로 제거된다.
 *   단, `NEXT_PUBLIC_E2E === "1"`로 빌드하면(= Playwright webServer) 노출된다.
 *   실제 배포에는 이 환경변수가 없으므로 프로덕션 번들에는 그대로 빠진다.
 */
function exposeDebugHandle(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_E2E !== '1'
  ) {
    return;
  }
  if (typeof window === 'undefined') return;
  const w = window as unknown as {
    __gsapLab?: {
      liveTweenCount: () => number;
      scrollTriggers: () => number;
    };
  };
  w.__gsapLab ??= {
    liveTweenCount: () =>
      gsap.globalTimeline.getChildren(true, true, false).length,
    scrollTriggers: () => ScrollTrigger.getAll().length,
  };
}

/** useGsapDom 콜백이 받는 컨텍스트. */
export interface GsapDomContext {
  /** 전역 gsap 인스턴스. */
  gsap: typeof gsap;
  /**
   * 모션 축소 설정이 켜져 있으면 true.
   * 이때 트윈 대신 `gsap.set`으로 최종 상태만 찍는다.
   */
  reduced: boolean;
  /**
   * 이벤트 핸들러 안에서 만드는 트윈·리스너를 감쌀 때 쓴다.
   * `useGSAP`의 contextSafe로, 감싼 함수 안의 GSAP 객체도 언마운트 시 정리된다.
   */
  contextSafe: <T extends (...args: never[]) => unknown>(fn: T) => T;
}

/**
 * DOM 요소에 GSAP를 얹는 이 프로젝트의 공통 훅. (`gsap-dom-motion` 기반)
 *
 * `use-gsap-scene`이 R3F 캔버스용(`useThree`·`invalidate` 의존)이라면,
 * 이 훅은 순수 DOM 랜딩페이지(`/gsap-lab`)용이다. 렌더 루프가 없으므로
 * `invalidate`를 걸지 않고, GSAP `ticker`가 CSS를 직접 바꾼다.
 *
 * - `scope`로 셀렉터 문자열을 컨테이너 안으로 한정한다.
 * - `reduced` 플래그를 콜백에 넘겨 모션 축소 분기를 만들게 한다.
 * - `reduced` 또는 `deps` 변경 시 **이전 GSAP 객체·ScrollTrigger를 revert하고**
 *   콜백을 다시 실행한다(`revertOnUpdate: true`). state 의존 데모(탭 전환 등)에서
 *   이전 트윈·트리거가 쌓여 누수되는 것을 막는다.
 *
 * `revertOnUpdate: true`이면 `@gsap/react`가 매 재실행 전 `context.revert()`를
 * 부르므로 StrictMode 이중 마운트에서도 정리가 멱등이다. 이 훅은 자체 컨텍스트를
 * 만들지 않고 `useGSAP`가 관리하는 컨텍스트만 쓴다.
 *
 * @param setup GSAP 객체를 만드는 콜백. 여기서 만든 트윈·트리거는 재실행/언마운트 시 자동 정리.
 * @param scope 셀렉터를 한정할 컨테이너 ref.
 * @param deps 추가 의존성. 값이 바뀌면 revert 후 재실행.
 */
export function useGsapDom(
  setup: (ctx: GsapDomContext) => void,
  scope: React.RefObject<HTMLElement | null>,
  deps: readonly unknown[] = [],
): void {
  const reduced = useReducedMotion();

  exposeDebugHandle();

  useGSAP(
    (_context, contextSafe) => {
      setup({
        gsap,
        reduced,
        // useGSAP가 넘기는 contextSafe는 항상 정의돼 있다.
        contextSafe: contextSafe as GsapDomContext['contextSafe'],
      });
    },
    { scope, dependencies: [reduced, ...deps], revertOnUpdate: true },
  );
}
