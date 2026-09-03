'use client';

import { useGsapDom } from '@/hooks/use-gsap-dom';
import { refreshAfterLayout } from '@/gsap-lab/scroll/scroll-trigger-setup';

/** `useParallax` 옵션. */
export interface ParallaxOptions {
  /**
   * 이동할 레이어 셀렉터 (scope 안). 각 레이어의 `data-{speedAttr}` 값이
   * 이동 속도(뷰포트 높이 대비 비율)를 정한다.
   */
  target: string;
  /** 스크롤 구간을 정하는 트리거 셀렉터. */
  trigger: string;
  /** 속도 값이 담긴 data 속성 이름. 기본 `"speed"` (`data-speed`). */
  speedAttr?: string;
  /**
   * 축. `"y"`(기본) 또는 `"x"`. 이동량 = `innerHeight × speed`(y) /
   * `innerWidth × speed`(x).
   */
  axis?: 'x' | 'y';
  /** 시작 위치. 기본 `"top bottom"`. */
  start?: string;
  /** 끝 위치. 기본 `"bottom top"`. */
  end?: string;
}

/**
 * 여러 레이어를 스크롤에 따라 서로 다른 속도로 이동시키는 프리미티브.
 *
 * 레이어별 `data-speed`(뷰포트 대비 비율)로 이동량을 정하고, `y`/`x`를
 * **함수형 값**(`() => innerHeight * speed`)으로 넘겨 `invalidateOnRefresh`
 * 때 리사이즈에 다시 적응한다. `ease: "none"` + `scrub: true`로 스크롤에
 * 선형 직결(패럴랙스는 이징을 넣으면 어색). px 하드코딩 없음.
 *
 * 사용처: parallax-layers, parallax-image-grid.
 *
 * @param scope 컨테이너 ref.
 * @param options 패럴랙스 설정.
 */
export function useParallax(
  scope: React.RefObject<HTMLElement | null>,
  options: ParallaxOptions,
): void {
  const {
    target,
    trigger,
    speedAttr = 'speed',
    axis = 'y',
    start = 'top bottom',
    end = 'bottom top',
  } = options;

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();
    const layers = scope.current?.querySelectorAll<HTMLElement>(target);
    if (!layers || layers.length === 0) return;

    if (reduced) {
      g.set(target, { x: 0, y: 0 });
      return;
    }

    layers.forEach((layer) => {
      const speed = Number(layer.dataset[speedAttr] ?? 0);
      const distance = () =>
        (axis === 'y' ? window.innerHeight : window.innerWidth) * speed;

      g.fromTo(
        layer,
        { [axis]: 0 },
        {
          [axis]: distance,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start,
            end,
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    });
  }, scope);
}
