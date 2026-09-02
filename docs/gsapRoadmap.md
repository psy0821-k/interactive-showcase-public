# GSAP Lab — 견고성·확장성 개선 로드맵

> `/gsap-lab`의 DOM GSAP 데모를 **실무 프로덕션 견고성 + 확장성**까지 끌어올린
> 개선 계획과 완료 현황.
>
> 범위: GSAP 구현 품질. 성능은 `gsap-dom-performance`, 접근성은 `gsap-a11y`
> 스킬이 별도로 다룬다. reduced-motion 분기는 이미 전 데모에 있으므로 회귀만
> 지킨다.
>
> 작성: 2026-09-02

---

## 목표 기준

| 축 | 목표 상태 |
|---|---|
| API 사용 | GSAP API를 목적에 맞게 구분해 쓰고 공식 함정을 회피 |
| 재실행·정리 | 재실행/정리 로직 정비 · 전 데모 `matchMedia` 일관 적용 |
| 스크럽 정확도 | 모든 스크럽 데모가 스크롤 어느 지점에서 진입해도 값이 정확 |
| 반응형 | 콘텐츠·뷰포트가 바뀌어도 재계산으로 자동 적응 (px 하드코딩 없음) |
| 확장성 | 재사용 프리미티브로 추출돼 새 데모를 30줄 이내로 작성 가능 |
| 검증 | 결정론적 E2E (Playwright에서 스크롤 위치 → 상태가 1:1로 재현) |
| 가독성 | 코드가 GSAP 공식 예제보다 명확 (라벨·주석·네이밍) |

---

## 작업 원칙

- **한 번에 하나.** 각 항목 완료 후 `tsc + lint + spell + build` 통과 + Playwright 회귀 확인.
- **회귀 금지 목록**: reduced-motion 폴백, 90 static pages, 기존 데모 육안 동작.
- 커밋 단위 = 로드맵 항목 1개. 커밋 메시지 한국어.
- Playwright 검증은 **rAF 부드러운 스크롤**로 (점프 스크롤은 `self.direction`·scrub을 오작동시킴 — 이미 확인됨).

---

## Phase 1 — 구조 정비 (A급 진입)

### 1-1. `useGsapDom` 재실행/정리 로직 정비 🔴 구조적

**문제**: `revertOnUpdate` 없이 `dependencies: [reduced]`만 씀. `activeId`(tab-transition)·
`fromId`(stagger-grid-from) 같은 state 의존 데모에서 이전 트윈/트리거가 완전히
정리 안 되고 쌓일 수 있음. StrictMode 이중 마운트에서 재생 중 타임라인이 죽는
이슈 때문에 `revertOnUpdate`를 뺐던 것.

**해결**:
- `useGsapDom`에 `revertOnUpdate: true` 복원.
- StrictMode 이중 실행은 `@gsap/react`의 `context.revert()`가 이미 멱등이므로,
  훅 내부에서 `gsap.context()`를 직접 만들지 말고 `useGSAP`가 주는 context만 쓴다.
- state 의존 데모는 `deps` 파라미터로 명시적으로 넘긴다 (현재 tab-transition은
  `[activeId]`, stagger-grid-from은 `[fromId]`를 넘기고 있음 — 유지).
- 검증: 각 state 데모에서 state를 10회 토글 후
  `gsap.globalTimeline.getChildren(true,true,true).length`가 안정적인지 (누수 0).

**영향 파일**: `src/hooks/use-gsap-dom.ts`, 회귀: 전 데모.

---

### 1-2. ScrollTrigger 통합 — 트리거 남발 제거

**문제**:
- `progress-indicator` — 섹션마다 `ScrollTrigger.create()`. 섹션 N개 = 트리거 N개.
- `icon-line-trace` — 아이콘마다 트리거 생성.
- `bg-color-transition` — 섹션마다 `onEnter`/`onEnterBack` 트리거.

**해결**:
- `progress-indicator`: 문서 전체 트리거 1개 + `onUpdate`에서 각 섹션의
  `getBoundingClientRect()`로 현재 섹션 판정. 진행바는 그대로 `self.progress`.
- `icon-line-trace`: 트리거 1개 + timeline stagger (아이콘 그룹별 `addLabel`).
- `bg-color-transition`: 트리거 1개 + `onUpdate`에서 스크롤 위치 → 섹션 인덱스
  계산 → 목표 색으로 `gsap.to`(overwrite). 색 배열 사이 보간도 가능해짐.

**검증**: 각 데모에서 `ScrollTrigger.getAll().length`가 1~2개인지. 동작 육안 동일.

**영향 파일**: `progress-indicator.tsx`, `icon-line-trace.tsx`, `bg-color-transition.tsx`.

---

### 1-3. 전 pin/scrub 데모에 `matchMedia` 일관 적용

**문제**: `pin-progress`·`responsive-motion-switch`만 `gsap.matchMedia()` 사용.
나머지 pin/scrub 데모(hero-to-section, horizontal-scroll, image-mask-reveal,
pinned-caption-swap, zoom-out-reveal, parallax-image-grid, sticky-stack-cards,
kinetic-typography, section-snap-panels)는 모바일 분기 없음.

**해결**:
- 공통 헬퍼 `withResponsiveScroll(ctx, { desktop, mobile })`를
  `scroll-trigger-setup.ts`에 추가. 내부에서 `gsap.matchMedia()` +
  `(min-width: 768px)` / `(max-width: 767px)` 분기.
- 데스크탑: 현재 pin+scrub 그대로.
- 모바일: pin 없이 `toggleActions` 1회 재생 또는 짧은 scrub. `end`는
  `viewportScrollLength`의 모바일 인자 사용.
- `ScrollTrigger.config({ ignoreMobileResize: true })`는 이미 전역.

**검증**: Playwright `browser_resize`로 375×812 뷰포트에서 각 데모 로드 →
콘솔 에러 0, pin으로 인한 레이아웃 붕괴 없음.

**영향 파일**: `scroll-trigger-setup.ts` + pin/scrub 데모 9개.

---

### 1-4. 매직넘버 → 뷰포트/콘텐츠 실측

**문제**:
- `viewportScrollLength(2.4, 1.6)` 등 임의 배율.
- `parallax-image-grid`의 `scale: 3` — 3×3 그리드 전제.
- `hero-to-section`의 목표 위치 함수형 계산은 이미 실측이나 `62vh` 등 시작값 하드코딩.
- `word-rotator`의 `yPercent: -(100*index)/WORDS.length` — 단어 높이 균등 가정.
- `scroll-direction-header`의 `yPercent: -110`.

**해결**:
- pin 구간 길이: "콘텐츠가 다 보이려면 얼마나 스크롤해야 하는가"를 실측.
  예) `pinned-caption-swap` → `end: () => "+=" + captionCount * 스텝당_스크롤량`.
- `parallax-image-grid` `scale`: `그리드칸크기 / 뷰포트짧은변`으로 유도.
- `word-rotator`: 각 단어 `offsetHeight` 합산으로 정확한 `y` 픽셀 이동.
- `scroll-direction-header`: `-(bar.offsetHeight)` px 이동.

**검증**: 뷰포트를 320 / 768 / 1440 / 2560으로 바꿔가며 각 데모의 핵심 상태
(최종 scale, 캡션 전환 완료 등)가 스크롤 끝에서 항상 도달하는지.

**영향 파일**: 스크럽 데모 대부분.

---

## Phase 2 — 견고성 (A → S 진입)

### 2-1. 스크롤 점프 시 값 정확성 — 스크럽 데모 전수

**문제**: `invalidateOnRefresh` 있어도, 스크롤 중간 지점에서 페이지가 로드되거나
앵커 점프로 진입하면 함수형 시작값이 안 잡혀 값이 튐. (hero-to-section,
zoom-out-reveal에서 확인됨.)

**해결**:
- 모든 scrub 트리거에 `invalidateOnRefresh: true` + `fastScrollEnd: true`.
- `refreshAfterLayout()`를 확장: `ScrollTrigger.refresh()` 후 각 트리거의
  `.progress`를 강제로 현재 스크롤 기준 재적용 (`ScrollTrigger.update()`).
- fromTo의 `immediateRender: false`를 명시해 초기 렌더 시 시작값이 잘못
  박히는 것 방지.
- 데모별 초기 `gsap.set`으로 "스크롤 0일 때의 정확한 상태"를 스냅.

**검증** (핵심 게이트): Playwright에서
```
for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  reload(); scrollTo(stageStart + range*p); wait;
  assert(state ≈ expectedStateAt(p));  // 진입 지점과 무관하게 일치
}
```
이 테스트 통과가 진입지점 독립성의 게이트다.

**영향 파일**: `scroll-trigger-setup.ts` + scrub 데모 전부.

---

### 2-2. `word-rotator` — 빈 트윈 제거, 선언적 타이밍

**문제**: `.to({}, { duration: 1.1 })` 빈 트윈으로 "머무름" 구현. 동작하지만
타임라인을 읽기 어렵고 수정 시 취약.

**해결**: `repeat: -1` + 각 전환에 `repeatDelay` 또는 라벨 기반:
```
const tl = gsap.timeline({ repeat: -1, defaults: { duration: 0.6, ease: "expo.inOut" } });
WORDS.forEach((_, i) => {
  tl.to(list, { y: -offsets[i] }, i === 0 ? 0 : "+=1.1");  // 라벨 대신 상대 간격
});
tl.to(list, { y: 0 }, "+=1.1");
```
`y`는 실측 offset (1-4와 연동).

**영향 파일**: `word-rotator.tsx`.

---

### 2-3. `morph-blob` / `signature-draw` — 한계 명시 + 파이프라인

**문제**:
- `morph-blob`: 점 개수 맞춘 수동 path 4개. 임의 SVG는 이 방식 불가.
- `signature-draw`: "Fluxnote 근사" path — 실제 필기체 임포트 없음.

**해결** (유료 플러그인 없이 갈 수 있는 최대치):
- `morph-blob`: 두 path의 커맨드 수가 다를 때 `flubber` 같은 초경량 보간
  라이브러리 옵션을 주석으로 안내 + 현재 "동일 커맨드 수 케이스"임을 명확히.
  또는 `<animate>` SMIL 대비 GSAP 장점(재생 제어)을 데모에 노출 (일시정지 버튼).
- `signature-draw`: `public/`에 실제 SVG 서명 파일을 두고 `fetch` → `<path>`
  추출 → `getTotalLength` 파이프라인으로 교체. "디자이너가 준 SVG 그대로"
  흐름을 보여줌.
- 두 데모 상단에 "이 기법의 적용 한계" 한 줄 추가 (실무 판단력 신호).

**영향 파일**: `morph-blob.tsx`, `signature-draw.tsx`, `public/signature.svg` (신규).

---

### 2-4. `progress-indicator` 등 — `IntersectionObserver` 병용 검토

**문제**: 현재 섹션 판정을 ScrollTrigger `onToggle`로. 트리거가 많아지고
`start/end` 경계 튜닝이 번거로움.

**해결**: 섹션 활성 판정은 `IntersectionObserver`(threshold 배열),
진행률·스크럽만 ScrollTrigger. 역할 분리가 실무 표준.
(1-2와 함께 처리.)

**영향 파일**: `progress-indicator.tsx`, `section-snap-panels.tsx`.

---

## Phase 3 — 확장성

### 3-1. 재사용 프리미티브 추출

**목표**: 새 데모를 30줄 이내로. 현재 각 데모가 100~180줄, 절반이 boilerplate.

**추출할 프리미티브** (`src/gsap-lab/primitives/`):

| 프리미티브 | 역할 | 대체하는 데모 로직 |
|---|---|---|
| `useRevealOnScroll(selector, vars, opts)` | 뷰포트 진입 시 `from` 등장 + reduced 폴백 | reveal-sequence, reveal-together, line-mask-text, chart-bar-grow, signature-draw, icon-line-trace |
| `usePinnedTimeline(trigger, buildFn, opts)` | pin + scrub + matchMedia + invalidate 일괄 | hero-to-section, pinned-caption-swap, zoom-out-reveal, image-mask-reveal, pin-progress |
| `useParallax(items, opts)` | 요소별 속도차 yPercent 스크럽 | parallax-layers, parallax-image-grid |
| `useScrollProgress(onProgress)` | 문서 진행률 0~1 + 현재 섹션 | progress-indicator |
| `useMagnetic(selector, opts)` | quickTo 당김 + elastic 복귀 + hover 미디어쿼리 | magnetic-nav, pointer-play(부분) |
| `usePointerTilt(selector, opts)` | rotateX/Y + 광택 | tilt-card-grid, pointer-play(부분) |
| `useCountUp(selector, targets, opts)` | 프록시 트윈 + textContent | counter-on-scroll, chart-bar-grow |
| `drawSvgPaths(selector, opts)` | getTotalLength + dashoffset 세팅·트윈 | svg-path-draw, signature-draw, icon-line-trace |

**검증**: 추출 후 각 데모 라인 수 before/after 기록. 동작 육안·Playwright 동일.
프리미티브당 최소 2개 데모가 사용 (DRY 근거).

**영향**: 신규 `primitives/` + 데모 전면 리팩터. **가장 큰 작업, 마지막에.**

---

### 3-2. 데모 메타에 "사용 프리미티브" + "적용 한계" 필드

`registry.ts`의 `LabEntry`에 추가:
```ts
primitives?: string[];   // 이 데모가 쓰는 프리미티브
caveat?: string;         // 이 기법의 실무 적용 한계 한 줄
```
상세 페이지 상단 배너에 노출. 실무 판단력을 보여주는 신호.

---

### 3-3. 결정론적 E2E 스펙

**목표**: `e2e/gsap-lab.spec.ts` — 각 데모의 "스크롤 위치 → 상태" 계약을 코드로.

```ts
test('parallax-layers: 레이어별 이동량이 스크롤에 비례', async ({ page }) => {
  await page.goto('/gsap-lab/parallax-layers');
  await smoothScrollTo(page, 0.5);   // rAF 헬퍼
  const y = await layerYs(page);
  expect(y[0]).toBeLessThan(y[3]);   // 배경이 전경보다 많이 이동
  expect(ratio(y[0], y[3])).toBeCloseTo(EXPECTED_RATIO, 1);
});
```

- `smoothScrollTo` rAF 헬퍼를 공용화.
- scrub 데모는 2-1의 "진입 지점 무관 일치" 테스트를 여기 포함.
- CI(`interactive-gallery/.github/workflows/ci.yml`)에 추가.

**검증**: 31개 데모 각 1~3개 테스트. 전부 green.

---

## 진행 체크리스트

### Phase 1 (A급)
- [x] 1-1. `useGsapDom` revertOnUpdate 복원 + 누수 검증 — 15회 토글 후 tween/ST 누수 0. `window.__gsapLab` 디버그 핸들(dev 전용) 추가.
- [x] 1-2. ScrollTrigger 통합 — progress-indicator 5→1(+IntersectionObserver로 섹션 판정), icon-line-trace 4→1(라벨 타임라인), bg-color-transition 4→1(quickSetter+진행률 색 보간, **진입지점 독립 + 진짜 크로스페이드**)
- [x] 1-3. pin/scrub 데모 정비 — `pinnedTriggerDefaults`(anticipatePin+invalidateOnRefresh+fastScrollEnd) 를 8개 pin 데모에 적용. `withResponsiveScroll` 헬퍼 추가, pin-progress가 사용(데스크탑 pin / 모바일 no-pin+세로 흐름). scroll-story가 자체 registerPlugin 대신 공용 setup 사용.
- [x] 1-4. 매직넘버 → 실측 — **hero-to-section**: `min(88vw,56rem)` CSS 함수값을 GSAP이 보간 못해 width가 튀던 버그 → px 실측 함수형 값(진입지점 독립 확인). **zoom-out-reveal**: `scale: 3` → `offsetWidth/열수`로 유도(`getBoundingClientRect`는 걸린 transform에 오염돼 sx≠sy 피드백 루프 → `offsetWidth`로 해결). **word-rotator**: `yPercent` 균등 가정 → 각 단어 `offsetTop` 실측 + 빈 트윈 제거(2-2 함께 완료). **parallax-layers**: `travel: -420px` 하드코딩 → `innerHeight × 비율` 함수형. **scroll-direction-header**: `yPercent: -110`은 바 높이 상대값이라 유지(주석 추가).

### Phase 2 (A → S)
- [~] 2-1. 스크럽 데모 진입지점-무관 정확성 (전수) ← **핵심 게이트** — hero-to-section·zoom-out-reveal·bg-color-transition은 확인 완료(1-2·1-4에서). 남음: image-mask, horizontal, pinned-caption, parallax류, kinetic, section-snap의 전수 리로드 테스트를 3-3 E2E로.
- [x] 2-2. word-rotator 선언적 타이밍 — 1-4와 함께 완료.
- [x] 2-3. morph-blob / signature-draw 한계 명시 — morph-blob에 일시정지/재개 버튼 추가(CSS·SMIL 대비 GSAP 재생제어 장점 시연) + "커맨드 구조 같아야 보간됨" 명시. signature-draw는 "획 순서 = 그리는 순서" 주석. registry에 `caveat` 필드 신설 + 상세 배너에 노출(5개 데모).
- [x] 2-4. IntersectionObserver 병용 — progress-indicator 완료(1-2). section-snap-panels는 ScrollTrigger `snap`이 본질이라 IO 불필요.

### Phase 3 (S 완성)
- [x] 3-1. 프리미티브 8종 추출 (`src/gsap-lab/primitives/`) + 18개 데모 리팩터.
  - `useRevealOnScroll`(4), `useCountUp`(2), `useDrawSvgPaths`(3, `groupBy` 옵션), `useMagnetic`(2),
    `usePointerTilt`(2), `useParallax`(1), `useScrollProgress`(1, IntersectionObserver 내장), `usePinnedTimeline`(5, `pin: false` 옵션).
  - 데모별 GSAP 로직이 3~8줄로 축소. magnetic-nav 99→47, pointer-play 203→118, reveal-sequence 81→63.
  - 전 리팩터 데모 Playwright 재검증(rAF 스크롤): 동작·트리거 수 동일 또는 개선(progress-indicator TOC 추적 정확도 ↑).
  - `getBoundingClientRect` transform 오염 버그(zoom-out sx≠sy)는 프리미티브가 `offsetWidth` 강제로 방지.
- [~] 3-2. registry `caveat` 완료(2-3). `primitives` 필드는 미적용(선택).
- [ ] 3-3. `e2e/gsap-lab.spec.ts` 결정론적 스펙 + CI (미착수)

---

## 최종 게이트 (전부 충족 목표)

1. **진입 지점 독립성**: 모든 scrub 데모가 스크롤 0.0/0.25/0.5/0.75/1.0 어디서
   reload 후 진입해도 그 지점의 정확한 상태. (Playwright로 증명)
2. **뷰포트 독립성**: 320/768/1440/2560에서 모든 데모의 최종 상태 도달.
3. **트리거 예산**: 데모당 `ScrollTrigger.getAll().length` ≤ 3.
4. **누수 0**: state 10회 토글 후 globalTimeline children 안정.
5. **프리미티브 재사용**: 새 데모 스켈레톤 ≤ 30줄. 프리미티브당 ≥ 2 사용처.
6. **E2E green**: 31개 데모 결정론적 스펙 CI 통과.
7. **가독성**: 라벨 사용(상대값 남발 금지), 빈 트윈 0, 주석 한국어, `any` 0.
