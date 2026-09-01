# 접근성 검증 기록

> axe-core 자동 스캔 결과 + 코드로 확인된 항목 + 사람이 수행해야 하는 항목.
>
> 최종 갱신: 2026-08-31

---

## 1. axe 자동 스캔 — ✅ 전수 통과

axe-core 4.13.0, WCAG 2.0/2.1 A·AA 태그 (`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`).
`@axe-core/playwright`로 프로덕션 빌드를 스캔한다.

**41개 페이지 전부 violations 0** — 갤러리 홈 `/` + GSAP 갤러리 `/gsap` +
상세 페이지 39개. `e2e/axe-full-scan.spec.ts`, CI e2e 잡에 포함 (약 43초).

- `color-contrast`는 규칙에서 제외한다 — 캔버스 위 텍스트는 배경이
  WebGL 렌더 결과라 axe가 대비를 계산할 수 없다(사람 확인, §3).
- 로컬 실행: `bun run test:a11y`. 빠른 스모크만 돌릴 때는 `bun run test:e2e`
  (전수 스캔 제외).

### 1-0. 왜 셸 하나만 고치면 39개가 다 통과하나

접근성 속성이 전부 `src/components/showcase-canvas.tsx` **한 파일**에서 나온다.
각 쇼케이스는 `<Canvas>`를 만들지 않고 씬 노드만 반환하므로(셸 Contract,
`TECHNICAL-HIGHLIGHTS.md §2`), `role="img"` · `aria-label` · WebGL 폴백
`role="status"` · 에러 폴백 `role="alert"` · 로딩 상태가 39개 상세 페이지에서
동일하다. 상세 페이지 골격(`<main>` / `<h1>` / 갤러리 복귀 `<button>`)도
`showcase-detail.tsx` 공통이다. §1-1의 버그 2건도 셸 수정 한 번으로 전 페이지가
해소됐고, 전수 스캔이 이를 확인한다.

### 1-1. 발견 → 수정한 위반

**`aria-prohibited-attr` (serious)** — 상세 페이지의 캔버스 래퍼 `<div>`.

- **원인**: R3F `<Canvas>`가 `aria-label`을 `{...props}`로 캔버스 래퍼 `<div>`에
  전달하는데(`fiber/src/web/Canvas.tsx`), 그 div에 `role`이 없다. `role` 없는
  generic `<div>`에 `aria-label`만 두는 것은 WCAG 위반 — 스크린리더가 이름을
  붙일 대상이 아니다.
- **수정**: `src/components/showcase-canvas.tsx`의 `<Canvas>`에 `role="img"` 추가.
  3D 씬은 이미지에 준하는 임베디드 콘텐츠, `aria-label`이 그 대체 텍스트.
  → 재스캔 violations 0.

**캔버스 `aria-label`이 개발자용 기술 설명을 낭독함** — 스크린리더(NVDA) 실사용에서 발견.

- **원인**: 캔버스 라벨을 `"{title} — {description}"`으로 조립했는데, `meta.description`은
  `<OrbitControls>`·`event.pointerType('mouse'/'touch')`·`(gesture-orbit-inertia, ISSUE-44)`
  같은 코드 식별자와 기법 용어가 섞인 개발자용 문단이다. 스크린리더가 "왼쪽 꺾쇠
  OrbitControls 오른쪽 꺾쇠"까지 그대로 읽어 대체 텍스트로 무의미했다.
- **수정**: `ShowcaseMeta`에 낭독 전용 필드 `a11yLabel?: string` 추가
  (`src/domain/showcase.ts`). 셸은 `meta.a11yLabel ?? "{title} 3D 씬"`을 캔버스
  `aria-label`로 쓴다(`showcase-detail.tsx`). 실측 3씬 + 후처리 3씬에 "무엇이
  보이고 어떻게 조작하는가"를 자연어 한두 문장으로 부여, 나머지는 제목 폴백.
- **회귀 방지**: E2E(`e2e/showcase-detail.spec.ts`)가 캔버스 `aria-label`에
  `<Pascal`·`OrbitControls`·`ISSUE-N` 패턴이 없음을 검증한다.

---

## 2. 코드로 확인된 구현

| 항목 | 상태 | 근거 |
|---|---|---|
| `bun run build` (타입) | ✅ | exit 0 |
| `bun run lint` | ✅ | 0 errors / 0 warnings |
| `bun run spell` | ✅ | 0 issues |
| 캔버스 `role="img"` + `aria-label` (상태 포함 설명) | ✅ | `showcase-canvas.tsx`, axe 검증 |
| WebGL 폴백 `role="status"` | ✅ | `CanvasFallback` 기본값 |
| 에러 폴백 `role="alert"` | ✅ | `SceneErrorBoundary` fallback |
| `prefers-reduced-motion` 구독 | ✅ | `src/hooks/use-reduced-motion.ts` (`useSyncExternalStore`) |
| reduced-motion → OrbitControls 관성 off | ✅ | `enableDamping={!reducedMotion}` |
| reduced-motion → `useFrame` delta 0 | ✅ | 19개 쇼케이스 |
| 모바일 터치 ↔ 스크롤 | ✅ 코드 | `touch-action: pan-y` + `<OrbitControls touches>` — **실기기 확인은 §3** |
| `lang="ko"` | ✅ | `src/app/layout.tsx` |
| 검색 input `<label>` 래핑 | ✅ | `gallery-browser.tsx` |
| 카드 링크 `:focus-visible` 링 | ✅ | `focus-visible:outline-2` |
| 필터 칩 `aria-pressed` | ✅ | `gallery-browser.tsx` |

---

## 3. 사람이 수행한 검증 — ✅ 완료 (2026-09-02)

> 자동 검증 불가 항목을 실브라우저·실기기에서 수행한 결과.

```
[접근성]
  [x] 스크린리더 — NVDA로 상세 페이지 캔버스 도달 시 role="img" +
      aria-label 낭독 확인. → 라벨이 개발자용 기술 설명을 읽는 문제 발견,
      meta.a11yLabel 필드로 수정 (§1-1). 재검증 시 자연어로 낭독됨
  [x] 키보드만으로 전체 흐름 — 갤러리 → 검색 → 필터 칩 → 카드 → 상세 →
      "돌아가기" → 복귀. 포커스 링 항상 표시, 순서 논리적. 이상 없음
  [x] 발작 패턴 — emissive-bloom-lantern / crt-grain-vignette /
      color-grade-lookbook 육안. 3Hz 초과 번쩍임 없음, 화면 대면적
      밝기 급변 없음. 프리셋·효과 전환은 서서히 이루어짐
  [x] reduced-motion 실동작 — DevTools "Emulate prefers-reduced-motion"에서
      애니메이션 정지, 형태·정보 유지 확인

[색]
  [x] color-contrast — 다크/라이트 양쪽에서 text-neutral-500·text-neutral-400
      배경 대비 4.5:1 이상. 이상 없음

[모바일]
  [x] 실기기 터치 — Galaxy S24+ (Android Chrome):
      한 손가락 = 페이지 스크롤(캔버스 위에서도), 두 손가락 = 회전·줌 확인

[전수]
  [x] 41개 페이지 axe 전수 스캔 — violations 0 (§1)
  [x] Lighthouse — Performance 99 / Accessibility 100 /
      Best Practices 100 / SEO 100
```

---

## 4. 자동 스캔 재현 방법

dev 서버(`bun run dev`)를 띄우고, 브라우저 콘솔에서:

```js
// axe-core 주입
const s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
document.head.appendChild(s);
await new Promise(r => s.onload = r);

// 스캔
const r = await axe.run(document, {
  runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] }
});
console.table(r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })));
```

`@axe-core/playwright` 하네스(`bun run a11y`)는 이후 작업.
