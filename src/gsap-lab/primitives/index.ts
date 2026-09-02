/**
 * `/gsap-lab` 재사용 프리미티브.
 *
 * 각 데모에서 반복되던 GSAP 셋업(뷰포트 진입 등장, 핀 타임라인, 패럴랙스,
 * 카운트업, SVG 드로우, 포인터 인터랙션)을 훅으로 캡슐화한다. reduced-motion
 * 분기·정리·트리거 예산 최소화가 프리미티브 안에 들어 있어, 데모는 마크업과
 * 파라미터만 담당한다.
 */
export {
  useRevealOnScroll,
  type RevealOnScrollOptions,
} from "./use-reveal-on-scroll";
export {
  useCountUp,
  formatCountValue,
  type CountUpOptions,
  type CountUpTarget,
} from "./use-count-up";
export {
  useDrawSvgPaths,
  type DrawSvgPathsOptions,
} from "./draw-svg-paths";
export { useMagnetic, type MagneticOptions } from "./use-magnetic";
export { usePointerTilt, type PointerTiltOptions } from "./use-pointer-tilt";
export { useParallax, type ParallaxOptions } from "./use-parallax";
export {
  useScrollProgress,
  type ScrollProgressOptions,
} from "./use-scroll-progress";
export {
  usePinnedTimeline,
  type PinnedTimelineOptions,
  type PinnedTimelineContext,
} from "./use-pinned-timeline";
