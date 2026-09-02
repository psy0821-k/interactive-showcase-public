# GSAP Lab — 인터뷰 대비 요약

> `/gsap-lab` = React Three Fiber 갤러리와 **완전히 분리된 순수 DOM GSAP 랩**.
> 가상 SaaS 제품 "Fluxnote"를 소재로, GSAP 실무 기법 34종을 카테고리별로 시연.
> 이미지가 필요한 자리는 전부 배경색만 다른 `<div>`로 대체.
>
> 관련 문서: 상세 로드맵 `docs/gsapRoadmap.md`, 프로젝트 메모 `~/.claude/.../gsap-lab-dom-track.md`

---

## 1. 한 줄 정리

| 항목 | 내용 |
|---|---|
| 규모 | 34개 데모, 5개 카테고리 (scroll 19 / motion 4 / svg 4 / landing 4 / pointer 3) |
| 스택 | Next.js 16 App Router · React 19 · GSAP 3.15 · `@gsap/react` `useGSAP` · Tailwind 4 · TypeScript(any 금지) |
| 유료 플러그인 | **0** (SplitText·DrawSVG·MorphSVG·Flip·ScrollSmoother 전부 미사용, 수동 구현) |
| 빌드 | 90 static pages, tsc/lint/spell/build 4-게이트 전부 green |
| 검증 | Playwright rAF 부드러운 스크롤로 "스크롤 위치 → 상태" 재현 확인 |
| 현재 등급 | B+ → **A 진입 완료, S급까지 E2E 스펙만 남음** |

---

## 2. 카테고리 & 대표 데모

### scroll (19) — ScrollTrigger·Pin·Scrub·Parallax·Horizontal
| slug | 기법 | 핵심 포인트 |
|---|---|---|
| `parallax-layers` | 레이어별 속도차 | 이동량 = `innerHeight × 비율` (px 하드코딩 아님) |
| `hero-to-section` | 이미지가 축소되며 다음 섹션 썸네일로 | CSS `min()` 값 보간 불가 → px 실측 함수형 값 |
| `zoom-out-reveal` | 확대 조각 → 전체 그리드 | `getBoundingClientRect` transform 오염 → `offsetWidth` |
| `horizontal-scroll` | 세로 → 가로 트랙 | `end` = 트랙 실측 폭 (매직넘버 없음) |
| `pin-progress` | 섹션 고정 + 내부 단계 | `withResponsiveScroll`: 데스크탑 pin / 모바일 no-pin |
| `progress-indicator` | 진행바 + 섹션 하이라이트 | 진행바 ScrollTrigger 1개 + **IntersectionObserver** (트리거 5→1) |
| `bg-color-transition` | 배경색 스크롤 전환 | `quickSetter` + 진행률 색 보간 = 진짜 크로스페이드 (트리거 4→1) |
| `section-snap-panels` | 풀스크린 스냅 | ScrollTrigger `snap` |
| `sticky-stack-cards` | 카드 쌓임 | CSS `sticky` + 스크럽 보정 (pin 대신) |
| `image-mask-reveal` | clip-path 확장 | 컴포지팅 처리라 리플로우 없음 |
| `pinned-caption-swap` | 고정 비주얼 + 바뀌는 캡션 | 하나의 스크럽 타임라인 |
| `kinetic-typography` | 스크롤로 글자 변형 | transform만 사용 (letterSpacing 회피) |
| `reveal-sequence` / `reveal-together` | 순차 vs 동시 등장 | 차이는 `stagger` 유무뿐 |
| `line-mask-text` | 줄 단위 마스크 슬라이드업 | `overflow: hidden` + `yPercent` |
| `counter-on-scroll` / `chart-bar-grow` | 카운트업 / 막대 성장 | 프록시 트윈, `scaleY` + `transform-origin` |
| `scroll-direction-header` | 방향 감지 헤더 | `self.direction`, boolean state 게이트 |
| `parallax-image-grid` | 컬럼별 속도차 갤러리 | pin으로 배경 정지 → 속도차만 보임 |

### motion (4) — Tween·Timeline·Stagger·Responsive
| slug | 기법 |
|---|---|
| `word-rotator` | 무한 반복 단어 교체 — 빈 트윈 없이 position parameter, `offsetTop` 실측 |
| `loader-sequence` | 마스터 타임라인 오프닝 + 다시재생 버튼(`restart`) |
| `stagger-grid-from` | `from`(center·edges·end·random) 인터랙티브 비교 |
| `responsive-motion-switch` | `gsap.matchMedia()` 데스크탑/모바일 분기, 창 크기 바꾸면 즉시 전환 |

### svg (4) — path·stroke·shape
| slug | 기법 | 적용 한계 (caveat) |
|---|---|---|
| `svg-path-draw` | 스크럽 드로우 | — |
| `signature-draw` | 서명 stagger 드로우 | 획 순서 = 그리는 순서 |
| `morph-blob` | `d` 속성 무한 보간 + 일시정지 버튼 | 커맨드 구조 같아야 보간됨 (별→원 불가) |
| `icon-line-trace` | 아이콘 그룹별 순차 드로우 | 트리거 1개 (라벨 타임라인) |

### pointer (3) — Mouse/Pointer, 데스크탑 전용
| slug | 기법 |
|---|---|
| `magnetic-nav` | 항목이 커서에 끌림, `elastic` 복귀 |
| `cursor-spotlight` | 커서 주변만 밝아짐 (radial-gradient 마스크 + `quickTo`) |
| `tilt-card-grid` | 커서 위치로 3D 틸트 + 광택 |

### landing (4) — 완성형 랜딩페이지
`scroll-story` · `pricing-reveal` · `pointer-play` · `tab-transition`

---

## 3. 아키텍처 (인터뷰에서 설명할 3층)

```
src/gsap-lab/
├── registry.ts              # 34개 데모 메타 (카테고리·태그·caveat), R3F registry와 무관
├── demo-shell.tsx           # motion/pointer/svg용 가벼운 셸
├── scroll/
│   ├── scroll-trigger-setup.ts   # registerPlugin 1회 + 공통 헬퍼
│   ├── scroll-demo-shell.tsx      # 스크롤 데모 셸 (transparent/stickyHeader 옵션)
│   └── pages/*.tsx                # 스크롤 데모 19개
├── primitives/              # ← 3-1에서 추출한 재사용 훅 8종
│   ├── index.ts (barrel)
│   ├── use-reveal-on-scroll.ts
│   ├── use-count-up.ts
│   ├── draw-svg-paths.ts
│   ├── use-magnetic.ts
│   ├── use-pointer-tilt.ts
│   ├── use-parallax.ts
│   ├── use-scroll-progress.ts
│   └── use-pinned-timeline.ts
├── motion/pages/*.tsx
├── pointer/pages/*.tsx
└── svg/pages/*.tsx

src/hooks/use-gsap-dom.ts    # DOM 전용 GSAP 훅 (use-gsap-scene는 R3F 캔버스용)
src/app/gsap-lab/
├── page.tsx                 # 카테고리별 카드 인덱스
└── [slug]/page.tsx          # slug → 컴포넌트 매핑 + caveat 배너 + generateStaticParams
```

### 공통 훅 `use-gsap-dom.ts`
- `useGSAP` + `scope` + `contextSafe` 래핑
- `revertOnUpdate: true` — state 의존 재실행 시 이전 트윈·ScrollTrigger 완전 정리
- `reduced` 플래그를 콜백에 전달 (prefers-reduced-motion 분기)
- dev 전용 `window.__gsapLab` 디버그 핸들 (`liveTweenCount`, `scrollTriggers`) — E2E 검증용

### 프리미티브 8종 (데모별 GSAP 로직을 3~8줄로 축소)
| 훅 | 캡슐화 | 사용처 |
|---|---|---|
| `useRevealOnScroll` | `from` + `toggleActions` + reduced | 4곳 |
| `useCountUp` | 프록시 트윈 + textContent | 2곳 |
| `useDrawSvgPaths` | `getTotalLength` + dashoffset (scrub/stagger/groupBy) | 3곳 |
| `useMagnetic` | `quickTo` 재사용 + elastic + matchMedia | 2곳 |
| `usePointerTilt` | rotateX/Y + 광택 + 데스크탑 전용 | 2곳 |
| `useParallax` | data-speed × 뷰포트 비율 스크럽 | 1곳 |
| `useScrollProgress` | 진행바 1개 + IntersectionObserver | 1곳 |
| `usePinnedTimeline` | pin + scrub + `pinnedTriggerDefaults` + `pin:false` 옵션 | 5곳 |

---

## 4. 인터뷰에서 강조할 "실무 함정 & 해결" (핵심 6개)

### ① `.gsap-reveal`(CSS opacity:0) + `gsap.to()` → 화면이 안 뜸
`.to()`의 시작 상태가 "현재 계산값(=0)"이라 0→0 애니메이션이 됨.
- 자동재생 타임라인: CSS `opacity:0` + `.set(시작)` + `.to(등장)`
- ScrollTrigger 등장: `.gsap-reveal` 떼고 `gsap.from({..., scrollTrigger:{toggleActions:"play none none reverse"}})`
  — `useGSAP`가 `useLayoutEffect`라 `from` 시작 상태가 페인트 전 적용 → FOUC 없음

### ② GSAP은 CSS 함수값 `min(88vw, 56rem)`을 보간하지 못함
width가 폭주하는 버그 발생. → 시작·끝 값을 **px 실측 함수형**(`() => Math.min(innerWidth*0.88, 896)`)으로.
`invalidateOnRefresh`로 리사이즈 재계산.

### ③ `getBoundingClientRect`는 이미 걸린 transform에 오염됨
scale 애니메이션 중 rect를 재측정하면 피드백 루프 (zoom-out에서 scaleX≠scaleY).
→ **레이아웃 폭인 `offsetWidth`** 사용.

### ④ ScrollTrigger 남발 → 트리거 예산 통합
- progress-indicator: 섹션마다 트리거(5개) → 진행바 1개 + IntersectionObserver
- bg-color-transition: 섹션마다 onEnter(4개) → 트리거 1개 + `quickSetter` 진행률 색 보간
- icon-line-trace: 아이콘마다 트리거(4개) → 라벨 타임라인 1개

### ⑤ pin + iOS 스크롤 관성 충돌
`pinnedTriggerDefaults` = `anticipatePin: 1` + `invalidateOnRefresh` + `fastScrollEnd`.
모바일은 `withResponsiveScroll`로 pin 자체를 끄고 순차 등장으로 대체 (pin-progress).

### ⑥ 스크롤 점프 시 값 튐 (진입 지점 독립성)
`scrub: 1` + 함수형 값이면 앵커 점프·중간 리로드 시 값이 어긋남.
`immediateRender` 명시 + 초기 `gsap.set` 스냅 + `invalidateOnRefresh`.
bg-color-transition은 `quickSetter`+`onUpdate`라 **점프 진입해도 그 지점 색이 정확** (S급 게이트 통과).

---

## 5. S급 로드맵 진행 상황 (`docs/gsapRoadmap.md`)

| Phase | 항목 | 상태 |
|---|---|---|
| 1 (A급) | 1-1 `useGsapDom` revertOnUpdate + 누수 검증 | ✅ 15회 토글 후 누수 0 |
| | 1-2 ScrollTrigger 통합 (3개 데모, 5→1 / 4→1 / 4→1) | ✅ |
| | 1-3 pin/scrub 데모 `pinnedTriggerDefaults` + matchMedia | ✅ 8개 데모 |
| | 1-4 매직넘버 → 실측 (5개 데모) | ✅ CSS 함수값·offsetWidth 버그 해결 |
| 2 (A→S) | 2-1 스크럽 데모 진입지점 무관 정확성 | 🔶 3개 확인, 나머지 E2E로 |
| | 2-2 word-rotator 선언적 타이밍 (빈 트윈 제거) | ✅ |
| | 2-3 morph-blob/signature-draw 한계 명시 + caveat 필드 | ✅ 5개 데모 배너 |
| | 2-4 IntersectionObserver 병용 | ✅ progress-indicator |
| 3 (S 완성) | **3-1 프리미티브 8종 추출 + 18개 데모 리팩터** | ✅ GSAP 로직 3~8줄, 전부 재검증 |
| | 3-2 registry caveat | ✅ (primitives 필드는 선택) |
| | 3-3 결정론적 E2E 스펙 (`e2e/gsap-lab.spec.ts`) + CI | ⬜ 미착수 |

### S급 최종 게이트 (7개 중 현재)
1. 진입 지점 독립성 — 🔶 (bg-color-transition 통과, 전수는 3-3)
2. 뷰포트 독립성 — ✅ (320/768/1440/2560 확인)
3. 트리거 예산 ≤ 3/데모 — ✅ (parallax는 레이어당 1개로 예외)
4. 누수 0 — ✅
5. 프리미티브 재사용 (새 데모 ≤30줄) — ✅
6. E2E green — ⬜ (3-3)
7. 가독성 (라벨·빈 트윈 0·any 0) — ✅

---

## 6. 예상 질문 & 답변 포인트

**Q. 왜 유료 플러그인을 안 썼나?**
→ 라이선스 리스크 0 + "제약 안에서 푸는" 실력 증명. SplitText는 수동 `<span>` 분할,
DrawSVG는 `getTotalLength`+`strokeDashoffset`, MorphSVG는 커맨드 구조 맞춘 `attr:{d}` 트윈,
Flip은 목표 rect 계산 후 transform 트윈. 각각의 **적용 한계**도 caveat로 명시.

**Q. `/gsap`(R3F)과 `/gsap-lab`을 왜 나눴나?**
→ R3F 갤러리는 `<Canvas>` + 셸 Contract + `Scene()` export 강제. DOM GSAP은 렌더 루프도
`invalidate`도 없이 `ticker`가 CSS를 직접 바꿈 — 근본적으로 다른 트랙. `use-gsap-scene`(캔버스용,
`useThree` 의존)과 `use-gsap-dom`(DOM용)으로 훅도 분리.

**Q. 프리미티브 추출 기준은?**
→ 최소 2개 데모가 같은 GSAP 패턴을 반복하면 추출. 8개 중 6개가 ≥2 사용처.
`useParallax`·`useScrollProgress`는 1곳이지만 "명확히 재사용 가능한 패턴"이라 유지.

**Q. reduced-motion은?**
→ 전 데모가 `reduced` 브랜치를 가짐 — 트윈을 안 만들고 `gsap.set`으로 최종 상태만.
프리미티브에 내장돼 데모가 신경 안 써도 됨. (접근성 전면 대응은 별도 `three-quality` 트랙)

**Q. 성능은?**
→ transform/opacity만 트윈(리플로우 0), `scaleX`/`transform-origin`으로 진행바·막대,
`quickTo`로 고빈도 이벤트 트윈 재사용, on-demand 아님(DOM은 ticker가 직접).
정밀 프로파일링은 이 랩 범위 밖(로드맵 명시).

**Q. 다음 단계는?**
→ 3-3 결정론적 E2E: `e2e/gsap-lab.spec.ts`에 "스크롤 0/0.25/0.5/0.75/1.0 어디서 리로드해도
그 지점 상태가 일치"를 34개 데모 각 1~3개 테스트로. rAF 부드러운 스크롤 헬퍼 공용화.
그러면 S급 게이트 6번 충족.

---

## 7. 커밋 상태

⚠️ `/gsap-lab` 전체가 **아직 커밋 안 됨** (브랜치 `feat/gsap-skills-and-gallery`).
인터뷰 전 커밋 정리 필요 시 별도 요청.
