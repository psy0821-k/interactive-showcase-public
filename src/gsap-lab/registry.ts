/**
 * `/gsap-lab` — 순수 DOM GSAP 랩.
 *
 * 기존 R3F 갤러리(`src/showcases/*`)와 완전히 분리돼 있다. 이쪽은 캔버스도
 * 셸 Contract도 없고, 가상 SaaS 제품 "Fluxnote"를 소재로 삼는다.
 * 이미지가 필요한 자리는 전부 배경색만 다른 `<div>`다.
 *
 * 항목은 카테고리로 나뉜다.
 * - `landing`: 인터랙션 유형별 완성형 랜딩페이지
 * - `motion`: Tween·Timeline·Stagger — 스크롤과 무관한 시간 기반 애니메이션
 * - `scroll`: ScrollTrigger·Pin·Scrub·Parallax·가로 스크롤
 * - `pointer`: 마우스/포인터 위치에 반응하는 인터랙션
 * - `svg`: SVG path·stroke·shape 애니메이션
 */

/** 랩 항목의 카테고리. */
export type LabCategory = "landing" | "motion" | "scroll" | "pointer" | "svg";

/** 카테고리 표시명·설명. */
export const LAB_CATEGORY_META: Record<
  LabCategory,
  { label: string; description: string }
> = {
  landing: {
    label: "랜딩페이지",
    description: "인터랙션 유형별로 여러 기법을 엮은 완성형 랜딩페이지입니다.",
  },
  motion: {
    label: "모션 (Tween·Timeline·Stagger)",
    description:
      "스크롤과 무관하게 시간으로 재생되는 애니메이션. 타임라인 시퀀스, " +
      "stagger 등장, 재생 제어, 반응형 분기.",
  },
  scroll: {
    label: "스크롤 효과 (ScrollTrigger·Pin·Scrub·Parallax)",
    description:
      "스크롤 위치에 묶인 애니메이션. 패럴랙스·스크럽·핀·가로 스크롤·" +
      "순차/동시 등장·진행 인디케이터.",
  },
  pointer: {
    label: "포인터 인터랙션",
    description:
      "마우스/포인터 위치에 따라 요소가 이동·회전·왜곡되는 장식 인터랙션. " +
      "데스크탑 전용(matchMedia).",
  },
  svg: {
    label: "SVG 애니메이션",
    description:
      "SVG path 그리기, shape 모핑, stroke 애니메이션. 유료 플러그인 없이 " +
      "SVG 속성만 사용.",
  },
};

/** 랩 항목 하나. 라우트 세그먼트와 카드 표시에 함께 쓴다. */
export interface LabEntry {
  /** URL 세그먼트 (`/gsap-lab/{slug}`) */
  slug: string;
  /** 소속 카테고리 */
  category: LabCategory;
  /** 카드·상세 제목 */
  title: string;
  /** 이 페이지가 시연하는 효과/인터랙션 한 줄 태그 */
  tag: string;
  /** 한 줄 설명 */
  description: string;
  /** 시연에 쓴 GSAP skill 이름들. 표시 전용. */
  usedSkills: string[];
  /** 카드 썸네일 배경 (이미지 대신) */
  accent: string;
  /**
   * 이 기법을 실무에 적용할 때의 한계·주의점 한 줄. 상세 페이지 상단에 노출.
   * "언제 이 방법 대신 다른 걸 써야 하는가"를 적는다.
   */
  caveat?: string;
}

export const LAB_ENTRIES: LabEntry[] = [
  // ─── 랜딩페이지 ───────────────────────────────────────────
  {
    slug: "scroll-story",
    category: "landing",
    title: "Fluxnote — 스크롤 스토리",
    tag: "스크롤 연동 랜딩",
    description:
      "히어로 핀 고정, 패럴랙스 레이어, 스크롤 진행 인디케이터를 한 페이지에 " +
      "엮은 롱폼 랜딩.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
  },
  {
    slug: "pricing-reveal",
    category: "landing",
    title: "Fluxnote — 요금제 공개",
    tag: "시퀀스 등장 랜딩",
    description:
      "타임라인과 stagger로 히어로 → 기능 → 요금제 → FAQ가 순서대로 등장하는 " +
      "제품 소개 페이지.",
    usedSkills: ["gsap-dom-core", "gsap-dom-motion"],
    accent: "linear-gradient(135deg, #047857, #0ea5e9)",
  },
  {
    slug: "pointer-play",
    category: "landing",
    title: "Fluxnote — 포인터 플레이",
    tag: "포인터 인터랙션 랜딩",
    description:
      "마그네틱 CTA 버튼, quickTo 커스텀 커서, 호버 틸트 기능 그리드로 구성한 " +
      "에이전시풍 인터랙티브 히어로.",
    usedSkills: ["gsap-dom-interaction", "gsap-dom-core"],
    accent: "linear-gradient(135deg, #b91c1c, #ea580c)",
  },
  {
    slug: "tab-transition",
    category: "landing",
    title: "Fluxnote — 탭 전환",
    tag: "전환 이펙트 랜딩",
    description:
      "페이지 진입 오버레이, 글자 단위 스태거 제목, 탭 전환 크로스페이드로 묶은 " +
      "기능 둘러보기 페이지.",
    usedSkills: ["gsap-dom-motion", "gsap-dom-core"],
    accent: "linear-gradient(135deg, #7c2d12, #a21caf)",
  },

  // ─── 스크롤 효과 데모 ─────────────────────────────────────
  {
    slug: "parallax-layers",
    category: "scroll",
    title: "패럴랙스 레이어",
    tag: "레이어별 속도차",
    description:
      "배경·중경·전경이 서로 다른 속도로 스크롤되며 깊이감을 만든다. " +
      "yPercent 스크럽 + ease: none.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #0f172a, #334155)",
  },
  {
    slug: "hero-to-section",
    category: "scroll",
    title: "히어로 → 섹션 이동",
    tag: "크기·위치 변형",
    description:
      "히어로에 크게 자리한 이미지가 스크롤에 따라 축소되며 다음 섹션의 " +
      "썸네일 위치로 이동한다. 핀 + 스크럽.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #1e1b4b, #be185d)",
  },
  {
    slug: "reveal-sequence",
    category: "scroll",
    title: "순차 등장",
    tag: "하나씩 올라오기",
    description:
      "\"스크롤을 내려주세요\" 안내 후, 콘텐츠 카드가 아래에서 하나씩 " +
      "시간차로 올라온다. stagger + toggleActions.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #052e16, #15803d)",
  },
  {
    slug: "reveal-together",
    category: "scroll",
    title: "동시 등장",
    tag: "한꺼번에 올라오기",
    description:
      "섹션이 뷰포트에 들어오는 순간 모든 콘텐츠가 동시에 페이드업한다. " +
      "순차 등장과의 차이를 보여준다.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #422006, #ca8a04)",
  },
  {
    slug: "pin-progress",
    category: "scroll",
    title: "핀 스크롤링",
    tag: "섹션 고정 + 진행",
    description:
      "섹션이 화면에 고정된 채, 계속 스크롤하면 내부 단계가 순서대로 진행되고 " +
      "끝나면 고정이 풀린다.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #172554, #1d4ed8)",
  },
  {
    slug: "horizontal-scroll",
    category: "scroll",
    title: "가로 스크롤",
    tag: "세로 스크롤 → 가로 이동",
    description:
      "섹션을 핀 고정하고, 세로 스크롤 입력을 가로 트랙 이동으로 바꾼다. " +
      "갤러리·타임라인에 자주 쓰인다.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #500724, #db2777)",
    caveat:
      "핀 구간에서는 스크롤바 위치와 실제 콘텐츠가 어긋나 사용자가 혼란스러울 " +
      "수 있다. 트랙이 너무 길면 이탈률이 오른다(패널 5~7개 권장).",
  },
  {
    slug: "progress-indicator",
    category: "scroll",
    title: "진행 인디케이터",
    tag: "진행바 + 섹션 하이라이트",
    description:
      "상단 진행바가 문서 스크롤에 따라 차오르고, 현재 보고 있는 섹션의 " +
      "목차 항목이 활성화된다. onUpdate + onToggle.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #083344, #0891b2)",
  },
  {
    slug: "kinetic-typography",
    category: "scroll",
    title: "키네틱 타이포",
    tag: "스크롤로 글자 변형",
    description:
      "스크롤에 따라 큰 제목의 자간·크기·위치가 변하고, 글자가 하나씩 " +
      "흩어졌다 모인다. scrub + 글자 분할.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #1c1917, #78716c)",
    caveat:
      "글자를 <span>으로 쪼개면 스크린리더가 한 글자씩 읽는다 — 원문을 " +
      "aria-label로 병기해야 한다. 긴 문구는 글자 수만큼 트윈이 생겨 무겁다.",
  },
  {
    slug: "image-mask-reveal",
    category: "scroll",
    title: "이미지 마스크 공개",
    tag: "클립패스 확장",
    description:
      "스크롤하면 좁은 띠였던 이미지 블록이 clip-path로 화면을 채우며 " +
      "펼쳐진다. scrub로 스크롤에 직결.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #4a044e, #c026d3)",
  },
  {
    slug: "counter-on-scroll",
    category: "scroll",
    title: "숫자 카운트업",
    tag: "지표가 뷰포트 진입 시 증가",
    description:
      "통계 섹션이 보이면 0에서 목표값까지 숫자가 빠르게 증가한다. " +
      "textContent 트윈 + toggleActions.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #14532d, #65a30d)",
  },
  {
    slug: "sticky-stack-cards",
    category: "scroll",
    title: "스티키 스택 카드",
    tag: "카드가 쌓이며 넘어감",
    description:
      "카드들이 화면 중앙에 차례로 고정되며 겹쳐 쌓이고, 다음 카드가 " +
      "위로 올라와 덮는다. 여러 핀의 조합.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #431407, #ea580c)",
  },
  {
    slug: "line-mask-text",
    category: "scroll",
    title: "텍스트 라인 마스크",
    tag: "문단이 줄 단위로 슬라이드업",
    description:
      "제목·문단이 줄 단위로 마스크 뒤에서 아래에서 위로 밀려 올라온다. " +
      "overflow: hidden + yPercent 스태거.",
    usedSkills: ["gsap-dom-core", "gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #1e1b4b, #4338ca)",
  },
  {
    slug: "bg-color-transition",
    category: "scroll",
    title: "배경색 스크롤 전환",
    tag: "섹션마다 배경 크로스페이드",
    description:
      "섹션이 뷰포트 중앙을 지날 때마다 페이지 배경색이 부드럽게 다음 색으로 " +
      "바뀐다. onToggle + backgroundColor 트윈.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #0c4a6e, #b45309)",
  },
  {
    slug: "svg-path-draw",
    category: "svg",
    title: "SVG 경로 그리기",
    tag: "스크롤에 따라 선이 그려짐",
    description:
      "연결선·서명·아이콘 윤곽이 스크롤 진행에 맞춰 그려진다. " +
      "strokeDasharray/strokeDashoffset 스크럽.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #164e63, #0d9488)",
  },
  {
    slug: "scroll-direction-header",
    category: "scroll",
    title: "스크롤 방향 헤더",
    tag: "내리면 숨고 올리면 나타남",
    description:
      "아래로 스크롤하면 상단 헤더가 위로 사라지고, 위로 스크롤하면 다시 " +
      "내려온다. self.direction 판정.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #1e293b, #7c3aed)",
  },
  {
    slug: "parallax-image-grid",
    category: "scroll",
    title: "패럴랙스 이미지 그리드",
    tag: "칸마다 스크롤 속도가 다름",
    description:
      "갤러리 그리드의 각 칸이 서로 다른 속도로 스크롤되어 어긋나며 흐른다 " +
      "(Pinterest 스타일). 칸별 yPercent 스크럽.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #3b0764, #db2777)",
  },
  {
    slug: "chart-bar-grow",
    category: "scroll",
    title: "차트 바 성장",
    tag: "막대그래프가 자라남",
    description:
      "차트 섹션이 보이면 막대가 0에서 목표 높이까지 순서대로 자라나고 " +
      "수치가 함께 카운트업된다. scaleY + stagger.",
    usedSkills: ["gsap-dom-core", "gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #052e16, #16a34a)",
  },

  // ─── 모션 (Tween·Timeline·Stagger) ───────────────────────
  {
    slug: "word-rotator",
    category: "motion",
    title: "단어 교체 루프",
    tag: "문장의 한 단어만 계속 바뀜",
    description:
      '"We build ___" 처럼 문장의 한 단어가 위로 사라지고 다음 단어가 올라오는 ' +
      "무한 반복 타임라인. repeat: -1.",
    usedSkills: ["gsap-dom-core", "gsap-timeline-sequence"],
    accent: "linear-gradient(160deg, #312e81, #6366f1)",
  },
  {
    slug: "loader-sequence",
    category: "motion",
    title: "로더 → 콘텐츠 공개",
    tag: "타임라인 순차 연출",
    description:
      "로고 등장 → 프로그레스 바 채움 → 오버레이 분할 이탈 → 콘텐츠 stagger. " +
      "하나의 마스터 타임라인이 오프닝 전체를 제어.",
    usedSkills: ["gsap-timeline-sequence", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #0f172a, #475569)",
  },
  {
    slug: "stagger-grid-from",
    category: "motion",
    title: "그리드 stagger 방향",
    tag: "가운데/모서리/대각선에서 퍼짐",
    description:
      "타일 그리드가 등장하는 stagger의 from(center·edges·end·[행,열])과 " +
      "grid 옵션을 버튼으로 바꿔가며 비교한다.",
    usedSkills: ["gsap-dom-core"],
    accent: "linear-gradient(160deg, #1e1b4b, #7c3aed)",
  },
  {
    slug: "responsive-motion-switch",
    category: "motion",
    title: "반응형 모션 분기",
    tag: "화면 크기별 다른 애니메이션",
    description:
      "gsap.matchMedia()로 데스크탑은 좌우 슬라이드+회전, 모바일은 " +
      "가벼운 페이드업으로 분기한다. 창 크기를 바꾸면 즉시 전환.",
    usedSkills: ["gsap-dom-core", "gsap-dom-motion"],
    accent: "linear-gradient(160deg, #164e63, #0e7490)",
  },

  // ─── 스크롤 효과 (추가) ──────────────────────────────────
  {
    slug: "section-snap-panels",
    category: "scroll",
    title: "섹션 스냅 패널",
    tag: "풀스크린 섹션이 스냅됨",
    description:
      "세로로 쌓인 풀스크린 패널이 스크롤 시 한 섹션씩 딱 맞게 스냅되고 " +
      "각 패널 콘텐츠가 진입 시 등장한다. ScrollTrigger snap.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #0c4a6e, #0ea5e9)",
  },
  {
    slug: "pinned-caption-swap",
    category: "scroll",
    title: "핀 + 캡션 전환",
    tag: "고정된 비주얼, 바뀌는 설명",
    description:
      "왼쪽 비주얼이 핀으로 고정된 채, 오른쪽 설명 텍스트가 스크롤에 따라 " +
      "단계별로 교체되고 비주얼 색도 함께 바뀐다.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(160deg, #422006, #d97706)",
  },
  {
    slug: "zoom-out-reveal",
    category: "scroll",
    title: "줌아웃 공개",
    tag: "확대된 조각에서 전체로",
    description:
      "화면을 꽉 채운 확대 상태에서 스크롤하면 축소되며 전체 레이아웃(그리드)이 " +
      "드러난다. scale + 핀 스크럽.",
    usedSkills: ["gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #3b0764, #a21caf)",
  },

  // ─── 포인터 인터랙션 ────────────────────────────────────
  {
    slug: "magnetic-nav",
    category: "pointer",
    title: "마그네틱 내비게이션",
    tag: "메뉴 항목이 커서에 끌림",
    description:
      "내비 항목마다 커서가 가까워지면 그쪽으로 당겨졌다가 벗어나면 " +
      "elastic으로 복귀한다. quickTo로 항목당 트윈 재사용.",
    usedSkills: ["gsap-dom-interaction"],
    accent: "linear-gradient(160deg, #1e293b, #4f46e5)",
  },
  {
    slug: "cursor-spotlight",
    category: "pointer",
    title: "커서 스포트라이트",
    tag: "커서 주변만 밝아짐",
    description:
      "어두운 콘텐츠 위에서 커서를 따라 원형 라이트가 부드럽게 움직이며 " +
      "그 부분만 드러난다. radial-gradient 마스크 + quickTo.",
    usedSkills: ["gsap-dom-interaction"],
    accent: "linear-gradient(160deg, #0a0a0a, #3f3f46)",
  },
  {
    slug: "tilt-card-grid",
    category: "pointer",
    title: "3D 틸트 카드 그리드",
    tag: "커서 위치로 카드가 기울어짐",
    description:
      "카드 위에서 커서 위치에 따라 rotateX/rotateY로 3D 기울기와 광택 " +
      "하이라이트가 움직인다. 벗어나면 원위치.",
    usedSkills: ["gsap-dom-interaction"],
    accent: "linear-gradient(160deg, #500724, #e11d48)",
  },

  // ─── SVG 애니메이션 (추가) ──────────────────────────────
  {
    slug: "signature-draw",
    category: "svg",
    title: "서명 그리기",
    tag: "손글씨가 써지듯 그려짐",
    description:
      "필기체 서명 path가 뷰포트 진입 시 한 획씩 그려진다. " +
      "getTotalLength + strokeDashoffset 타임라인.",
    usedSkills: ["gsap-dom-core", "gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #1c1917, #57534e)",
    caveat:
      "획 순서 = 그려지는 순서. 디자이너 SVG를 쓸 때 export 시 path 순서를 " +
      "맞춰야 한다. fill이 있는 글자는 stroke만으로는 표현이 안 됨.",
  },
  {
    slug: "morph-blob",
    category: "svg",
    title: "블롭 모핑",
    tag: "유기적 도형이 흐물거림",
    description:
      "SVG path의 d 속성을 여러 블롭 모양 사이로 무한 보간해 액체처럼 " +
      "일렁이게 한다. path 데이터 트윈.",
    usedSkills: ["gsap-dom-core"],
    accent: "linear-gradient(160deg, #172554, #2563eb)",
    caveat:
      "커맨드 개수·종류가 같은 path끼리만 보간된다. 별→원처럼 구조가 다르면 " +
      "MorphSVG(유료) 또는 flubber 같은 경로 리샘플링 라이브러리가 필요.",
  },
  {
    slug: "icon-line-trace",
    category: "svg",
    title: "아이콘 라인 트레이스",
    tag: "아이콘 윤곽이 순서대로 그려짐",
    description:
      "여러 라인 아이콘의 stroke가 stagger로 차례차례 그려지고, 다 그려지면 " +
      "채워진다. 온보딩·기능 소개에.",
    usedSkills: ["gsap-dom-core", "gsap-dom-scrolltrigger"],
    accent: "linear-gradient(160deg, #083344, #14b8a6)",
  },
];

/** slug로 항목을 찾는다. 없으면 undefined — 호출부가 404를 결정한다. */
export function findLabEntry(slug: string): LabEntry | undefined {
  return LAB_ENTRIES.find((entry) => entry.slug === slug);
}

/** 카테고리로 거른 목록. 정의 순서를 유지한다. */
export function getLabEntriesByCategory(category: LabCategory): LabEntry[] {
  return LAB_ENTRIES.filter((entry) => entry.category === category);
}

/** 표시 순서가 고정된 카테고리 목록. */
export const LAB_CATEGORY_ORDER: LabCategory[] = [
  "scroll",
  "motion",
  "pointer",
  "svg",
  "landing",
];
