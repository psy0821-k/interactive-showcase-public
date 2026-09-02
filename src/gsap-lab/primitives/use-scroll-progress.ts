"use client";

import { useGsapDom } from "@/hooks/use-gsap-dom";
import {
  refreshAfterLayout,
  ScrollTrigger,
} from "@/gsap-lab/scroll/scroll-trigger-setup";

/** `useScrollProgress` 옵션. */
export interface ScrollProgressOptions {
  /**
   * 진행률 대상 요소 셀렉터 (scope 안). `scaleX`가 0→1로 갱신된다.
   * `transform-origin: left`, 초기 `scale-x-0`이 필요하다.
   */
  bar: string;
  /**
   * 현재 섹션을 표시할 목차 링크 셀렉터. 각 링크는 `data-{sectionIdAttr}`로
   * 대응 섹션 id를 가리킨다. 생략하면 섹션 하이라이트 없음.
   */
  tocLink?: string;
  /**
   * 섹션 요소 셀렉터. `id`가 `data-{sectionIdAttr}` 값과 매칭된다.
   * `tocLink`를 쓰면 필수.
   */
  section?: string;
  /** 링크가 가리키는 섹션 id가 담긴 data 속성. 기본 `"id"` (`data-id`). */
  sectionIdAttr?: string;
  /** 활성 섹션 링크에 토글할 클래스. 기본 `"toc-active"`. */
  activeClass?: string;
}

/**
 * 문서 스크롤 진행바 + 현재 섹션 하이라이트 프리미티브.
 *
 * **역할 분리**(실무 표준):
 * - 진행률: ScrollTrigger **1개**, `onUpdate`에서 `self.progress`로 bar `scaleX`
 *   (`width` 아님 — 리플로우 방지).
 * - 현재 섹션: `IntersectionObserver` **1개** — 섹션 수만큼 트리거를 만들지
 *   않는다.
 *
 * 트리거 예산 = 1 (섹션이 몇 개든).
 *
 * 사용처: progress-indicator.
 *
 * @param scope 컨테이너 ref.
 * @param options 진행 인디케이터 설정.
 */
export function useScrollProgress(
  scope: React.RefObject<HTMLElement | null>,
  options: ScrollProgressOptions,
): void {
  const {
    bar,
    tocLink,
    section,
    sectionIdAttr = "id",
    activeClass = "toc-active",
  } = options;

  useGsapDom(
    ({ gsap: g }) => {
      refreshAfterLayout();
      const root = scope.current;
      if (!root) return;

      // 1) 진행바.
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          g.set(bar, { scaleX: self.progress });
        },
      });

      // 2) 현재 섹션 (선택).
      if (!tocLink || !section) return;
      const links = new Map(
        [...root.querySelectorAll<HTMLElement>(tocLink)].map((el) => [
          el.dataset[sectionIdAttr],
          el,
        ]),
      );
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).id;
            links
              .get(id)
              ?.classList.toggle(activeClass, entry.isIntersecting);
          }
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
      );
      root
        .querySelectorAll<HTMLElement>(section)
        .forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    },
    scope,
  );
}
