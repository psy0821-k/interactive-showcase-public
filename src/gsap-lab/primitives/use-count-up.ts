'use client';

import { useGsapDom } from '@/hooks/use-gsap-dom';
import { refreshAfterLayout } from '@/gsap-lab/scroll/scroll-trigger-setup';

/** 카운트업 대상 하나. */
export interface CountUpTarget {
  /** 목표값. */
  value: number;
  /** 소수 자릿수. 기본 0. */
  decimals?: number;
}

/** `useCountUp` 옵션. */
export interface CountUpOptions {
  /** 숫자를 넣을 요소 셀렉터 (scope 안, 순서 = targets 순서). */
  target: string;
  /** 트리거 요소 셀렉터. */
  trigger: string;
  /** 각 요소의 목표값. */
  targets: CountUpTarget[];
  /** 트윈 길이(초). 기본 1.8. */
  duration?: number;
  /** 요소 간 시작 지연(초). 기본 0.1. */
  stagger?: number;
  /** 시작 위치. 기본 `"top 75%"`. */
  start?: string;
}

/** 천 단위 구분 + 소수 자릿수 포맷. */
export function formatCountValue(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 뷰포트 진입 시 숫자를 0 → 목표값으로 증가시키는 프리미티브.
 *
 * 프록시 객체 `{ n: 0 }`를 트윈하고 `onUpdate`에서 `textContent`를 갱신한다
 * (DOM 텍스트는 직접 트윈 불가). `toggleActions: "play none none none"`으로
 * 한 번만 재생 — 되감아도 다시 세지 않는다. `reduced`면 최종값을 즉시 표시.
 *
 * 사용처: counter-on-scroll, chart-bar-grow.
 *
 * @param scope 컨테이너 ref.
 * @param options 카운트업 설정.
 */
export function useCountUp(
  scope: React.RefObject<HTMLElement | null>,
  options: CountUpOptions,
): void {
  const {
    target,
    trigger,
    targets,
    duration = 1.8,
    stagger = 0.1,
    start = 'top 75%',
  } = options;

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();
    const els = scope.current?.querySelectorAll<HTMLElement>(target);
    if (!els) return;

    els.forEach((el, index) => {
      const spec = targets[index];
      if (!spec) return;
      const decimals = spec.decimals ?? 0;

      if (reduced) {
        el.textContent = formatCountValue(spec.value, decimals);
        return;
      }

      const proxy = { n: 0 };
      g.to(proxy, {
        n: spec.value,
        duration,
        ease: 'power2.out',
        delay: index * stagger,
        onUpdate: () => {
          el.textContent = formatCountValue(proxy.n, decimals);
        },
        scrollTrigger: {
          trigger,
          start,
          toggleActions: 'play none none none',
        },
      });
    });
  }, scope);
}
