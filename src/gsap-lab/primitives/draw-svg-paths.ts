'use client';

import { useGsapDom } from '@/hooks/use-gsap-dom';
import { refreshAfterLayout } from '@/gsap-lab/scroll/scroll-trigger-setup';

/** `useDrawSvgPaths` 옵션. */
export interface DrawSvgPathsOptions {
  /** 그릴 `<path>` 셀렉터 (scope 안). */
  target: string;
  /** 트리거 요소 셀렉터. */
  trigger: string;
  /** 시작 위치. 기본 `"top 70%"`. */
  start?: string;
  /**
   * 그리는 방식:
   * - `"stagger"`(기본): path마다 시간차로 순서대로.
   * - `"scrub"`: 스크롤 진행에 직결(end까지).
   */
  mode?: 'stagger' | 'scrub';
  /** stagger 모드: 획 하나 길이(초). 기본 0.5. */
  duration?: number;
  /** stagger 모드: 획 간 지연(초). 기본 0.18. */
  stagger?: number;
  /** scrub 모드: 끝 위치. 기본 `"bottom 80%"`. */
  end?: string;
  /**
   * path를 그룹으로 묶어 그릴 때, 그룹 키가 담긴 data 속성 이름.
   * 예: `"icon"` → `data-icon` 값이 같은 path들이 한 라벨에 함께 그려진다.
   * stagger 모드에서만 유효.
   */
  groupBy?: string;
}

/**
 * SVG path를 "그려지듯" 나타내는 프리미티브.
 *
 * 각 path의 `getTotalLength()`로 `strokeDasharray`·`strokeDashoffset`을
 * 길이만큼 세팅해 "안 그려진" 상태로 두고, `strokeDashoffset`을 0으로
 * 트윈해 그린다. 유료 DrawSVG 없이 순수 SVG 속성만 사용.
 * `reduced`면 즉시 완성 상태.
 *
 * 사용처: svg-path-draw(scrub), signature-draw(stagger), icon-line-trace(stagger+groupBy).
 *
 * @param scope 컨테이너 ref.
 * @param options 드로우 설정.
 */
export function useDrawSvgPaths(
  scope: React.RefObject<HTMLElement | null>,
  options: DrawSvgPathsOptions,
): void {
  const {
    target,
    trigger,
    start = 'top 70%',
    mode = 'stagger',
    duration = 0.5,
    stagger = 0.18,
    end = 'bottom 80%',
    groupBy,
  } = options;

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();
    const paths = scope.current?.querySelectorAll<SVGPathElement>(target);
    if (!paths || paths.length === 0) return;

    paths.forEach((path) => {
      const len = path.getTotalLength();
      g.set(path, {
        strokeDasharray: len,
        strokeDashoffset: reduced ? 0 : len,
      });
    });
    if (reduced) return;

    if (mode === 'scrub') {
      g.to(target, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger, start, end, scrub: 1 },
      });
      return;
    }

    // stagger 모드 — ScrollTrigger 1개에 묶인 타임라인.
    const tl = g.timeline({
      scrollTrigger: {
        trigger,
        start,
        toggleActions: 'play none none reverse',
      },
    });

    if (groupBy) {
      // data-{groupBy} 값별로 그룹을 만들어 라벨로 순서 정렬.
      const groups = new Map<string, SVGPathElement[]>();
      paths.forEach((p) => {
        const key = p.dataset[groupBy] ?? '0';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
      });
      [...groups.keys()].forEach((key, i) => {
        const label = `g-${key}`;
        tl.addLabel(label, i === 0 ? 0 : `>-0.25`);
        tl.to(
          `${target}[data-${groupBy}="${key}"]`,
          {
            strokeDashoffset: 0,
            duration: duration + 0.1,
            ease: 'power1.inOut',
          },
          label,
        );
      });
    } else {
      tl.to(target, {
        strokeDashoffset: 0,
        duration,
        ease: 'power1.inOut',
        stagger,
      });
    }
  }, scope);
}
