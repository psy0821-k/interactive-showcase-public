/**
 * 기법 카테고리 — 웹 갤러리에서 결과물을 탐색하는 시각적 결과 기준.
 *
 * 이 배열은 진실 공급원이다. 쇼케이스 디렉토리의 첫 세그먼트가 이 값 중
 * 하나여야 하며, 자동 등록(registry)이 경로와 meta.category의 일치를 검증한다.
 */
export const TECHNIQUE_CATEGORIES = [
  'immersive-background',
  'product-showcase',
  'scroll-storytelling',
  'interactive-art',
  'data-visualization',
  'environment-world',
  'text-typography',
  'transition-effect',
] as const;

export type TechniqueCategory = (typeof TECHNIQUE_CATEGORIES)[number];

/** 화면에 노출하는 한국어 표시명. 8개 전부를 강제하기 위해 Record를 쓴다. */
export const TECHNIQUE_CATEGORY_LABELS: Record<TechniqueCategory, string> = {
  'immersive-background': '몰입형 배경',
  'product-showcase': '제품 쇼케이스',
  'scroll-storytelling': '스크롤 스토리텔링',
  'interactive-art': '인터랙티브 아트',
  'data-visualization': '데이터 시각화',
  'environment-world': '환경 & 월드',
  'text-typography': '텍스트 & 타이포',
  'transition-effect': '트랜지션 & 이펙트',
};

/** 임의의 문자열이 기법 카테고리인지 좁힌다. 경로 파싱 결과 검증에 쓴다. */
export function isTechniqueCategory(value: string): value is TechniqueCategory {
  return (TECHNIQUE_CATEGORIES as readonly string[]).includes(value);
}
