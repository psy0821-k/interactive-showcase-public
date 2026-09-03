import type { TechniqueCategory } from "./technique-category";

/**
 * 셸(`showcase-canvas.tsx`)의 `<Canvas frameloop>` 값.
 *
 * - `"always"` (생략 시 기본): 매 rAF마다 렌더. 상시 애니메이션 씬.
 * - `"demand"`: `invalidate()`로 요청된 프레임만 렌더. 상호작용할 때만
 *   화면이 변하는 씬(제품 뷰어, 차트). 이 값을 쓰는 쇼케이스는 모든 시각
 *   변화가 상태 파생이거나 `invalidate()`를 명시적으로 부르도록 짜여 있어야 한다.
 */
export type ShowcaseFrameloop = "always" | "demand";

/**
 * 셸이 공통 `<OrbitControls makeDefault />`를 렌더할지 여부.
 *
 * - `"orbit"` (생략 시 기본): 셸이 OrbitControls를 렌더. 대부분의 쇼케이스.
 * - `"none"`: 셸이 OrbitControls를 렌더하지 않는다. 카메라를 코드로 모는
 *   쇼케이스(스크롤-카메라 등)가 `controls.enabled = false` 회피 없이
 *   카메라 소유권을 온전히 갖는다.
 */
export type ShowcaseControlsMode = "orbit" | "none";

/**
 * 쇼케이스가 속한 갤러리 트랙. 생략하면 `"3d"`.
 *
 * - `"3d"`: 홈(`/`) 갤러리. R3F 씬 기법 쇼케이스.
 * - `"gsap"`: `/gsap` 갤러리. GSAP 애니메이션 쇼케이스. 셸 Contract는 3D와
 *   동일하고 구현 수단만 다르다(`usedSkills`에 `gsap-*` 포함).
 */
export type ShowcaseTrack = "3d" | "gsap";

/** 알려진 트랙 목록. */
export const SHOWCASE_TRACKS = ["3d", "gsap"] as const;

/** 쇼케이스 index.tsx가 named export 하는 메타데이터. */
export interface ShowcaseMeta {
  /** 화면 표시 제목 */
  title: string;
  /** 소속 기법 카테고리 (정확히 1개) */
  category: TechniqueCategory;
  /** 사용된 skill 이름 목록. 표시 전용 문자열. 최소 1개. */
  usedSkills: string[];
  /** 갤러리·상세에 쓰는 한 줄~짧은 문단 설명 */
  description: string;
  /**
   * 이 쇼케이스를 만들 때 각 skill을 실제로 어떻게 썼는지 서술한다.
   * `usedSkills` 순서와 무관하게, "무엇을 위해 어떤 API를 어떻게" 수준으로
   * 2~4문장. 상세 페이지의 "스킬 활용 & 프롬프트" 섹션에 표시된다. 생략 가능.
   */
  skillUsage?: string;
  /**
   * 이 쇼케이스를 Claude Code로 만든다면 던질 법한 자연어 요청 예시.
   * 실제 프롬프트처럼 구체적으로(원하는 씬·조작·함정 회피 지시 포함) 적는다.
   * 상세 페이지에서 복사 버튼과 함께 표시된다. 생략 가능.
   */
  promptExample?: string;
  /**
   * 캔버스의 스크린리더 대체 텍스트(`<Canvas aria-label>`).
   * `description`은 코드 식별자·기술 용어가 섞인 개발자용 설명이라 낭독에
   * 부적합하다. 이 필드는 "무엇이 보이고 어떻게 조작하는가"를 자연스러운
   * 한국어 한두 문장으로 적는다. 생략하면 셸이 `"{title} 3D 씬"`으로 폴백한다.
   */
  a11yLabel?: string;
  /** 썸네일 이미지 경로. 선택. */
  thumbnail?: string;
  /** 렌더 루프 모드. 생략하면 `"always"`. */
  frameloop?: ShowcaseFrameloop;
  /** 셸 공통 카메라 컨트롤 모드. 생략하면 `"orbit"`. */
  controlsMode?: ShowcaseControlsMode;
  /** 갤러리 트랙. 생략하면 `"3d"`. */
  track?: ShowcaseTrack;
}

/** `meta.track`을 읽되 생략 시 `"3d"`로 본다. */
export function resolveTrack(meta: ShowcaseMeta): ShowcaseTrack {
  return meta.track ?? "3d";
}

/**
 * 자동 등록 후 런타임에서 다루는 형태.
 *
 * PRD 08절 원안에는 `loadScene: () => Promise<...>`가 포함돼 있었으나 제외했다.
 * Next App Router에서는 함수를 Server Component -> Client Component prop으로
 * 넘기면 예외가 발생한다("Passing a function as a prop ... throws").
 * 따라서 이 타입은 직렬화 가능한 값만 담아 경계를 자유롭게 넘나들게 하고,
 * Scene 로더는 클라이언트 전용 registry가 내부에서만 보유한다.
 */
export interface ShowcaseEntry {
  /** 디렉토리명에서 유도한 kebab-case 식별자. 라우팅 키. */
  slug: string;
  meta: ShowcaseMeta;
  /**
   * 갤러리 카드에 쓰는 썸네일 경로. registry가 slug로 유도한다
   * (`/thumbnails/{slug}.webp`). `meta.thumbnail`이 명시돼 있으면 그 값을
   * 우선한다. 파일은 `scripts/thumbnails-from-png.mjs`로 생성한다 —
   * `public/thumbnails/`에 800x450 webp. 파일이 없으면 카드가 제목
   * 이니셜 플레이스홀더로 대체한다(`onError`).
   */
  thumbnail: string;
}

/** meta 검증 실패 사유. 빌드를 멈추는 에러 메시지에 쓴다. */
export type MetaViolation = string;
