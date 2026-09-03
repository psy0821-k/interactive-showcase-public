'use client';

import { useGsapDom } from '@/hooks/use-gsap-dom';

/** `useMagnetic` 옵션. */
export interface MagneticOptions {
  /** 자석처럼 끌릴 요소 셀렉터 (scope 안). */
  target: string;
  /** 커서가 이 거리(px) 안에 들어오면 끌린다. 기본 70. */
  range?: number;
  /** 끌림 강도(0~1). 커서 방향으로 거리 × 이 값만큼 이동. 기본 0.5. */
  strength?: number;
  /** 추적 트윈 길이(초). 기본 0.4. */
  followDuration?: number;
  /** 복귀 이징. 기본 `"elastic.out(1, 0.35)"`. */
  returnEase?: string;
}

/**
 * 요소가 커서에 자석처럼 끌렸다가 벗어나면 튕겨 복귀하는 프리미티브.
 *
 * 요소마다 `gsap.quickTo`로 x/y 트윈을 하나씩 만들어 **재사용**한다
 * (`pointermove`마다 `gsap.to`를 새로 만들면 GC 압박). 리스너는
 * `useGSAP` 콜백 안에서 등록하고 반환 정리 함수로 해제한다.
 * `matchMedia("(hover: hover) and (pointer: fine)")`로 데스크탑에서만 활성화 —
 * 터치 기기에서는 아무 것도 하지 않는다.
 *
 * 사용처: magnetic-nav, pointer-play.
 *
 * @param scope 컨테이너 ref.
 * @param options 자석 설정.
 */
export function useMagnetic(
  scope: React.RefObject<HTMLElement | null>,
  options: MagneticOptions,
): void {
  const {
    target,
    range = 70,
    strength = 0.5,
    followDuration = 0.4,
    returnEase = 'elastic.out(1, 0.35)',
  } = options;

  useGsapDom(({ gsap: g, reduced }) => {
    const root = scope.current;
    if (!root) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mq.matches || reduced) return;

    const items = root.querySelectorAll<HTMLElement>(target);
    const cleanups: Array<() => void> = [];

    items.forEach((item) => {
      const moveX = g.quickTo(item, 'x', {
        duration: followDuration,
        ease: 'power3',
      });
      const moveY = g.quickTo(item, 'y', {
        duration: followDuration,
        ease: 'power3',
      });

      const onMove = (e: PointerEvent) => {
        const r = item.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < range + r.width / 2) {
          moveX(dx * strength);
          moveY(dy * strength);
        }
      };
      const onLeave = () => {
        g.to(item, { x: 0, y: 0, duration: 0.9, ease: returnEase });
      };

      item.addEventListener('pointermove', onMove);
      item.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        item.removeEventListener('pointermove', onMove);
        item.removeEventListener('pointerleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, scope);
}
