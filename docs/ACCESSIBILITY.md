# 접근성 검증 기록

> axe-core 자동 스캔 결과 + 코드로 확인된 항목 + 사람이 수행해야 하는 항목.
>
> 최종 갱신: 2026-08-31

---

## 1. axe 자동 스캔 — ✅ 통과

axe-core 4.10.2, WCAG 2.0/2.1 A·AA 태그.

| 페이지 | violations | passes | incomplete |
|---|---|---|---|
| `/` (갤러리 홈) | **0** | 24 | color-contrast (배경 판정 불가 — 사람 확인) |
| `/showcase/standard-scene-demo` | **0** | 19 | — |
| `/showcase/emissive-bloom-lantern` (후처리) | **0** | 19 | — |
| `/showcase/scroll-section-reactor` (스크롤) | **0** | 19 | — |

**전 쇼케이스(38개) 스캔은 미완** — 위 4개는 대표 렌더 경로(정적 조명 / 후처리 /
스크롤 / 목록). 나머지는 셸이 공통 제공하는 구조라 같은 결과가 예상되나,
배포 전 전수 스캔 권장.

### 1-1. 발견 → 수정한 위반

**`aria-prohibited-attr` (serious)** — 상세 페이지의 캔버스 래퍼 `<div>`.

- **원인**: R3F `<Canvas>`가 `aria-label`을 `{...props}`로 캔버스 래퍼 `<div>`에
  전달하는데(`fiber/src/web/Canvas.tsx`), 그 div에 `role`이 없다. `role` 없는
  generic `<div>`에 `aria-label`만 두는 것은 WCAG 위반 — 스크린리더가 이름을
  붙일 대상이 아니다.
- **수정**: `src/components/showcase-canvas.tsx`의 `<Canvas>`에 `role="img"` 추가.
  3D 씬은 이미지에 준하는 임베디드 콘텐츠, `aria-label`이 그 대체 텍스트.
  → 재스캔 violations 0.

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

## 3. 사람이 반드시 해야 하는 항목 — ⏳ 미수행

> **자동 검증 불가.** 배포 전 사람이 실브라우저·실기기에서 수행하고 결과를
> 이 문서에 추가한다.

```
[접근성]
  [ ] 스크린리더 1회 — VoiceOver(⌘F5) 또는 NVDA로 상세 페이지 캔버스에
      도달했을 때 role="img" + aria-label이 낭독되고 "말이 되는가"
  [ ] 키보드만으로 전체 흐름 — 갤러리 → 검색 → 필터 칩 → 카드 → 상세 →
      "돌아가기" → 복귀. 포커스 링이 항상 보이고 순서가 논리적인가
  [ ] 발작 패턴 — emissive-bloom-lantern, color-grade-lookbook 등
      밝기 변화가 큰 씬을 눈으로: 3Hz 초과 번쩍임 없음,
      화면 25% 초과 면적의 밝기 급변 없음
  [ ] reduced-motion 실동작 — OS 설정 또는 DevTools "Emulate
      prefers-reduced-motion"에서 애니메이션이 멈추되 형태·정보는 남는가

[색]
  [ ] color-contrast — axe가 incomplete로 남긴 항목.
      다크/라이트 양쪽에서 text-neutral-500(설명문)·text-neutral-400
      (폴백 메시지)이 배경 대비 4.5:1을 넘는가. DevTools 색상 피커 또는
      axe DevTools 확장으로 수치 확인

[모바일]
  [ ] 실기기 터치 — iPhone Safari / Android Chrome:
      한 손가락 = 페이지 스크롤(캔버스 위에서도), 두 손가락 = 회전·줌.
      DevTools 에뮬레이션은 실제 터치 라우팅을 재현하지 못함

[전수]
  [ ] 나머지 34개 쇼케이스 axe 스캔 (대표 4개는 §1에서 통과)
  [ ] Lighthouse Accessibility 점수 (목표 100 / 최소 95)
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
