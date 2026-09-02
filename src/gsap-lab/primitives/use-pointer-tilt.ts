"use client";

import { useGsapDom } from "@/hooks/use-gsap-dom";

/** `usePointerTilt` 옵션. */
export interface PointerTiltOptions {
  /** 기울일 카드 셀렉터 (scope 안). */
  target: string;
  /**
   * 각 카드 안에서 광택 하이라이트로 쓸 요소 셀렉터. 생략하면 광택 없음.
   * `target` 요소의 자손이어야 한다.
   */
  glare?: string;
  /** 최대 기울기 각도(도). 기본 18. */
  maxTilt?: number;
  /** 마우스 진입 시 확대 배율. 생략하면 확대 없음. */
  hoverScale?: number;
}

/**
 * 카드가 커서 위치에 따라 3D로 기울고(rotateX/rotateY) 광택이 움직이는
 * 프리미티브. 벗어나면 원위치.
 *
 * 커서의 카드 내 상대 위치를 -0.5~0.5로 정규화해 회전에 매핑한다.
 * 회전은 `quickTo`로 트윈 재사용. 데스크탑 전용(`matchMedia`).
 * 부모에 `perspective`, 카드에 `transform-style: preserve-3d`가 필요하다.
 *
 * 사용처: tilt-card-grid, pointer-play.
 *
 * @param scope 컨테이너 ref.
 * @param options 틸트 설정.
 */
export function usePointerTilt(
  scope: React.RefObject<HTMLElement | null>,
  options: PointerTiltOptions,
): void {
  const { target, glare, maxTilt = 18, hoverScale } = options;

  useGsapDom(
    ({ gsap: g, reduced }) => {
      const root = scope.current;
      if (!root) return;
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (!mq.matches || reduced) return;

      const cards = root.querySelectorAll<HTMLElement>(target);
      const cleanups: Array<() => void> = [];

      cards.forEach((card) => {
        const glareEl = glare
          ? card.querySelector<HTMLElement>(glare)
          : null;
        const rotX = g.quickTo(card, "rotationX", { duration: 0.4, ease: "power2" });
        const rotY = g.quickTo(card, "rotationY", { duration: 0.4, ease: "power2" });

        const onEnter = () => {
          if (hoverScale) {
            g.to(card, { scale: hoverScale, duration: 0.35, ease: "power2.out" });
          }
        };
        const onMove = (e: PointerEvent) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          rotY(px * maxTilt);
          rotX(-py * maxTilt);
          if (glareEl) {
            g.to(glareEl, {
              xPercent: px * 60,
              yPercent: py * 60,
              autoAlpha: 0.35,
              duration: 0.4,
            });
          }
        };
        const onLeave = () => {
          g.to(card, {
            rotationX: 0,
            rotationY: 0,
            ...(hoverScale ? { scale: 1 } : {}),
            duration: 0.6,
            ease: "power3.out",
          });
          if (glareEl) g.to(glareEl, { autoAlpha: 0, duration: 0.4 });
        };

        card.addEventListener("pointerenter", onEnter);
        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("pointerenter", onEnter);
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
        });
      });

      return () => cleanups.forEach((fn) => fn());
    },
    scope,
  );
}
