/**
 * Skill 카테고리 — `skills/{category}/{name}/SKILL.md`의 폴더 축.
 *
 * 기법(구현 수단) 기준 분류로, 갤러리의 기법 카테고리(시각적 결과 기준,
 * `technique-category.ts`)와는 다른 축이다. 쇼케이스 상세의 "사용 기법"
 * pill이 이 카탈로그의 skill을 가리킨다.
 */
export const SKILL_CATEGORIES = [
  'scene-setup',
  'geometry-material',
  'model-animation',
  'particles-simulation',
  'interaction',
  'post-processing',
  'scroll-page',
  'text-typography',
  'gsap-animation',
  'performance',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** 화면에 노출하는 한국어 표시명. */
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  'scene-setup': '씬 토대',
  'geometry-material': '지오메트리 · 재질',
  'model-animation': '모델 · 애니메이션',
  'particles-simulation': '파티클 · 시뮬레이션',
  interaction: '인터랙션',
  'post-processing': '후처리',
  'scroll-page': '스크롤 연동',
  'text-typography': '텍스트 · 타이포그래피',
  'gsap-animation': 'GSAP 애니메이션',
  performance: '성능',
};

/** 임의의 문자열이 skill 카테고리인지 좁힌다. */
export function isSkillCategory(value: string): value is SkillCategory {
  return (SKILL_CATEGORIES as readonly string[]).includes(value);
}
