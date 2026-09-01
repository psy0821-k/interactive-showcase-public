"use client";

import { useGSAP } from "@gsap/react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** useGsapScene 콜백이 받는 컨텍스트. */
export interface GsapSceneContext {
  /** 전역 gsap 인스턴스. */
  gsap: typeof gsap;
  /**
   * 모션 축소 설정이 켜져 있으면 true.
   * 이때 트윈 대신 `gsap.set`으로 최종 상태만 찍는다.
   */
  reduced: boolean;
  /**
   * 이벤트 핸들러 안에서 만드는 트윈을 감쌀 때 사용한다.
   * `useGSAP`의 contextSafe로, 감싼 함수 안의 GSAP 객체도 언마운트 시 정리된다.
   */
  contextSafe: <T extends (...args: never[]) => unknown>(fn: T) => T;
}

/**
 * GSAP 트윈을 이 프로젝트의 R3F 셸과 조화시킨다. (`gsap-r3f-integration` 7절)
 *
 * - 스코프 안 모든 트윈의 `onUpdate`에 `invalidate()`를 걸어
 *   `meta.frameloop: "demand"`에서도 애니메이션이 보이게 한다
 *   (`"always"`면 무해한 추가 호출).
 * - `reduced` 플래그를 콜백에 넘겨, 쇼케이스가 모션 축소 분기를 만들게 한다.
 * - `reduced` 변경 시 이전 GSAP 객체를 revert하고 콜백을 다시 실행한다.
 *
 * `useThree`에 의존하므로 `<Canvas>` 안(= Scene 트리)에서만 호출한다.
 *
 * @param setup GSAP 객체를 만드는 콜백. 여기서 만든 트윈·타임라인은 언마운트 시 자동 정리.
 * @param deps 추가 의존성. 값이 바뀌면 GSAP 객체를 revert 후 재실행.
 */
export function useGsapScene(
  setup: (ctx: GsapSceneContext) => void,
  deps: readonly unknown[] = [],
): void {
  const invalidate = useThree((state) => state.invalidate);
  const reduced = useReducedMotion();

  useGSAP(
    (_context, contextSafe) => {
      // 이 스코프에서 만드는 모든 트윈에 onUpdate를 기본으로 건다.
      // 개별 트윈이 자기 onUpdate를 주면 GSAP가 둘 다 호출한다.
      const previousDefaults = gsap.defaults();
      gsap.defaults({ onUpdate: invalidate });

      setup({
        gsap,
        reduced,
        // useGSAP가 넘기는 contextSafe. 시그니처만 우리 타입으로 좁힌다.
        contextSafe: contextSafe as GsapSceneContext["contextSafe"],
      });

      // 전역 defaults를 원복해 다른 쇼케이스에 새지 않게 한다.
      gsap.defaults(previousDefaults);
    },
    { dependencies: [reduced, ...deps], revertOnUpdate: true },
  );
}
