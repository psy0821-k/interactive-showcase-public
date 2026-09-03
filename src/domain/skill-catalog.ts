import type { SkillCategory } from './skill-category';

/**
 * Skill 카탈로그 항목 — 쇼케이스 상세의 "사용 기법" pill이 링크하는 대상.
 *
 * `skills/{category}/{name}/SKILL.md`의 요약본이다. SKILL.md 전문이 아니라
 * `docs/SKILLS.md`의 "한 줄 / 핵심 함정" 표에서 이식한 카드용 정보다.
 * SKILL.md 원문을 앱 밖(상위 폴더) 파일로 읽지 않기 위해 여기서 직접 정의한다.
 */
export interface SkillEntry {
  /** SKILL.md frontmatter의 name. `meta.usedSkills` 문자열과 정확히 일치. 라우팅 키. */
  name: string;
  /** 표시용 한국어 제목. */
  title: string;
  /** skill 폴더 카테고리 (기법 축). */
  category: SkillCategory;
  /** 한 줄 설명. */
  summary: string;
  /** 핵심 함정 — "이렇게 하면 조용히 깨진다". */
  pitfall: string;
  /** 로드 순서상 먼저 익혀야 하는 skill 이름. 각각 다시 이 카탈로그의 키. */
  requires?: string[];
}

/**
 * 등록된 skill. 여기 없는 `usedSkills` 문자열은 상세 페이지에서 링크 없이
 * 표시된다(기존 3D 쇼케이스의 미등록 skill 회귀 방지). 현재는 GSAP 4종과
 * GSAP 쇼케이스가 함께 참조하는 기존 skill만 채운다.
 */
export const SKILL_CATALOG: Record<string, SkillEntry> = {
  'gsap-r3f-integration': {
    name: 'gsap-r3f-integration',
    title: 'GSAP × R3F 통합',
    category: 'gsap-animation',
    summary:
      'GSAP를 R3F 셸 위에서 안전하게 돌리는 접합부. `useGSAP` + 재사용 훅 ' +
      '`useGsapScene`(invalidate + 모션 축소)을 정의하는 GSAP 카테고리의 진입점.',
    pitfall:
      'GSAP는 자체 ticker 루프로 R3F 바깥에서 값을 바꾼다. `frameloop: "demand"`면 ' +
      '트윈이 값을 바꿔도 화면이 안 갱신됨 → `invalidate()` 또는 `frameloop: "always"`. ' +
      '`useGSAP` 없이 트윈하면 언마운트 후 null 참조. color 문자열·quaternion은 트윈 불가. ' +
      'rotation은 라디안.',
    requires: ['standard-scene-setup'],
  },
  'gsap-timeline-sequence': {
    name: 'gsap-timeline-sequence',
    title: 'GSAP 타임라인 시퀀스',
    category: 'gsap-animation',
    summary:
      '여러 트윈을 순서·겹침·라벨로 엮는 등장 연출·다단계 시퀀스. ' +
      '`useFrame` 상태 머신으로 짜면 지저분해지는 애니메이션이 대상.',
    pitfall:
      '생성자 `duration`은 자식 트윈에 안 먹힘 → `defaults`. 3D 객체는 셀렉터가 아니라 ' +
      '객체를 직접 넘긴다. `stagger`는 Vector3 배열로 펴서. 모션 축소면 타임라인 자체를 ' +
      '만들지 않고 `gsap.set`으로 최종 상태만. 중첩 타임라인에 `scrollTrigger` 금지.',
    requires: ['standard-scene-setup', 'gsap-r3f-integration'],
  },
  'gsap-scrolltrigger-scene': {
    name: 'gsap-scrolltrigger-scene',
    title: 'GSAP ScrollTrigger 씬',
    category: 'gsap-animation',
    summary:
      '스크롤 위치에 트윈·타임라인을 묶기(`scrub`·`pin`). 다만 대부분의 경우 ' +
      'drei `<ScrollControls>` 기반 `section-scroll-scene`이 정답이다.',
    pitfall:
      '상세 캔버스는 `h-[60vh] overflow-hidden`이라 스크롤이 없다 → ScrollTrigger가 ' +
      '발동하지 않음. 별도 랜딩 페이지 + `scroller` 옵션일 때만. 폰트·이미지 로드 후 ' +
      '`ScrollTrigger.refresh()` 필요. `useGSAP` 밖에서 만들면 상세를 오갈 때마다 중복.',
    requires: [
      'standard-scene-setup',
      'gsap-r3f-integration',
      'gsap-timeline-sequence',
    ],
  },
  // DOM 트랙 — R3F 없이 마케팅·포트폴리오 페이지 패턴.
  'gsap-dom-motion': {
    name: 'gsap-dom-motion',
    title: 'GSAP DOM 모션',
    category: 'gsap-animation',
    summary:
      'DOM GSAP의 진입점 — 목록 스태거 등장, 헤더 진입 연출, 필터·탭 크로스페이드, ' +
      '라우트 전환. `useGSAP`·`scope`·`contextSafe`·FOUC·진행적 향상의 기반.',
    pitfall:
      '서버 렌더된 DOM에 `from()` → FOUC. CSS `opacity: 0` 초기값 + ' +
      '`@media (scripting: none)` 폴백(JS 없이도 콘텐츠가 보여야). 이벤트 핸들러 트윈은 ' +
      '`contextSafe`. 항목 많으면 `stagger: { amount }`. `transform`/`opacity`만 트윈. ' +
      '`100dvh`(모바일 주소창).',
  },
  'gsap-dom-core': {
    name: 'gsap-dom-core',
    title: 'GSAP DOM 코어 문법',
    category: 'gsap-animation',
    summary:
      'GSAP 코어 문법 — 트윈 4종·이징·`CustomEase`·타임라인·position parameter·라벨·' +
      '`stagger` 심화·재생 제어. 글자 단위 스태거, 인트로 시퀀스의 문법.',
    pitfall:
      '생성자 `duration`은 자식 트윈에 안 먹힘 → `defaults`. 같은 프로퍼티에 겹치는 ' +
      '`from()`은 `immediateRender: false`. position 상대값만 쓰면 트윈 추가·삭제 시 뒤가 ' +
      '밀림 → 라벨. 글자 스태거는 개수 주의(모바일은 단어 단위).',
    requires: ['gsap-dom-motion'],
  },
  'gsap-dom-scrolltrigger': {
    name: 'gsap-dom-scrolltrigger',
    title: 'GSAP DOM ScrollTrigger',
    category: 'gsap-animation',
    summary:
      '순수 DOM ScrollTrigger — 패럴랙스(`yPercent` 스크럽)·섹션 핀·스크롤 진행 ' +
      '인디케이터·키네틱 타이포·뷰포트 진입 1회 재생(`toggleActions`).',
    pitfall:
      '`gsap.registerPlugin(ScrollTrigger)` 누락 시 조용히 무동작. 폰트·이미지 로드 후 ' +
      '`ScrollTrigger.refresh()`. `useGSAP` 밖 생성 시 중복 발동. 중첩 타임라인에 ' +
      '`scrollTrigger` 금지. `pin`은 모바일에서 무거움 → `toggleActions` + ' +
      '`ignoreMobileResize`.',
    requires: ['gsap-dom-motion', 'gsap-dom-core'],
  },
  'gsap-dom-interaction': {
    name: 'gsap-dom-interaction',
    title: 'GSAP DOM 인터랙션',
    category: 'gsap-animation',
    summary:
      '포인터 인터랙션 — 마그네틱 버튼/커서·커스텀 커서(`quickTo`)·호버 3D 틸트·' +
      '클릭 리플. 이벤트 핸들러에서 트윈.',
    pitfall:
      '`mousemove`마다 `gsap.to()` → 트윈 폭증. `quickTo`로 재사용. 핸들러 트윈은 ' +
      '`contextSafe`. 터치 기기엔 마그네틱·호버 무의미 → ' +
      '`matchMedia("(hover: hover) and (pointer: fine)")`. `x`/`y`만(`left`/`top` 금지).',
    requires: ['gsap-dom-motion', 'gsap-dom-core'],
  },

  // GSAP 쇼케이스가 함께 참조하는 기존 skill (요약만).
  'standard-scene-setup': {
    name: 'standard-scene-setup',
    title: '표준 씬 셋업',
    category: 'scene-setup',
    summary:
      '모든 쇼케이스가 서는 토대 — 카메라·3점 조명·스케일 기준·파일 계약. ' +
      '셸(`showcase-canvas.tsx`)이 `<Canvas>`·`<OrbitControls>`를 공통 제공한다.',
    pitfall:
      'R3F가 이미 하는 것(톤매핑·색공간·DPR)을 쇼케이스에서 다시 하지 않는다. ' +
      '쇼케이스는 `<Canvas>`를 만들지 않고 `Scene`과 `meta`만 export한다.',
  },
  'procedural-animation': {
    name: 'procedural-animation',
    title: '절차적 애니메이션',
    category: 'model-animation',
    summary:
      '키프레임 없이 코드가 매 프레임 계산 — 회전·부유·맥동·추적. ' +
      '이 프로젝트의 기본 애니메이션 도구로, 반복 운동은 GSAP보다 이쪽이 가볍다.',
    pitfall:
      '속도는 "프레임당"이 아니라 "초당"으로(`delta` 곱). `lerp(a, b, 0.1)` 고정 계수 ' +
      '보간도 같은 병 → `1 - exp(-rate·delta)` 지수 감쇠. `useFrame` 안 `setState` 금지. ' +
      '탭 전환 후 delta 폭주 → 클램프.',
    requires: ['standard-scene-setup'],
  },
  'section-scroll-scene': {
    name: 'section-scroll-scene',
    title: '섹션 스크롤 씬',
    category: 'scroll-page',
    summary:
      'drei `<ScrollControls>`로 스크롤 한 축에 여러 챕터를 얹고 각 챕터에서 3D 씬이 ' +
      '다른 상태를 보이는 스토리텔링 페이지. 이 프로젝트의 스크롤 쇼케이스 기본.',
    pitfall:
      '셸의 `<OrbitControls makeDefault />`와 충돌 → `meta.controlsMode: "none"`. ' +
      '`<Scroll>` 밖 자식은 화면 고정, 안은 스크롤과 함께 이동. `useFrame` 안에서 ' +
      '`useScroll()` 결과로 `setState` 금지.',
    requires: ['standard-scene-setup'],
  },
};

/** 이름으로 skill을 찾는다. 없으면 undefined. */
export function getSkillEntry(name: string): SkillEntry | undefined {
  return SKILL_CATALOG[name];
}

/** 카탈로그의 모든 skill. 제목 가나다순. */
export function listSkills(): SkillEntry[] {
  return Object.values(SKILL_CATALOG).sort((a, b) =>
    a.title.localeCompare(b.title, 'ko'),
  );
}
