/**
 * `/gsap-lab` — 순수 DOM GSAP 랩.
 *
 * 기존 R3F 갤러리(`src/showcases/*`)와 완전히 분리돼 있다. 이쪽은 캔버스도
 * 셸 Contract도 없고, 가상 SaaS 제품 "Fluxnote"를 소재로 삼는다.
 * 이미지가 필요한 자리는 전부 배경색만 다른 `<div>`다.
 *
 * 항목은 카테고리로 나뉜다.
 * - `motion`: Tween·Timeline·Stagger — 스크롤과 무관한 시간 기반 애니메이션
 * - `scroll`: ScrollTrigger·Pin·Scrub·Parallax·가로 스크롤
 * - `pointer`: 마우스/포인터 위치에 반응하는 인터랙션
 * - `svg`: SVG path·stroke·shape 애니메이션
 *
 * 완성형 랜딩페이지는 이 랩이 아니라 `/landings` 트랙에 있다.
 */

/** 랩 항목의 카테고리. */
export type LabCategory = 'motion' | 'scroll' | 'pointer' | 'svg';

/** 카테고리 표시명·설명. */
export const LAB_CATEGORY_META: Record<
  LabCategory,
  { label: string; description: string }
> = {
  motion: {
    label: '모션 (Tween·Timeline·Stagger)',
    description:
      '스크롤과 무관하게 시간으로 재생되는 애니메이션. 타임라인 시퀀스, ' +
      'stagger 등장, 재생 제어, 반응형 분기.',
  },
  scroll: {
    label: '스크롤 효과 (ScrollTrigger·Pin·Scrub·Parallax)',
    description:
      '스크롤 위치에 묶인 애니메이션. 패럴랙스·스크럽·핀·가로 스크롤·' +
      '순차/동시 등장·진행 인디케이터.',
  },
  pointer: {
    label: '포인터 인터랙션',
    description:
      '마우스/포인터 위치에 따라 요소가 이동·회전·왜곡되는 장식 인터랙션. ' +
      '데스크탑 전용(matchMedia).',
  },
  svg: {
    label: 'SVG 애니메이션',
    description:
      'SVG path 그리기, shape 모핑, stroke 애니메이션. 유료 플러그인 없이 ' +
      'SVG 속성만 사용.',
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
  /**
   * 이 데모를 만들 때 `usedSkills`의 각 skill을 실제로 어떻게 썼는지 서술한다.
   * 어떤 API·훅·옵션을 어떤 함정을 피하며 썼는지 2~4문장. 상세 페이지의
   * "스킬 활용 & 프롬프트" 섹션에 노출. 생략 가능.
   */
  skillUsage?: string;
  /**
   * 이 데모를 Claude Code로 만든다면 던질 법한 자연어 요청 예시.
   * 원하는 연출·조작·함정 회피 지시를 구체적으로 적는다. 복사 버튼과 함께
   * 노출. 생략 가능.
   */
  promptExample?: string;
}

export const LAB_ENTRIES: LabEntry[] = [
  // ─── 스크롤 효과 데모 ─────────────────────────────────────
  {
    slug: 'parallax-layers',
    category: 'scroll',
    title: '패럴랙스 레이어',
    tag: '레이어별 속도차',
    description:
      '배경·중경·전경이 서로 다른 속도로 스크롤되며 깊이감을 만든다. ' +
      'yPercent 스크럽 + ease: none.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #0f172a, #334155)',
    skillUsage:
      'gsap-dom-scrolltrigger: 레이어마다 data-speed를 두고 하나의 ScrollTrigger에서 ' +
      'scrub로 스크롤에 직결, 각 레이어를 yPercent로 서로 다른 양만큼 이동시켰다. ' +
      'ease: none으로 스크롤과 1:1로 붙였고, gsap.registerPlugin(ScrollTrigger)는 ' +
      '모듈 스코프에서 1회만 호출했다. useGSAP 안에서 만들어 언마운트 시 정리되게 했다.',
    promptExample:
      '배경·중경·전경 3개 레이어가 스크롤에 따라 서로 다른 속도로 흐르며 깊이감을 ' +
      '만드는 패럴랙스 섹션을 만들어줘. 각 레이어에 data-speed를 주고 하나의 ' +
      'ScrollTrigger에서 scrub로 스크롤에 직결, yPercent로 이동시켜. ease는 none으로 ' +
      '스크롤과 1:1. registerPlugin은 모듈 스코프에서 1회만, ScrollTrigger는 useGSAP ' +
      '안에서 만들어서 페이지 오갈 때 중복 안 되게.',
  },
  {
    slug: 'hero-to-section',
    category: 'scroll',
    title: '히어로 → 섹션 이동',
    tag: '크기·위치 변형',
    description:
      '히어로에 크게 자리한 이미지가 스크롤에 따라 축소되며 다음 섹션의 ' +
      '썸네일 위치로 이동한다. 핀 + 스크럽.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #1e1b4b, #be185d)',
    skillUsage:
      'gsap-dom-scrolltrigger: 히어로를 pin으로 고정하고 scrub 구간에서 이미지의 ' +
      'scale·위치를 다음 섹션 썸네일 자리로 보간했다. 이미지 로드 후 ' +
      'ScrollTrigger.refresh()로 트리거 위치를 다시 잡았다. gsap-dom-core: 크기·위치 ' +
      '전환은 fromTo로 시작/끝 상태를 명시하고, position parameter로 여러 트윈의 ' +
      '타이밍을 맞췄다.',
    promptExample:
      '히어로에 크게 자리한 이미지가 스크롤에 따라 축소되며 다음 섹션의 썸네일 ' +
      '위치로 이동하는 연출을 만들어줘. 히어로를 pin으로 고정하고 scrub로 스크롤에 ' +
      '직결, scale과 위치를 fromTo로 보간해. 이미지가 늦게 로드되면 트리거 위치가 ' +
      '어긋나니까 decode 후 ScrollTrigger.refresh() 한 번 더 불러줘.',
  },
  {
    slug: 'reveal-sequence',
    category: 'scroll',
    title: '순차 등장',
    tag: '하나씩 올라오기',
    description:
      '"스크롤을 내려주세요" 안내 후, 콘텐츠 카드가 아래에서 하나씩 ' +
      '시간차로 올라온다. stagger + toggleActions.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #052e16, #15803d)',
    skillUsage:
      'gsap-dom-scrolltrigger: 섹션이 뷰포트에 들어올 때 toggleActions로 한 번만 ' +
      '재생하고(play none none none), 스크롤을 되돌려도 다시 재생되지 않게 했다. ' +
      'gsap-dom-core: 카드 등장은 from이 아니라 CSS opacity:0 초기값 + to로 짜 ' +
      'FOUC를 피했고, stagger로 카드가 시간차로 올라오게 했다.',
    promptExample:
      "'스크롤을 내려주세요' 안내 후, 콘텐츠 카드가 아래에서 하나씩 시간차로 " +
      '올라오는 순차 등장 섹션을 만들어줘. 섹션이 뷰포트에 들어올 때 toggleActions로 ' +
      '한 번만 재생하고 되돌려도 재생 안 되게. 카드는 CSS opacity:0을 초기값으로 두고 ' +
      'to + stagger로 올려서 FOUC 없게.',
  },
  {
    slug: 'reveal-together',
    category: 'scroll',
    title: '동시 등장',
    tag: '한꺼번에 올라오기',
    description:
      '섹션이 뷰포트에 들어오는 순간 모든 콘텐츠가 동시에 페이드업한다. ' +
      '순차 등장과의 차이를 보여준다.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #422006, #ca8a04)',
    skillUsage:
      'gsap-dom-scrolltrigger: 섹션 진입 시 toggleActions로 1회 재생하되, 순차 등장과 ' +
      '달리 stagger 없이 모든 콘텐츠를 같은 트윈에 넣어 동시에 페이드업시켰다. ' +
      '트리거는 섹션 자체(top 80%)로 잡았다.',
    promptExample:
      '섹션이 뷰포트에 들어오는 순간 모든 콘텐츠가 동시에 페이드업하는 섹션을 ' +
      '만들어줘. 순차 등장(stagger)이랑 대조되게 stagger 없이 한 트윈으로 전부 ' +
      '같이 올려. 섹션 진입 시 toggleActions로 1회만 재생.',
  },
  {
    slug: 'pin-progress',
    category: 'scroll',
    title: '핀 스크롤링',
    tag: '섹션 고정 + 진행',
    description:
      '섹션이 화면에 고정된 채, 계속 스크롤하면 내부 단계가 순서대로 진행되고 ' +
      '끝나면 고정이 풀린다.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #172554, #1d4ed8)',
    skillUsage:
      'gsap-dom-scrolltrigger: 섹션을 pin으로 고정하고 pinSpacing으로 뒤 콘텐츠가 ' +
      '밀리는 만큼 공간을 확보했다. scrub 구간의 진행률을 top-level 타임라인에 묶어 ' +
      '내부 단계를 순서대로 진행시켰다(중첩 타임라인엔 scrollTrigger를 붙이지 않음). ' +
      'gsap-dom-core: 단계 전환은 position parameter와 라벨로 정렬했다.',
    promptExample:
      '섹션이 화면에 고정된 채로, 계속 스크롤하면 내부 단계가 순서대로 진행되고 ' +
      '끝나면 고정이 풀리는 핀 스크롤 섹션을 만들어줘. pin + pinSpacing 쓰고, scrub ' +
      '진행률을 top-level 타임라인에 묶어. 단계 전환은 라벨로 정렬하고 중첩 타임라인엔 ' +
      'scrollTrigger 붙이지 마.',
  },
  {
    slug: 'horizontal-scroll',
    category: 'scroll',
    title: '가로 스크롤',
    tag: '세로 스크롤 → 가로 이동',
    description:
      '섹션을 핀 고정하고, 세로 스크롤 입력을 가로 트랙 이동으로 바꾼다. ' +
      '갤러리·타임라인에 자주 쓰인다.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #500724, #db2777)',
    caveat:
      '핀 구간에서는 스크롤바 위치와 실제 콘텐츠가 어긋나 사용자가 혼란스러울 ' +
      '수 있다. 트랙이 너무 길면 이탈률이 오른다(패널 5~7개 권장).',
    skillUsage:
      'gsap-dom-scrolltrigger: 트랙 컨테이너를 pin으로 고정하고, 세로 스크롤 길이를 ' +
      "가로 트랙 너비만큼 end에 잡아(end: () => '+=' + track.scrollWidth) scrub로 " +
      'xPercent 이동에 직결했다. ignoreMobileResize로 모바일 주소창 리사이즈 오작동을 ' +
      '막았다.',
    promptExample:
      '세로 스크롤 입력을 가로 트랙 이동으로 바꾸는 가로 스크롤 섹션을 만들어줘. ' +
      '패널은 5~7개. 트랙을 pin으로 고정하고 end를 트랙 scrollWidth만큼 잡아서 scrub로 ' +
      'xPercent 이동. 모바일에서 주소창 리사이즈로 튀지 않게 ignoreMobileResize 켜줘.',
  },
  {
    slug: 'progress-indicator',
    category: 'scroll',
    title: '진행 인디케이터',
    tag: '진행바 + 섹션 하이라이트',
    description:
      '상단 진행바가 문서 스크롤에 따라 차오르고, 현재 보고 있는 섹션의 ' +
      '목차 항목이 활성화된다. onUpdate + onToggle.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #083344, #0891b2)',
    skillUsage:
      'gsap-dom-scrolltrigger: 문서 전체를 트리거로 하나 만들어 onUpdate에서 ' +
      'self.progress를 진행바 scaleX에 반영했다(width 대신 transform이라 리플로우 ' +
      '없음). 섹션마다 별도 트리거를 두고 onToggle에서 해당 목차 항목을 활성화했다.',
    promptExample:
      '상단 진행바가 문서 스크롤에 따라 차오르고, 현재 보고 있는 섹션의 목차 항목이 ' +
      '활성화되는 진행 인디케이터를 만들어줘. 진행바는 문서 전체 트리거의 onUpdate에서 ' +
      'self.progress를 scaleX로 반영(width 말고 transform). 섹션별 트리거 onToggle로 ' +
      '목차 하이라이트.',
  },
  {
    slug: 'kinetic-typography',
    category: 'scroll',
    title: '키네틱 타이포',
    tag: '스크롤로 글자 변형',
    description:
      '스크롤에 따라 큰 제목의 자간·크기·위치가 변하고, 글자가 하나씩 ' +
      '흩어졌다 모인다. scrub + 글자 분할.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #1c1917, #78716c)',
    caveat:
      '글자를 <span>으로 쪼개면 스크린리더가 한 글자씩 읽는다 — 원문을 ' +
      'aria-label로 병기해야 한다. 긴 문구는 글자 수만큼 트윈이 생겨 무겁다.',
    skillUsage:
      'gsap-dom-scrolltrigger: 긴 섹션을 scrub로 잡아 제목의 자간·크기·위치를 스크롤 ' +
      '진행률에 직결했다. gsap-dom-core: 제목을 글자 단위 <span>으로 쪼개(원문은 ' +
      'aria-label, span은 aria-hidden) per-char x/y/rotation을 stagger로 줬다. ' +
      'letterSpacing 트윈은 리플로우를 유발하므로 쓰지 않고 transform만 만졌다.',
    promptExample:
      '스크롤에 따라 큰 제목의 자간·크기·위치가 변하고, 글자가 하나씩 흩어졌다 ' +
      '모이는 키네틱 타이포를 만들어줘. 긴 섹션을 scrub로 잡고, 제목을 글자 단위 ' +
      '<span>으로 쪼개서 per-char x/y/rotation을 stagger로. 원문은 aria-label로 ' +
      '병기하고 쪼갠 span은 aria-hidden. letterSpacing 트윈 말고 transform만 써.',
  },
  {
    slug: 'image-mask-reveal',
    category: 'scroll',
    title: '이미지 마스크 공개',
    tag: '클립패스 확장',
    description:
      '스크롤하면 좁은 띠였던 이미지 블록이 clip-path로 화면을 채우며 ' +
      '펼쳐진다. scrub로 스크롤에 직결.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #4a044e, #c026d3)',
    skillUsage:
      'gsap-dom-scrolltrigger: 좁은 띠 상태의 이미지 블록을 scrub로 스크롤에 직결해 ' +
      'clip-path(inset)를 0까지 열어 화면을 채우게 했다. clip-path는 합성 단계라 ' +
      '리플로우 없이 부드럽다. 트리거는 블록 자체(top center → bottom center).',
    promptExample:
      '스크롤하면 좁은 띠였던 이미지 블록이 clip-path로 화면을 채우며 펼쳐지는 ' +
      '마스크 공개 연출을 만들어줘. scrub로 스크롤에 직결하고, clip-path inset을 ' +
      '0까지 여는 방식으로 — width/height 말고 clip-path라 리플로우 없게.',
  },
  {
    slug: 'counter-on-scroll',
    category: 'scroll',
    title: '숫자 카운트업',
    tag: '지표가 뷰포트 진입 시 증가',
    description:
      '통계 섹션이 보이면 0에서 목표값까지 숫자가 빠르게 증가한다. ' +
      'textContent 트윈 + toggleActions.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #14532d, #65a30d)',
    skillUsage:
      'gsap-dom-scrolltrigger: 통계 섹션 진입 시 toggleActions로 카운트 트윈을 1회 ' +
      '재생했다. gsap-dom-core: 숫자는 { val: 0 } 객체를 target에서 목표값으로 ' +
      '트윈하고 onUpdate에서 textContent에 반올림해 찍었다(DOM 텍스트 직접 트윈 대신).',
    promptExample:
      '통계 섹션이 보이면 0에서 목표값까지 숫자가 빠르게 증가하는 카운트업을 ' +
      '만들어줘. 섹션 진입 시 toggleActions로 1회 재생. 숫자는 { val: 0 } 객체를 ' +
      '트윈하고 onUpdate에서 Math.round해서 textContent에 찍어.',
  },
  {
    slug: 'sticky-stack-cards',
    category: 'scroll',
    title: '스티키 스택 카드',
    tag: '카드가 쌓이며 넘어감',
    description:
      '카드들이 화면 중앙에 차례로 고정되며 겹쳐 쌓이고, 다음 카드가 ' +
      '위로 올라와 덮는다. 여러 핀의 조합.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #431407, #ea580c)',
    skillUsage:
      'gsap-dom-scrolltrigger: 카드마다 pin 트리거를 두고 화면 중앙에 차례로 고정, ' +
      '다음 카드가 올라와 덮게 했다(여러 핀의 조합). gsap-dom-core: 겹치는 동안 앞 ' +
      '카드는 scale·brightness를 살짝 낮춰 뒤로 물러난 느낌을 줬다.',
    promptExample:
      '카드들이 화면 중앙에 차례로 고정되며 겹쳐 쌓이고, 다음 카드가 위로 올라와 ' +
      '덮는 스티키 스택을 만들어줘. 카드마다 pin 트리거 하나씩. 겹칠 때 앞 카드는 ' +
      'scale·brightness 살짝 낮춰서 뒤로 물러나 보이게.',
  },
  {
    slug: 'line-mask-text',
    category: 'scroll',
    title: '텍스트 라인 마스크',
    tag: '문단이 줄 단위로 슬라이드업',
    description:
      '제목·문단이 줄 단위로 마스크 뒤에서 아래에서 위로 밀려 올라온다. ' +
      'overflow: hidden + yPercent 스태거.',
    usedSkills: ['gsap-dom-core', 'gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #1e1b4b, #4338ca)',
    skillUsage:
      'gsap-dom-core: 각 줄을 overflow:hidden 래퍼로 감싸고 안쪽 텍스트를 yPercent ' +
      '100에서 0으로 올려 마스크 뒤에서 슬라이드업하게 했다. 줄 단위 stagger로 ' +
      '차례로. gsap-dom-scrolltrigger: 문단 진입 시 toggleActions로 1회 재생.',
    promptExample:
      '제목·문단이 줄 단위로 마스크 뒤에서 아래에서 위로 밀려 올라오는 라인 마스크를 ' +
      '만들어줘. 각 줄을 overflow:hidden 래퍼로 감싸고 안쪽 텍스트를 yPercent 100→0으로 ' +
      '올려. 줄 단위 stagger, 문단 진입 시 1회 재생.',
  },
  {
    slug: 'bg-color-transition',
    category: 'scroll',
    title: '배경색 스크롤 전환',
    tag: '섹션마다 배경 크로스페이드',
    description:
      '섹션이 뷰포트 중앙을 지날 때마다 페이지 배경색이 부드럽게 다음 색으로 ' +
      '바뀐다. onToggle + backgroundColor 트윈.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #0c4a6e, #b45309)',
    skillUsage:
      'gsap-dom-scrolltrigger: 섹션마다 트리거를 두고 onToggle(또는 onEnter/onEnterBack)에서 ' +
      "페이지 배경색을 다음 색으로 트윈했다. start를 'top center'로 잡아 섹션이 " +
      '뷰포트 중앙을 지날 때 전환되게 했다.',
    promptExample:
      '섹션이 뷰포트 중앙을 지날 때마다 페이지 배경색이 부드럽게 다음 색으로 바뀌는 ' +
      '연출을 만들어줘. 섹션별 트리거 onToggle에서 backgroundColor 트윈, start는 ' +
      "'top center'.",
  },
  {
    slug: 'svg-path-draw',
    category: 'svg',
    title: 'SVG 경로 그리기',
    tag: '스크롤에 따라 선이 그려짐',
    description:
      '연결선·서명·아이콘 윤곽이 스크롤 진행에 맞춰 그려진다. ' +
      'strokeDasharray/strokeDashoffset 스크럽.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #164e63, #0d9488)',
    skillUsage:
      'gsap-dom-scrolltrigger: path의 getTotalLength()로 strokeDasharray·strokeDashoffset을 ' +
      '세팅하고, scrub로 스크롤 진행률을 offset에 직결해 선이 그려지게 했다. ' +
      'SVG는 width/height 속성을 명시해 로드 후 트리거 위치가 어긋나지 않게 했다.',
    promptExample:
      '연결선·서명·아이콘 윤곽이 스크롤 진행에 맞춰 그려지는 SVG 경로 애니메이션을 ' +
      '만들어줘. getTotalLength()로 strokeDasharray/Offset 세팅하고 scrub로 offset을 ' +
      '스크롤에 직결. SVG엔 width/height 속성 명시해서 트리거 위치 안 밀리게.',
  },
  {
    slug: 'scroll-direction-header',
    category: 'scroll',
    title: '스크롤 방향 헤더',
    tag: '내리면 숨고 올리면 나타남',
    description:
      '아래로 스크롤하면 상단 헤더가 위로 사라지고, 위로 스크롤하면 다시 ' +
      '내려온다. self.direction 판정.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #1e293b, #7c3aed)',
    skillUsage:
      'gsap-dom-scrolltrigger: onUpdate에서 self.direction(1=아래, -1=위)을 읽어 ' +
      '헤더를 yPercent -100(숨김)·0(표시)으로 트윈했다. quickTo로 방향 전환마다 ' +
      '트윈을 재사용해 폭증을 막았다.',
    promptExample:
      '아래로 스크롤하면 상단 헤더가 위로 사라지고, 위로 스크롤하면 다시 내려오는 ' +
      '헤더를 만들어줘. ScrollTrigger onUpdate에서 self.direction 판정해서 yPercent ' +
      '-100/0으로. 매 스크롤마다 gsap.to 새로 만들지 말고 quickTo 재사용해.',
  },
  {
    slug: 'parallax-image-grid',
    category: 'scroll',
    title: '패럴랙스 이미지 그리드',
    tag: '칸마다 스크롤 속도가 다름',
    description:
      '갤러리 그리드의 각 칸이 서로 다른 속도로 스크롤되어 어긋나며 흐른다 ' +
      '(Pinterest 스타일). 칸별 yPercent 스크럽.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #3b0764, #db2777)',
    skillUsage:
      'gsap-dom-scrolltrigger: 그리드 칸마다 data-speed를 두고 각각 별도 트윈으로 ' +
      'yPercent를 scrub, ease: none으로 스크롤에 직결했다. 칸이 많아 트윈이 늘어나므로 ' +
      'gsap.utils.toArray로 한 번에 순회해 생성했다.',
    promptExample:
      '갤러리 그리드의 각 칸이 서로 다른 속도로 스크롤되어 어긋나며 흐르는 ' +
      '(Pinterest 스타일) 연출을 만들어줘. 칸마다 data-speed 주고 각각 yPercent scrub, ' +
      'ease none. toArray로 순회해서 트윈 생성.',
  },
  {
    slug: 'chart-bar-grow',
    category: 'scroll',
    title: '차트 바 성장',
    tag: '막대그래프가 자라남',
    description:
      '차트 섹션이 보이면 막대가 0에서 목표 높이까지 순서대로 자라나고 ' +
      '수치가 함께 카운트업된다. scaleY + stagger.',
    usedSkills: ['gsap-dom-core', 'gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #052e16, #16a34a)',
    skillUsage:
      'gsap-dom-core: 막대는 transform-origin: bottom + scaleY 0→목표로 트윈하고 ' +
      'stagger로 순서를 줬다. 수치는 { val } 객체 트윈 + onUpdate로 카운트업. ' +
      'gsap-dom-scrolltrigger: 차트 섹션 진입 시 toggleActions로 1회 재생.',
    promptExample:
      '차트 섹션이 보이면 막대가 0에서 목표 높이까지 순서대로 자라나고 수치가 함께 ' +
      '카운트업되는 연출을 만들어줘. 막대는 transform-origin bottom + scaleY 트윈 + ' +
      'stagger. 수치는 { val } 객체 트윈. 섹션 진입 시 1회 재생.',
  },

  // ─── 모션 (Tween·Timeline·Stagger) ───────────────────────
  {
    slug: 'word-rotator',
    category: 'motion',
    title: '단어 교체 루프',
    tag: '문장의 한 단어만 계속 바뀜',
    description:
      '"We build ___" 처럼 문장의 한 단어가 위로 사라지고 다음 단어가 올라오는 ' +
      '무한 반복 타임라인. repeat: -1.',
    usedSkills: ['gsap-dom-core', 'gsap-timeline-sequence'],
    accent: 'linear-gradient(160deg, #312e81, #6366f1)',
    skillUsage:
      'gsap-timeline-sequence: repeat: -1 무한 타임라인 하나로 현재 단어를 yPercent ' +
      '-100으로 올려 보내고 다음 단어를 아래에서 올렸다. 단어 컨테이너는 ' +
      'overflow:hidden. gsap-dom-core: defaults로 공통 duration·ease를 주고 각 단어 ' +
      '구간을 라벨로 정렬해 나중에 단어를 추가해도 타이밍이 안 밀리게 했다.',
    promptExample:
      "'We build ___' 처럼 문장의 한 단어가 위로 사라지고 다음 단어가 올라오는 무한 " +
      '반복을 만들어줘. repeat: -1 타임라인 하나로, 단어 컨테이너는 overflow:hidden. ' +
      '각 단어 구간은 상대값 말고 라벨로 정렬해서 단어 추가해도 안 밀리게.',
  },
  {
    slug: 'loader-sequence',
    category: 'motion',
    title: '로더 → 콘텐츠 공개',
    tag: '타임라인 순차 연출',
    description:
      '로고 등장 → 프로그레스 바 채움 → 오버레이 분할 이탈 → 콘텐츠 stagger. ' +
      '하나의 마스터 타임라인이 오프닝 전체를 제어.',
    usedSkills: ['gsap-timeline-sequence', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #0f172a, #475569)',
    skillUsage:
      'gsap-timeline-sequence: 하나의 마스터 타임라인이 로고 등장 → 프로그레스 바 채움 → ' +
      '오버레이 분할 이탈 → 콘텐츠 stagger를 position parameter와 라벨로 엮는다. ' +
      '생성자 duration이 아니라 defaults로 자식 공통 길이를 줬다. gsap-dom-core: ' +
      '콘텐츠 등장은 CSS 초기값 + to로 FOUC를 피했다.',
    promptExample:
      '로고 등장 → 프로그레스 바 채움 → 오버레이 분할 이탈 → 콘텐츠 stagger 순서로 ' +
      '펼쳐지는 오프닝 로더를 하나의 마스터 타임라인으로 만들어줘. 자식 공통 길이는 ' +
      '생성자 duration 말고 defaults로. 콘텐츠는 CSS opacity:0 초기값 + to로 FOUC 없게.',
  },
  {
    slug: 'stagger-grid-from',
    category: 'motion',
    title: '그리드 stagger 방향',
    tag: '가운데/모서리/대각선에서 퍼짐',
    description:
      '타일 그리드가 등장하는 stagger의 from(center·edges·end·[행,열])과 ' +
      'grid 옵션을 버튼으로 바꿔가며 비교한다.',
    usedSkills: ['gsap-dom-core'],
    accent: 'linear-gradient(160deg, #1e1b4b, #7c3aed)',
    skillUsage:
      'gsap-dom-core: stagger의 from(center·edges·end·[행,열])과 grid 옵션을 버튼으로 ' +
      '바꿔가며 같은 타일 그리드에 재적용한다. 재적용 시 이전 트윈을 kill하고 ' +
      'clearProps로 초기화한 뒤 새 stagger를 건다.',
    promptExample:
      '타일 그리드 등장 stagger의 from(center·edges·end·[행,열])과 grid 옵션을 버튼으로 ' +
      '바꿔가며 비교하는 데모를 만들어줘. 재적용할 때 이전 트윈 kill + clearProps로 ' +
      '초기화하고 새 stagger 걸어.',
  },
  {
    slug: 'responsive-motion-switch',
    category: 'motion',
    title: '반응형 모션 분기',
    tag: '화면 크기별 다른 애니메이션',
    description:
      'gsap.matchMedia()로 데스크탑은 좌우 슬라이드+회전, 모바일은 ' +
      '가벼운 페이드업으로 분기한다. 창 크기를 바꾸면 즉시 전환.',
    usedSkills: ['gsap-dom-core', 'gsap-dom-motion'],
    accent: 'linear-gradient(160deg, #164e63, #0e7490)',
    skillUsage:
      'gsap-dom-motion: gsap.matchMedia()로 (min-width: 768px)와 그 외를 분기해 ' +
      '데스크탑은 좌우 슬라이드+회전, 모바일은 가벼운 페이드업을 건다. matchMedia는 ' +
      '창 크기 변화 시 자동으로 해당 분기의 트윈을 revert·재생성한다. gsap-dom-core: ' +
      '각 분기의 트윈은 defaults로 공통 이징을 공유한다.',
    promptExample:
      'gsap.matchMedia()로 화면 크기별 다른 등장 애니메이션을 분기하는 데모를 ' +
      '만들어줘. 데스크탑(min-width 768px)은 좌우 슬라이드+회전, 모바일은 페이드업. ' +
      '창 크기 바꾸면 즉시 전환되는 걸 보여주고.',
  },

  // ─── 스크롤 효과 (추가) ──────────────────────────────────
  {
    slug: 'section-snap-panels',
    category: 'scroll',
    title: '섹션 스냅 패널',
    tag: '풀스크린 섹션이 스냅됨',
    description:
      '세로로 쌓인 풀스크린 패널이 스크롤 시 한 섹션씩 딱 맞게 스냅되고 ' +
      '각 패널 콘텐츠가 진입 시 등장한다. ScrollTrigger snap.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #0c4a6e, #0ea5e9)',
    skillUsage:
      'gsap-dom-scrolltrigger: ScrollTrigger.snap({ snapTo: 1 / (n-1), duration })로 ' +
      '풀스크린 패널이 한 섹션씩 딱 맞게 스냅되게 하고, 각 패널에 별도 트리거를 둬 ' +
      '진입 시 콘텐츠를 등장시켰다.',
    promptExample:
      '세로로 쌓인 풀스크린 패널이 스크롤 시 한 섹션씩 딱 맞게 스냅되고, 각 패널 ' +
      '콘텐츠가 진입 시 등장하는 데모를 만들어줘. ScrollTrigger snap 쓰고, 패널별 ' +
      '트리거로 콘텐츠 등장.',
  },
  {
    slug: 'pinned-caption-swap',
    category: 'scroll',
    title: '핀 + 캡션 전환',
    tag: '고정된 비주얼, 바뀌는 설명',
    description:
      '왼쪽 비주얼이 핀으로 고정된 채, 오른쪽 설명 텍스트가 스크롤에 따라 ' +
      '단계별로 교체되고 비주얼 색도 함께 바뀐다.',
    usedSkills: ['gsap-dom-scrolltrigger', 'gsap-dom-core'],
    accent: 'linear-gradient(160deg, #422006, #d97706)',
    skillUsage:
      'gsap-dom-scrolltrigger: 왼쪽 비주얼을 pin으로 고정한 채, scrub 구간의 진행률을 ' +
      '단계 개수로 나눠 현재 캡션 인덱스를 계산하고 onUpdate에서 텍스트·비주얼 색을 ' +
      '교체했다. gsap-dom-core: 캡션 전환은 이전 캡션 fadeOut + 다음 fadeIn 크로스페이드.',
    promptExample:
      '왼쪽 비주얼이 핀으로 고정된 채, 오른쪽 설명 텍스트가 스크롤에 따라 단계별로 ' +
      '교체되고 비주얼 색도 함께 바뀌는 데모를 만들어줘. pin + scrub 진행률을 단계 ' +
      '개수로 나눠 인덱스 계산, 캡션은 크로스페이드.',
  },
  {
    slug: 'zoom-out-reveal',
    category: 'scroll',
    title: '줌아웃 공개',
    tag: '확대된 조각에서 전체로',
    description:
      '화면을 꽉 채운 확대 상태에서 스크롤하면 축소되며 전체 레이아웃(그리드)이 ' +
      '드러난다. scale + 핀 스크럽.',
    usedSkills: ['gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #3b0764, #a21caf)',
    skillUsage:
      'gsap-dom-scrolltrigger: 확대(scale ~3) 상태의 조각을 pin으로 고정하고 scrub로 ' +
      'scale 1까지 축소해 전체 그리드가 드러나게 했다. transform-origin을 조각 위치에 ' +
      '맞춰 줌아웃 중심이 튀지 않게 했다.',
    promptExample:
      '화면을 꽉 채운 확대 상태에서 스크롤하면 축소되며 전체 레이아웃(그리드)이 ' +
      '드러나는 줌아웃 공개를 만들어줘. 확대 조각을 pin으로 고정하고 scrub로 scale ' +
      '1까지. transform-origin을 조각 위치에 맞춰서 줌 중심 안 튀게.',
  },

  // ─── 포인터 인터랙션 ────────────────────────────────────
  {
    slug: 'magnetic-nav',
    category: 'pointer',
    title: '마그네틱 내비게이션',
    tag: '메뉴 항목이 커서에 끌림',
    description:
      '내비 항목마다 커서가 가까워지면 그쪽으로 당겨졌다가 벗어나면 ' +
      'elastic으로 복귀한다. quickTo로 항목당 트윈 재사용.',
    usedSkills: ['gsap-dom-interaction'],
    accent: 'linear-gradient(160deg, #1e293b, #4f46e5)',
    skillUsage:
      "gsap-dom-interaction: 내비 항목마다 quickTo(el, 'x')·quickTo(el, 'y')를 한 번 " +
      '만들어 재사용하고, mousemove에서 커서-항목 거리로 당김량을 계산해 x/y만 ' +
      "움직였다(left/top 금지). 벗어나면 elastic으로 0 복귀. matchMedia('(hover: hover) " +
      "and (pointer: fine)')로 데스크탑에서만 활성화하고, 핸들러 트윈은 contextSafe로 감쌌다.",
    promptExample:
      '내비 항목이 커서가 가까워지면 그쪽으로 당겨졌다가 벗어나면 elastic으로 ' +
      '복귀하는 마그네틱 내비를 만들어줘. 항목마다 quickTo를 한 번 만들어 재사용하고 ' +
      'x/y만 움직여(left/top 금지). (hover: hover) and (pointer: fine)일 때만, 핸들러 ' +
      '트윈은 contextSafe로.',
  },
  {
    slug: 'cursor-spotlight',
    category: 'pointer',
    title: '커서 스포트라이트',
    tag: '커서 주변만 밝아짐',
    description:
      '어두운 콘텐츠 위에서 커서를 따라 원형 라이트가 부드럽게 움직이며 ' +
      '그 부분만 드러난다. radial-gradient 마스크 + quickTo.',
    usedSkills: ['gsap-dom-interaction'],
    accent: 'linear-gradient(160deg, #0a0a0a, #3f3f46)',
    skillUsage:
      'gsap-dom-interaction: 커서를 따라다니는 radial-gradient 마스크의 중심 좌표를 ' +
      'quickTo(duration 0.3~0.4)로 부드럽게 보간했다. mousemove마다 gsap.to를 새로 ' +
      '만들지 않고 quickTo 하나를 재사용한다. 데스크탑 전용(matchMedia).',
    promptExample:
      '어두운 콘텐츠 위에서 커서를 따라 원형 라이트가 부드럽게 움직이며 그 부분만 ' +
      '드러나는 스포트라이트를 만들어줘. radial-gradient 마스크 중심을 quickTo로 ' +
      '보간(duration 0.35). mousemove마다 새 트윈 만들지 말고 quickTo 재사용. 데스크탑만.',
  },
  {
    slug: 'tilt-card-grid',
    category: 'pointer',
    title: '3D 틸트 카드 그리드',
    tag: '커서 위치로 카드가 기울어짐',
    description:
      '카드 위에서 커서 위치에 따라 rotateX/rotateY로 3D 기울기와 광택 ' +
      '하이라이트가 움직인다. 벗어나면 원위치.',
    usedSkills: ['gsap-dom-interaction'],
    accent: 'linear-gradient(160deg, #500724, #e11d48)',
    skillUsage:
      'gsap-dom-interaction: 카드 위 커서 위치를 [-0.5, 0.5]로 정규화해 rotateX/rotateY와 ' +
      '광택 하이라이트 위치를 quickTo로 갱신했다. 카드마다 quickTo를 재사용하고, ' +
      'mouseleave에서 rotation·하이라이트를 0으로 복귀시켰다. 데스크탑 전용(matchMedia).',
    promptExample:
      '카드 위에서 커서 위치에 따라 rotateX/rotateY로 3D 기울기와 광택 하이라이트가 ' +
      '움직이고, 벗어나면 원위치하는 틸트 카드 그리드를 만들어줘. 커서 위치를 ' +
      '[-0.5,0.5]로 정규화, 카드마다 quickTo 재사용. 데스크탑만.',
  },

  // ─── SVG 애니메이션 (추가) ──────────────────────────────
  {
    slug: 'signature-draw',
    category: 'svg',
    title: '서명 그리기',
    tag: '손글씨가 써지듯 그려짐',
    description:
      '필기체 서명 path가 뷰포트 진입 시 한 획씩 그려진다. ' +
      'getTotalLength + strokeDashoffset 타임라인.',
    usedSkills: ['gsap-dom-core', 'gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #1c1917, #57534e)',
    caveat:
      '획 순서 = 그려지는 순서. 디자이너 SVG를 쓸 때 export 시 path 순서를 ' +
      '맞춰야 한다. fill이 있는 글자는 stroke만으로는 표현이 안 됨.',
    skillUsage:
      'gsap-dom-core: 각 획 path의 getTotalLength()로 dasharray·dashoffset을 세팅하고, ' +
      '타임라인에서 dashoffset을 0으로 트윈하며 stagger로 획 순서를 만들었다. ' +
      'gsap-dom-scrolltrigger: 뷰포트 진입 시 toggleActions로 1회 재생.',
    promptExample:
      '필기체 서명 path가 뷰포트 진입 시 한 획씩 그려지는 데모를 만들어줘. 획마다 ' +
      'getTotalLength()로 dasharray/offset 세팅하고 타임라인에서 offset 0으로 트윈 + ' +
      'stagger로 획 순서. path 순서 = 그려지는 순서라는 점 주석으로 남겨.',
  },
  {
    slug: 'morph-blob',
    category: 'svg',
    title: '블롭 모핑',
    tag: '유기적 도형이 흐물거림',
    description:
      'SVG path의 d 속성을 여러 블롭 모양 사이로 무한 보간해 액체처럼 ' +
      '일렁이게 한다. path 데이터 트윈.',
    usedSkills: ['gsap-dom-core'],
    accent: 'linear-gradient(160deg, #172554, #2563eb)',
    caveat:
      '커맨드 개수·종류가 같은 path끼리만 보간된다. 별→원처럼 구조가 다르면 ' +
      'MorphSVG(유료) 또는 flubber 같은 경로 리샘플링 라이브러리가 필요.',
    skillUsage:
      'gsap-dom-core: 커맨드 개수·종류가 동일한 블롭 path 문자열 여러 개를 준비하고, ' +
      'repeat: -1 yoyo 타임라인으로 d 속성 사이를 무한 보간했다(유료 플러그인 없이). ' +
      'path들은 같은 앵커 수를 갖도록 손으로 맞췄다.',
    promptExample:
      'SVG path의 d 속성을 여러 블롭 모양 사이로 무한 보간해 액체처럼 일렁이게 하는 ' +
      '데모를 만들어줘. 커맨드 개수·종류가 같은 블롭 path 여러 개 준비하고 repeat: -1 ' +
      'yoyo 타임라인으로 d 트윈. 유료 플러그인 없이.',
  },
  {
    slug: 'icon-line-trace',
    category: 'svg',
    title: '아이콘 라인 트레이스',
    tag: '아이콘 윤곽이 순서대로 그려짐',
    description:
      '여러 라인 아이콘의 stroke가 stagger로 차례차례 그려지고, 다 그려지면 ' +
      '채워진다. 온보딩·기능 소개에.',
    usedSkills: ['gsap-dom-core', 'gsap-dom-scrolltrigger'],
    accent: 'linear-gradient(160deg, #083344, #14b8a6)',
    skillUsage:
      'gsap-dom-core: 여러 아이콘의 stroke path에 dasharray·dashoffset을 세팅하고 ' +
      '타임라인에서 stagger로 차례차례 그린 뒤, 마지막에 fill-opacity를 0→1로 트윈해 ' +
      '채웠다. gsap-dom-scrolltrigger: 섹션 진입 시 toggleActions로 1회 재생.',
    promptExample:
      '여러 라인 아이콘의 stroke가 stagger로 차례차례 그려지고, 다 그려지면 채워지는 ' +
      '데모를 만들어줘. 아이콘 path에 dasharray/offset 세팅 + 타임라인 stagger로 그리고, ' +
      '마지막에 fill-opacity 0→1. 섹션 진입 시 1회 재생.',
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
  'scroll',
  'motion',
  'pointer',
  'svg',
];

/**
 * 갤러리 필터 chip용 카테고리 목록.
 *
 * chip은 공간이 좁으므로 `LAB_CATEGORY_META.label`의 괄호 보조설명을 뗀
 * 짧은 이름을 쓴다. 순서는 `LAB_CATEGORY_ORDER`를 따른다.
 */
export const LAB_CATEGORY_FILTERS: { value: LabCategory; label: string }[] = [
  { value: 'scroll', label: '스크롤 효과' },
  { value: 'motion', label: '모션' },
  { value: 'pointer', label: '포인터' },
  { value: 'svg', label: 'SVG' },
];

/** 갤러리 목록이 쓰는 표시 순서(카테고리 → 정의 순서) 정렬된 전체 목록. */
export function getLabEntriesInDisplayOrder(): LabEntry[] {
  return LAB_CATEGORY_ORDER.flatMap((category) =>
    getLabEntriesByCategory(category),
  );
}
