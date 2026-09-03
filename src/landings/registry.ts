/**
 * `/landings` — 스크롤 연동 랜딩페이지 예시 모음.
 *
 * `/gsap-lab`(순수 DOM GSAP 기법 데모)과 `/showcase`(셸 Contract 3D) 사이의
 * 세 번째 트랙 — "완성형 랜딩페이지". 각 페이지는 셸 밖 독립 라우트다.
 *
 * - `kind: "r3f"`(기본): 자체 `<Canvas>` + 스크롤 컨테이너 + ScrollTrigger를
 *   직접 접합한다(gsap-scrolltrigger-scene 형태 B).
 * - `kind: "dom"`: R3F 없이 순수 DOM + GSAP ScrollTrigger로만 구성한다
 *   (원래 `/gsap-lab`의 landing 카테고리였다가 이 트랙으로 이관).
 *
 * 소재는 `/gsap-lab`과 같은 가상 SaaS "Fluxnote". 이미지가 필요한 자리는
 * 배경색만 다른 블록으로 대체한다.
 *
 * 각 항목은 이 페이지를 만들 때 정의한 요구사항(`prompt`)을 함께 담아, 상세
 * 페이지에서 결과물과 나란히 보여준다. 목록은 렌더링 방식(`kind`)으로 나눈다.
 */

/** 랜딩 항목 하나. */
export interface LandingEntry {
  /** URL 세그먼트 (`/landings/{slug}`) */
  slug: string;
  /** 카드·상세 제목 */
  title: string;
  /** 한 줄 태그 — 이 페이지가 보여주는 3D + 스크롤 연출 */
  tag: string;
  /** 한 줄 설명 */
  description: string;
  /** 이 페이지를 만들 때 쓴 skill 이름들. 표시 전용. */
  usedSkills: string[];
  /** 카드 썸네일 배경 (이미지 대신) */
  accent: string;
  /**
   * 이 페이지를 만들 때 정의한 요구사항 명세. 상세 페이지의 "요구사항" 패널에
   * 결과물과 나란히 노출된다.
   */
  prompt: string;
  /** 3D 에셋·기법의 실무 적용 한계 한 줄. 있으면 상세 상단에 노출. */
  caveat?: string;
  /**
   * 렌더링 방식. 생략 시 `"r3f"`(R3F Canvas + ScrollTrigger).
   * `"dom"`은 R3F 없이 순수 DOM + GSAP ScrollTrigger로만 구성된 페이지 —
   * `landing-renderer`가 이 값을 보고 `ssr` 여부를 다르게 로드한다.
   */
  kind?: "r3f" | "dom";
}

export const LANDING_ENTRIES: LandingEntry[] = [
  {
    slug: "forest",
    kind: "dom",
    title: "FOREST — 흩어졌다 모이는 제목",
    tag: "DOM 패럴랙스 히어로 + 비디오 스토리 + 키네틱 타이포",
    description:
      "흰 배경 히어로에서 스크롤을 내리면 대문자 FOREST와 산 이미지가 스크롤을 " +
      "따라 아래로 처지고(속도 텍스트 0.8 > 산 0.5 > 나무 0), 제목은 하단의 " +
      "나무 이미지 뒤로 파고든다. 이어서 비디오 스토리 섹션, 그리고 " +
      "긴 스크럽 구간에서 두 줄 제목(LANDING / FOREST)이 서로 반대 방향으로 " +
      "기울었다 제자리로 모이는 키네틱 타이포. R3F 없이 순수 DOM + GSAP.",
    usedSkills: [
      "gsap-dom-core",
      "gsap-dom-motion",
      "gsap-dom-scrolltrigger",
      "gsap-a11y",
    ],
    accent: "linear-gradient(135deg, #1a2e22, #6b7f5c)",
    prompt:
      "숲 컨셉 랜딩페이지를 /landings에 만들어줘. R3F 없이 순수 DOM + GSAP.\n" +
      "/gsap-lab의 parallax-layers, kinetic-typography 쇼케이스를 참고할 것.\n" +
      "스킬을 참고했으면 데모와 언제나 동일한 애니메이션이 나와야 한다.\n\n" +
      "hero·story 섹션은 min-h-[100svh]로 높이를 맞춰줘 — 모바일에서 breadcrumb·" +
      "caveat가 위에 쌓여도 콘텐츠가 잘리지 않게 min-h + py + flex 중앙 정렬. " +
      "(키네틱 섹션은 예외로 긴 스크럽 구간)\n\n" +
      "1. hero: 배경 흰색. z 순서는 산(배경, 전체 덮고 낮은 opacity) < FOREST " +
      "제목 < 나무(하단). 나무 원본(480×291)은 작아 <Image>로 넓은 화면을 " +
      "cover하면 꼭대기가 잘리므로, 원본 높이(291px) 그대로 background repeat-x로 " +
      "좌우 반복해 화면 폭과 무관하게 온전히 늘어서게 한다. 스크롤을 내리면 " +
      "요소가 위로 사라지는 게 아니라 스크롤을 따라 아래로 처지고, 그 속도를 " +
      "제어한다 — " +
      "나무 0(스크롤과 1:1, 패럴랙스 없음) < 산 0.5 < 텍스트 0.8. 텍스트가 아래로 " +
      "처지면서 하단 나무 뒤로 파고든다. 값이 클수록 스크롤을 더 놓치고 " +
      "뒤따라오는(아래로 처지는) 느낌. useParallax의 data-speed 양수 = 아래로, " +
      "y: innerHeight × speed로 트윈. next/image는 늦게 로드되므로 hero 이미지 " +
      "decode 후 ScrollTrigger.refresh() 한 번 더 — 트리거 위치가 항상 같도록.\n\n" +
      "2. story: 왼쪽 설명 텍스트 + 오른쪽 비디오. 비디오는 playsInline·muted·loop·" +
      "autoPlay + poster로 크기 고정, 스크롤로 들어올 때 좌우에서 각각 페이드인.\n\n" +
      "3. 타이포: 두 줄 제목 'LANDING' / 'FOREST'. kinetic-typography 데모의 " +
      "구조를 따르되(긴 섹션 min-h-[180vh] 스크럽, 제목 전체 scale·xPercent, " +
      "글자 단위 per-char x/y/rotation, letterSpacing 금지) 글자 흩어짐은 각 " +
      "줄이 통째로 한 방향으로 기우는 형태로: 줄 진행률 t = index/(len-1), " +
      "factor = 1-t (첫 글자 최대·마지막 글자 0으로 완만), 방향은 첫 줄 왼쪽" +
      "(-1)·둘째 줄 오른쪽(+1). data-line으로 줄을 구분하고 factor가 0~1이라 " +
      "줄 길이와 무관하게 첫 글자 기울기가 항상 같다. 모바일(window.innerWidth " +
      "< 640)에서는 글자 크기를 키우고(text-[14vw], leading 1.05), 스크럽 구간인 " +
      "섹션 높이를 50rem로 고정(min-h-200, sm↑ 180vh — min-height가 max-height를 " +
      "이기므로 min만 씀)해 빈 여백을 줄이고, 흩어짐 값을 축소(MAX_X 36 / MAX_Y " +
      "12, rotation은 20으로 살려 기울기가 보이게)해 글자끼리·줄끼리 겹치지 " +
      "않게 한다.\n\n" +
      "전부 text-align: center 기준, prefers-reduced-motion이면 모든 애니메이션을 " +
      "최종 상태로 고정. aria 속성 챙길 것.\n\n" +
      "에셋은 public/forest/ (trees-demo.webp, mountain-demo.webp, forest-demo.mp4).",
    caveat:
      "kinetic-typography 데모의 트리거는 섹션 자체라 섹션 높이·앞 콘텐츠가 바뀌면 " +
      "연출이 달라진다. 스크럽 연출을 안정적으로 유지하려면 (1) 긴 섹션(min-h-[180vh])을 " +
      "그대로 쓰고 — 이 섹션만 hero·story의 h-[100svh]와 높이가 다르다 — (2) 글자 흩어짐을 " +
      "줄 진행률(factor 0~1)로 계산해 줄 길이에 무관하게 하고 (3) hero 이미지·폰트 로드 후 " +
      "ScrollTrigger.refresh()로 트리거 위치를 다시 잡는다. 비디오는 자동재생 정책상 " +
      "muted가 필수다.",
  },
  {
    slug: "cloud-sync",
    title: "Fluxnote Cloud — 스크롤로 갈라지는 구름",
    tag: "glTF 모델 히어로 + 스크롤 카메라 전진",
    description:
      "Draco 압축 구름 모델(cloud-opt.glb)이 히어로에 떠 있고, 스크롤하면 " +
      "구름 사이로 카메라가 전진하며 제품 UI 블록이 드러난다.",
    usedSkills: [
      "standard-scene-setup",
      "camera-rig",
      "gltf-model-loading",
      "asset-optimization",
      "procedural-animation",
      "gsap-scrolltrigger-scene",
    ],
    accent: "linear-gradient(135deg, #0369a1, #7dd3fc)",
    prompt:
      "Fluxnote Cloud 제품 랜딩페이지를 만들어줘. 히어로에 public/models/cloud-opt.glb " +
      "구름 모델(Draco 압축본, /draco/ 디코더)을 띄우고, 스크롤 진행률에 따라 카메라가 " +
      "구름 사이를 앞으로 통과하면서 아래 '무제한 동기화 · 버전 히스토리 · 팀 공유' " +
      "3개 기능 블록이 하나씩 페이드업하게 해줘. 구름은 아주 느리게 부유하고, " +
      "prefers-reduced-motion이면 카메라 전진 없이 처음부터 다 보이게.",
    caveat:
      "cloud.glb 원본은 71MB라 그대로 커밋·서빙하면 안 된다. asset-optimization " +
      "파이프라인 산출물 cloud-opt.glb(5.4MB, Draco)를 쓰고 /draco/ 디코더 경로를 넘긴다.",
  },
  {
    slug: "orbit-launch",
    title: "Fluxnote Launch — 궤도를 도는 별자리",
    tag: "procedural 별자리 + 스크롤 궤도 회전",
    description:
      "코드로 생성한 아이코사면체 노드들이 궤도를 이루고, 스크롤하면 궤도가 " +
      "회전·확대되며 출시 로드맵 단계가 순서대로 나타난다.",
    usedSkills: [
      "standard-scene-setup",
      "camera-rig",
      "procedural-geometry",
      "procedural-animation",
      "gsap-scrolltrigger-scene",
    ],
    accent: "linear-gradient(135deg, #4338ca, #a5b4fc)",
    prompt:
      "Fluxnote 새 버전 출시 예고 랜딩페이지를 만들어줘. 히어로에 코드로 만든 " +
      "별자리(중심 구 + 궤도를 도는 아이코사면체 노드 8개, 노드끼리 가는 선으로 연결)를 " +
      "놓고, 스크롤 진행률에 따라 전체 궤도가 Y축으로 한 바퀴 돌면서 살짝 확대되게 해줘. " +
      "스크롤 구간마다 '베타 → RC → 정식 출시' 로드맵 카드가 교체되고, 노드는 " +
      "항상 천천히 자전. reduced-motion이면 궤도 정지.",
  },
  {
    slug: "prism-pricing",
    title: "Fluxnote Pricing — 빛을 가르는 프리즘",
    tag: "procedural 프리즘 + 스크롤 분광 회전",
    description:
      "코드로 만든 팔면체 프리즘이 히어로에서 회전하고, 스크롤하면 프리즘이 " +
      "기울며 요금제 3종이 스펙트럼처럼 펼쳐진다.",
    usedSkills: [
      "standard-scene-setup",
      "camera-rig",
      "procedural-geometry",
      "procedural-animation",
      "gsap-scrolltrigger-scene",
    ],
    accent: "linear-gradient(135deg, #047857, #6ee7b7)",
    prompt:
      "Fluxnote 요금제 랜딩페이지를 만들어줘. 히어로에 코드로 생성한 팔면체(octahedron) " +
      "프리즘을 두고 emissive 그라데이션 재질을 입혀줘. 스크롤하면 프리즘이 45도 기울면서 " +
      "회전하고, 그 아래 Free·Team·Enterprise 요금 카드 3장이 좌→우로 스태거되며 " +
      "떠오르게 해줘. 프리즘은 상시 자전. reduced-motion이면 회전 없이 카드만 즉시 표시.",
  },
  {
    slug: "grid-metrics",
    title: "Fluxnote Analytics — 자라나는 지표 필드",
    tag: "instanced 막대 필드 + 스크롤 성장",
    description:
      "InstancedMesh로 만든 막대 그리드가 바닥에 깔려 있고, 스크롤하면 각 막대가 " +
      "제 높이로 자라나며 분석 대시보드 카피가 나타난다.",
    usedSkills: [
      "standard-scene-setup",
      "camera-rig",
      "procedural-geometry",
      "procedural-animation",
      "gsap-scrolltrigger-scene",
    ],
    accent: "linear-gradient(135deg, #b45309, #fcd34d)",
    prompt:
      "Fluxnote Analytics 랜딩페이지를 만들어줘. 히어로에 InstancedMesh로 12×12 막대 " +
      "그리드를 깔고(드로우콜 1), 스크롤 진행률 0→1에 따라 각 막대가 0에서 " +
      "제각각의 목표 높이까지 자라나게 해줘 — 가운데에서 바깥으로 퍼지는 순서로. " +
      "카메라는 살짝 내려다보는 구도. 다 자라면 '실시간 지표 · 커스텀 대시보드' 카피가 " +
      "페이드인. reduced-motion이면 막대가 처음부터 목표 높이.",
    caveat:
      "막대 144개를 개별 mesh로 만들면 드로우콜 144. InstancedMesh 하나로 묶어 " +
      "드로우콜 1로 만든다(merge-draw-calls). 높이는 인스턴스별 matrix scale로 준다.",
  },
  {
    slug: "ribbon-story",
    title: "Fluxnote Story — 흐르는 리본을 따라",
    tag: "procedural TubeGeometry + 스크롤 경로 카메라",
    description:
      "CatmullRom 곡선으로 만든 리본이 공간을 가로지르고, 스크롤하면 카메라가 " +
      "리본을 따라 이동하며 브랜드 스토리 문단이 지나간다.",
    usedSkills: [
      "standard-scene-setup",
      "camera-rig",
      "procedural-geometry",
      "procedural-animation",
      "gsap-scrolltrigger-scene",
    ],
    accent: "linear-gradient(135deg, #be185d, #f9a8d4)",
    prompt:
      "Fluxnote 브랜드 스토리 랜딩페이지를 만들어줘. CatmullRomCurve3로 S자 곡선을 " +
      "그리고 TubeGeometry로 두께를 줘 공간을 가로지르는 리본을 만들어줘. 스크롤 진행률을 " +
      "곡선의 매개변수 t로 써서 카메라가 리본을 따라 날아가고(getPointAt/getTangentAt), " +
      "구간마다 '2021년 창업 → 100만 노트 → 팀 협업 출시' 스토리 문단이 나타나게 해줘. " +
      "reduced-motion이면 카메라 고정, 문단은 일반 스크롤로 읽기.",
  },
  {
    slug: "crystal-features",
    title: "Fluxnote Features — 피어나는 결정",
    tag: "procedural 결정 클러스터 + 스크롤 개화",
    description:
      "코드로 배치한 결정 조각들이 히어로에서 닫혀 있고, 스크롤하면 하나씩 " +
      "펼쳐지며(scale·rotation 스태거) 각 기능 설명이 붙는다.",
    usedSkills: [
      "standard-scene-setup",
      "camera-rig",
      "procedural-geometry",
      "procedural-animation",
      "gsap-scrolltrigger-scene",
    ],
    accent: "linear-gradient(135deg, #7c3aed, #c4b5fd)",
    prompt:
      "Fluxnote 기능 소개 랜딩페이지를 만들어줘. 코드로 만든 결정 클러스터 — " +
      "가운데 큰 결정(길쭉한 육각기둥 + 뿔) 하나와 그를 둘러싼 작은 결정 5개 — 를 " +
      "히어로에 놓고, 처음엔 작은 결정들이 중심에 모여 scale 0.2로 닫혀 있게 해줘. " +
      "스크롤 진행률에 따라 결정이 하나씩(스태거) 바깥으로 밀려나며 scale 1로 열리고, " +
      "열릴 때마다 옆에 '오프라인 우선 · 종단 암호화 · 무한 캔버스 · API · 자동 백업' " +
      "기능 항목이 나타나게. 결정은 상시 미세하게 자전. reduced-motion이면 처음부터 다 열림.",
  },

  // ─── 순수 DOM + GSAP (원래 /gsap-lab landing 카테고리) ────────────
  {
    slug: "scroll-story",
    kind: "dom",
    title: "Fluxnote — 스크롤 스토리",
    tag: "DOM 히어로 핀 + 패럴랙스 + 진행 인디케이터",
    description:
      "히어로를 핀으로 고정한 채 배경이 스케일되고, 패럴랙스 레이어가 서로 다른 " +
      "속도로 흐르며, 상단 진행 바가 스크롤에 따라 채워진다. R3F 없이 순수 DOM + GSAP.",
    usedSkills: ["gsap-dom-scrolltrigger", "gsap-dom-core"],
    accent: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
    prompt:
      "Fluxnote 스크롤 스토리 랜딩페이지를 /landings에 만들어줘. R3F 없이 순수 DOM + GSAP.\n\n" +
      "1. 히어로: pin으로 고정하고 scrub로 배경(hero-bg)이 scale 1.25→1로 " +
      "줄고 카피(hero-copy)가 yPercent 40→0으로 올라오게. end는 '+=120%'.\n\n" +
      "2. 패럴랙스: 색 블록 3개(배경 -12 / 중간 +6 / 전경 +20)를 yPercent로 " +
      "스크럽, ease: none. 트리거는 구간 전체(top bottom → bottom top).\n\n" +
      "3. 진행 인디케이터: 상단 고정 바를 문서 전체 스크롤 진행률에 맞춰 " +
      "scaleX 0→1 (width가 아니라 transform이라 리플로우 없음).\n\n" +
      "4. 기능 블록 4개: 뷰포트 진입 시 stagger로 한 번만 올라오고(toggleActions " +
      "play none none none), 되돌려도 재생 안 됨.\n\n" +
      "prefers-reduced-motion이면 스크럽을 걸지 않고 전부 최종 상태로 set. " +
      "카드 배경은 흰 텍스트가 WCAG AA(4.5:1)를 넘도록 충분히 어둡게.",
  },
  {
    slug: "pricing-reveal",
    kind: "dom",
    title: "Fluxnote — 요금제 공개",
    tag: "DOM 마스터 타임라인 + stagger 시퀀스",
    description:
      "제목 → 부제 → 기능 → 요금제 → FAQ가 하나의 마스터 타임라인으로 순서대로 " +
      "펼쳐진다. position parameter 겹침과 라벨, stagger amount를 함께 쓴다.",
    usedSkills: ["gsap-dom-core", "gsap-dom-motion"],
    accent: "linear-gradient(135deg, #047857, #0ea5e9)",
    prompt:
      "Fluxnote 요금제 소개 랜딩페이지를 /landings에 만들어줘. R3F 없이 순수 DOM + GSAP.\n\n" +
      "하나의 마스터 타임라인으로 페이지를 위에서 아래로 펼쳐줘 — " +
      "히어로(eyebrow → title → sub) → 기능 카드 6개 → 요금제 카드 3개 → FAQ 3개 " +
      "순서로. 타임라인 defaults로 공통 duration 0.6 / ease power3.out을 주고, " +
      "히어로 항목끼리는 position parameter 겹침('-=0.15' 등)으로 살짝 물리게, " +
      "카드 그룹 정렬 지점은 addLabel로 잡아줘. 카드 stagger는 개수와 무관하게 " +
      "전체 시간이 일정하도록 { amount } 형태로.\n\n" +
      "SSR로 렌더된 요소라 from이 아니라 set(시작 상태) + to(등장)로 짜고, " +
      "prefers-reduced-motion이면 타임라인 없이 최종 상태만 set. " +
      "카드 배경은 흰 텍스트 대비(AA)를 확보할 만큼 어둡게.",
  },
  {
    slug: "pointer-play",
    kind: "dom",
    title: "Fluxnote — 포인터 플레이",
    tag: "DOM 마그네틱 CTA + 틸트 그리드 + 커스텀 커서",
    description:
      "커서가 가까워지면 CTA 버튼이 끌려오고, 카드가 커서 위치로 3D 기울고, " +
      "흰 점이 quickTo로 부드럽게 따라온다. 데스크탑(hover: hover) 전용.",
    usedSkills: ["gsap-dom-interaction", "gsap-dom-core"],
    accent: "linear-gradient(135deg, #b91c1c, #ea580c)",
    prompt:
      "Fluxnote 인터랙티브 히어로 랜딩페이지를 /landings에 만들어줘. R3F 없이 순수 DOM + GSAP.\n\n" +
      "세 가지 포인터 인터랙션을 조합해줘.\n" +
      "1. 마그네틱 CTA: '14일 무료로 시작하기' 버튼이 커서가 range 90 안에 들면 " +
      "strength 0.4로 커서 쪽으로 당겨졌다가 벗어나면 복귀.\n" +
      "2. 틸트 그리드: 기능 카드 6개가 호버 시 커서 위치에 따라 rotateX/Y로 " +
      "maxTilt 16도 기울고 hoverScale 1.06.\n" +
      "3. 커스텀 커서: 화면 전체를 추적하는 흰 점을 quickTo(duration 0.35)로 " +
      "부드럽게 따라오게, mix-blend-difference로.\n\n" +
      "(hover: hover) and (pointer: fine)가 아니거나 prefers-reduced-motion이면 " +
      "커스텀 커서를 숨기고 인터랙션을 끈다. 카드 배경은 흰 텍스트 대비(AA) 확보.",
  },
  {
    slug: "tab-transition",
    kind: "dom",
    title: "Fluxnote — 탭 전환",
    tag: "DOM 진입 오버레이 + 글자 stagger + 탭 크로스페이드",
    description:
      "진입 오버레이가 위로 걷히고, 활성 탭 패널의 제목이 글자 단위로 올라오며, " +
      "탭을 바꾸면 패널이 크로스페이드된다. 탭 전환 시 새 패널로 포커스 이동.",
    usedSkills: ["gsap-dom-motion", "gsap-dom-core"],
    accent: "linear-gradient(135deg, #7c2d12, #a21caf)",
    prompt:
      "Fluxnote 기능 둘러보기 랜딩페이지를 /landings에 만들어줘. R3F 없이 순수 DOM + GSAP.\n\n" +
      "1. 진입 오버레이: 페이지 첫 로드에만 어두운 오버레이가 yPercent -100으로 " +
      "위로 걷힌다(power4.inOut). 이후 탭 전환에는 나타나지 않음.\n\n" +
      "2. 탭 3개(빠른 캡처 / 자동 정리 / 공유). role=tablist·tab·tabpanel, " +
      "aria-selected·aria-controls를 제대로 달고, 탭을 누르면 새 패널로 " +
      "포커스를 옮겨 스크린리더가 바뀐 내용을 읽게 해줘.\n\n" +
      "3. 활성 패널 등장: 본문은 페이드업, 제목은 글자 단위 <span>으로 쪼개 " +
      "yPercent 120에서 stagger { amount: 0.4 }로 올라오게. 원문은 aria-label, " +
      "쪼갠 글자는 aria-hidden.\n\n" +
      "탭 상태는 React state로, 애니메이션은 activeId를 deps로 재실행. " +
      "prefers-reduced-motion이면 오버레이·글자 애니메이션 없이 최종 상태만.",
  },
];

/** slug로 항목을 찾는다. 없으면 undefined — 호출부가 404를 결정한다. */
export function findLanding(slug: string): LandingEntry | undefined {
  return LANDING_ENTRIES.find((entry) => entry.slug === slug);
}
