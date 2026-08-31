# 기술 하이라이트

> `README.md`의 요약을 넘어, 이 프로젝트에서 **기술적으로 판단이 필요했던
> 지점**과 **그 근거**를 정리한다. "어떤 문제를 어떻게 풀었나"를 5분 안에
> 파악하는 것을 목표로 한다.
>
> 최종 갱신: 2026-08-31

---

## 1. 프로젝트 한 줄 요약

3D 웹 기법을 **Claude Code SKILL.md**(AI가 로드하는 구현 가이드)로 문서화하고,
각 기법을 **라이브 쇼케이스**로 이 갤러리에 전시한다. 문서의 핵심은 기법
사용법이 아니라 **"이렇게 하면 조용히 깨진다"는 함정과 그 회피법**이다.

- **쇼케이스**: `src/showcases/{category}/{name}/index.tsx` × 38 (8개 카테고리)
- **스택**: Next.js 16 (App Router) · React 19 · React Three Fiber v9 · three.js 0.185

---

## 2. 아키텍처: 셸 Contract

### 문제

쇼케이스 38개가 각자 `<Canvas>`·카메라 컨트롤·에러 처리·리사이즈를 구현하면,
(1) 코드가 38배로 중복되고 (2) R3F 캔버스 중첩 같은 실수가 반복되며
(3) 갤러리 전역 정책(모션 축소, WebGL 폴백)을 한 곳에서 못 바꾼다.

### 결정 — 쇼케이스는 "씬"만 반환한다

`src/components/showcase-canvas.tsx` **한 파일**이 `<Canvas>`와 `<OrbitControls>`를
렌더하는 **유일한 곳**이다. 각 쇼케이스는 `<Canvas>` 내부에 들어갈 노드만
`Scene`으로 내보내고, 갤러리에서 쓸 정보를 `meta`로 내보낸다.

```tsx
// showcases/{category}/{name}/index.tsx
export function Scene() {
  // <Canvas>·<OrbitControls>를 만들지 않는다 (셸이 제공)
  return (
    <group>
      <mesh>{/* ... */}</mesh>
    </group>
  );
}

export const meta = {
  title: "...",
  usedSkills: ["gesture-orbit-inertia"],
  category: "interaction",
  // 셸 동작을 쇼케이스가 옵트인으로 조정하는 필드 (아래 2-2)
  frameloop: "demand",      // 기본 "always"
  controlsMode: "none",     // 기본 "orbit"
};
```

### 2-1. 셸이 공통으로 처리하는 것

| 관심사 | 처리 | 근거 |
|---|---|---|
| 캔버스 생성 | 셸이 `<Canvas shadows>` 1개 | 캔버스 중첩 방지 |
| SSR 회피 | `dynamic(() => loader().then(m => m.Scene), { ssr: false })` | R3F 재조정자가 `supportsHydration: false` — 하이드레이션 불가 |
| 동적 컴포넌트 안정성 | `dynamic()`을 **모듈 로드 시 한 번** 호출해 `slug → Component` 맵 생성 | 렌더 중 `dynamic()` 호출 시 매 렌더 새 컴포넌트 → 상태 초기화 |
| 코드 분할 유지 | 위 맵을 만들어도 `dynamic`이 청크를 사용 시점까지 지연 로드 | 38개 씬을 한 번에 받지 않음 |
| 카메라 컨트롤 | 셸이 `<OrbitControls makeDefault>` | 쇼케이스가 카메라를 직접 몰면 `controlsMode: "none"`으로 끔 |
| 에러 격리 | `SceneErrorBoundary`로 감싸 폴백 UI (`role="alert"`) | 한 씬이 던져도 갤러리 전체는 살아 있음 |
| WebGL 미지원 | `<Canvas fallback={...}>` (`role="status"`) | 안내 메시지로 대체 |
| 캔버스 대체 텍스트 | `<Canvas role="img" aria-label={상태 포함 설명}>` | 스크린리더에 씬 내용 전달 (§4-1) |
| 모션 축소 | `useReducedMotion()` → `enableDamping={!reducedMotion}` | `prefers-reduced-motion` 존중 |

### 2-2. `meta` 옵트인 필드 (셸 Contract 확장)

기본값으로 두면 대다수 쇼케이스가 코드 없이 동작하고, 필요한 씬만 명시적으로 켠다.

- **`meta.frameloop`** — `"always"`(기본) / `"demand"`. 정적인 씬은 `"demand"`로
  두면 상호작용이 없을 때 렌더를 멈춘다.
- **`meta.controlsMode`** — `"orbit"`(기본) / `"none"`. 카메라를 코드로 애니메이션
  하는 씬은 `"none"`으로 셸의 `<OrbitControls>`를 끈다.

---

## 3. 성능: 층위 사고 모델

최적화 요청이 오면 "무엇을 줄일지"를 층위로 나눠 판단한다. **각 층은 곱해진다** —
프레임 개수를 60→2fps로 줄이면 나머지 층과 무관하게 GPU 사용이 30배 준다.

| 층 | 무엇을 줄이나 | 대표 기법 |
|---|---|---|
| **프레임 개수** | 렌더 호출 횟수 | 상호작용 없으면 `frameloop="demand"`로 렌더 정지 |
| **프레임 비용 — 드로우콜** | "이걸 그려라" 호출 수 | 정적 지오메트리 병합, 인스턴싱 |
| **프레임 비용 — 정점** | 정점 셰이더 통과량 | LOD 거리 단계, 절두체 컬링 |
| **프레임 비용 — 픽셀** | 프래그먼트 셰이더 실행 수 | DPR 상한, 후처리 `resolutionScale` |
| **프레임 비용 — 그림자** | 섀도우맵 렌더 | frustum 좁히기, `mapSize` 신중히 |
| **다운로드·GPU 메모리** | 전송 바이트·VRAM | Draco 압축, 텍스처 1024/WebP, HDR 다운샘플 |
| **React 커밋** | 재조정·리렌더 | `useFrame` 안 `setState` 금지, 선택자 구독 (3-2) |
| **GPU 리소스 누수** | 해제 안 된 버퍼 | 수동 생성물만 `useEffect` cleanup (3-3) |

**핵심**: "느리다"의 원인이 어느 층인지 **먼저 계측하고** 고친다
(`gl.info.render` → DevTools Performance → React Profiler).

### 3-2. React 리렌더 방지 (R3F)

DevTools Bottom-Up에서 React 커밋(`commitRoot`)이 크게 잡히면 렌더 코드가 아니라
컴포넌트 재조정이 병목이다. R3F 특유의 규칙:

| 규칙 | 이유 |
|---|---|
| `useFrame` 안에서 `setState` 금지 | 초당 60회 리렌더 → 씬 전체 재조정. ref를 직접 만진다 |
| render 중 새 배열/객체를 prop으로 넘기지 않기 | `position={[x,0,0]}` 리터럴은 매 렌더 새 참조. 모듈 스코프 상수 또는 `useMemo` |
| `useRef.current`를 render 중 JSX prop으로 넘기지 않기 | 첫 렌더에 `null`, 이후 변화 감지 안 됨. `useMemo`로 `Vector3` 생성 |
| `useThree` 선택자는 필요한 스칼라만 | `state.size` 전체 구독 시 height만 바뀌어도 리렌더 |
| 3D 무관 UI 상태를 `<Canvas>` 조상에 두지 않기 | 패널 열림 상태가 씬까지 리렌더시킴 |

셸이 이 패턴을 따른다 — `ORBIT_TOUCHES`·`SCENE_COMPONENTS`는 모듈 스코프 상수,
`dynamic()`은 모듈 로드 시 1회. 강화 ESLint가 렌더 중 `dynamic()`·ref-as-prop을
정적으로 차단한다.

### 3-3. Dispose / 메모리 관리

R3F는 언마운트 시 씬 그래프의 geometry/material/texture를 **자동 dispose**한다
(R3F를 쓰는 이유 중 하나 — 6절). 자동으로 안 되는 것만 수동 처리:

| 무엇 | 처리 |
|---|---|
| `new THREE.WebGLRenderTarget(...)` 직접 생성, 큐브카메라 타깃 | `useEffect` cleanup에서 `.dispose()` |
| `postprocessing`의 `Effect` 인스턴스 | `<primitive object={effect} dispose={null} />` + 재생성 금지 |
| `useGLTF`/`useTexture` 캐시 공유 리소스 | **dispose 금지** — 색 변경은 `.clone()` 후 clone만 dispose |
| 리스너·`setInterval`·`ResizeObserver` | `useEffect` cleanup |

검증: `gl.info.memory.geometries`·`textures`를 로그하며 갤러리↔상세 10회 왕복 —
숫자가 계속 오르면 누수.

### 3-4. 실측 성능 (측정 예정)

> ⚠️ Chrome DevTools Performance 30초 녹화 × 3회 평균으로 채운다. 브라우저
> 자동화 환경은 GPU가 불안정해 헤드리스 측정이 불가능하다.
> 상세: `docs/PERFORMANCE.md`(작성 예정).

| 쇼케이스 | Avg FPS | GPU Memory | Load Time | 상태 |
|---|---|---|---|---|
| `gesture-guide-viewer` | (측정) | (측정) | (측정) | 측정 대기 |
| `depth-of-field-rack` | (측정) | (측정) | (측정) | 측정 대기 |
| `physics-block-tower` (강체 다수) | (측정) | (측정) | (측정) | 측정 대기 |

---

## 4. 함정 문서화 — 실제로 시간을 아껴준 것들

각 기법 문서는 사용법이 아니라 **"조용히 깨지는 지점"을 맨 앞에 둔다.**
"왜 안 되지"에 쓰는 시간이 3D 웹에서 가장 크기 때문이다.

| 기법 | 함정 | 증상 | 회피 |
|---|---|---|---|
| transmission / 금속 재질 | IBL(`<Environment>`) 없음 | 재질이 새까맣게 렌더됨 | `<Environment>` 필수 |
| bloom | 블룸 임계값은 "색"이 아니라 "밝기(1.0 초과)" | 선명한 네온색인데 안 번짐 | `color={[3,1,0.5]}` 또는 `emissiveIntensity`로 1.0 위로 |
| color grading | `<EffectComposer>` 마운트 시 `gl.toneMapping`이 `NoToneMapping`으로 강제됨 | 컴포저 넣자 씬 색이 갑자기 쨍해짐 | 체인 끝에 `<ToneMapping>` 명시 |
| depth of field | `focusDistance`가 월드 단위가 아니라 정규화 [0,1] | "3유닛 앞 초점"을 못 맞춤 | `<Autofocus target={[x,y,z]}>` 월드 좌표 |
| 포스트프로세싱 체인 | Bloom → DoF → ToneMapping 고정 | DoF를 톤매핑 뒤에 두면 배경 불빛 보케가 회색 얼룩 | HDR 값(1 초과)에서 블러/블룸 |
| 커스텀 이펙트 패스 | `Effect`의 기본 `blendFunction`이 `NORMAL` | 커스텀 왜곡·색수차가 절반만 걸린 듯 흐림 | 화면 대체 효과는 `BlendFunction.SRC` 명시 |
| 커스텀 이펙트 패스 | uniform 값 바뀔 때 Effect 인스턴스 재생성 | 값 변경마다 한 프레임 끊김 (셰이더 재컴파일) | `useMemo(() => new E(), [])` 후 `effect.uniforms.get(k).value` 갱신 |
| R3F 애니메이션 | `useRef.current`를 렌더 중 JSX prop으로 전달 | Vector prop이 안 먹거나 초기값에 고정 | `useMemo`로 `Vector3` 생성해 넘김 |
| R3F 애니메이션 | `useFrame` 안에서 `setState` 호출 | 초당 60회 리렌더 → 씬 버벅임 | ref를 직접 만진다 |
| 반응형 캔버스 | `<Canvas dpr={[1,2]}>`를 "상한 걸었다"며 명시 | 아무 효과 없음 (기본값과 동일) | 낮출 때만 의미 — `[1, 1.5]` |
| R3F dispose | `useGLTF`/`useTexture` 캐시 공유 리소스를 `.dispose()` | 같은 에셋 쓰는 다른 씬이 깨짐 | 색 변경은 `.clone()` 후 clone만 |
| 에셋 최적화 | HDR 다운샘플 후 데이터 타입 미설정 | float 값이 크게 뻥튀기되어 노출 폭발 | 재인코딩 시 float RGB ↔ RGBE 바이트 변환 정확히 |
| SDF 텍스트 (Troika) | Troika가 WOFF2를 못 읽음 | 폰트가 로드 안 되고 조용히 폴백 | 폰트 빌드 시 `targetFormat: "woff"` (WOFF1) |
| 톤매핑 (postprocessing) | `<ToneMapping>` `adaptive` 기본 true | AGX/ACES/NEUTRAL 초기 몇 프레임이 검게 | `adaptive={false}` |
| 제스처 (OrbitControls) | `touches`가 한 손가락을 잡으면 모바일 페이지 스크롤 봉쇄 | 캔버스 위에서 스크롤 안 됨 | `touches`에서 `ONE` 제거 + 컨테이너 `touch-action: pan-y` |

### 4-1. 접근성 — 발견한 실제 버그

**`aria-prohibited-attr` (serious)** — axe 스캔에서 발견.

- R3F `<Canvas>`가 `aria-label`을 `{...props}`로 **캔버스 래퍼 `<div>`**에
  전달하는데(`fiber/src/web/Canvas.tsx`), 그 div에 `role`이 없다. `role` 없는
  generic `<div>`에 `aria-label`만 두는 것은 WCAG 위반이다.
- **수정**: `<Canvas role="img">` 추가. 3D 씬은 이미지에 준하는 임베디드
  콘텐츠, `aria-label`이 그 대체 텍스트. → 재스캔 violations 0.

상세: `docs/ACCESSIBILITY.md`.

---

## 5. 모바일: 터치 제스처와 페이지 스크롤의 충돌

### 문제

모바일에서 3D 캔버스가 화면의 60~70%를 덮는다(`h-[60vh] lg:h-[70vh]`).
`<OrbitControls>`가 한 손가락 드래그를 회전으로 소비하면, 사용자가 캔버스 위에서
**페이지를 세로로 스크롤할 수 없다.**

### 해결

1. 셸의 `<OrbitControls touches>`에서 `ONE`(한 손가락) 매핑을 **비운다** —
   `const ORBIT_TOUCHES = { TWO: TOUCH.DOLLY_ROTATE }`.
2. 캔버스 컨테이너에 `touch-action: pan-y`를 건다.

```
한 손가락  → 브라우저가 세로 스크롤 처리 (3D 회전 안 함)
두 손가락  → 회전 + 줌 (페이지 스크롤 안 함)
데스크톱   → mouseButtons가 별도 관리 → 드래그 회전·휠 줌 그대로
```

3. 관성(`enableDamping`)은 모션이므로 `prefers-reduced-motion`이면 끈다.

> 실기기(iPhone/Android) 최종 확인은 사람이 수행 (`docs/ACCESSIBILITY.md` §3).

---

## 6. 스택 선택의 근거

| 선택 | 이유 | 트레이드오프 |
|---|---|---|
| **React Three Fiber (vs 순수 three.js)** | 3D가 React state와 얽히는 웹 UI가 타깃. dispose·리사이즈·톤매핑 재현을 R3F가 자동 처리 | 번들 크기 큼. 배너·비-React 호스트에는 부적합 |
| **애니메이션 라이브러리 없음** | `useFrame` + 지수 감쇠(`1 - exp(-rate·dt)`)로 "목표값 추종"은 충분. package.json에 없는 패키지 import 금지 원칙 | "3초간 A 후 B" 같은 명시적 타임라인은 손으로 상태머신 |
| **Bun** (패키지 관리) | 설치·스크립트 속도 | 팀 표준이 npm이면 lockfile 재생성 필요 |
| **강화 ESLint 규칙** | R3F 특유 실수(렌더 중 `dynamic()`, ref를 prop으로, 모듈 스코프 부수효과)를 정적으로 차단 | 규칙 학습 비용. 베이스라인 0 errors/0 warnings 유지 |

---

## 7. 검증 현황

| 검증 | 도구 | 상태 |
|---|---|---|
| 타입 | `bun run build` | ✅ 통과 |
| 린트 | `bun run lint` | ✅ 0 errors / 0 warnings |
| 맞춤법 | `bun run spell` | ✅ 통과 |
| 육안(38 쇼케이스) | 브라우저 수동 | ✅ 대부분 |
| 배포 | Vercel | ✅ 완료 |
| **접근성 (axe)** | axe-core 4.10.2, WCAG 2.0/2.1 A·AA | ✅ **홈 + 대표 상세 3종 violations 0** (`docs/ACCESSIBILITY.md`) |
| 실측 성능 | Chrome DevTools 반복 측정 | ⏳ 사람 수행 (`docs/PERFORMANCE.md`) |
| E2E | Playwright (핵심 3 씬) | ⏳ |
| CI | GitHub Actions (build + lint) | ⏳ |

---

## 8. 다음 계획

- 실측 성능 3씬 (DevTools 30초 × 3회) → `docs/PERFORMANCE.md`
- E2E 3개 (Playwright) — 터치→회전 / 호버→포커스 / 클릭→낙하
- CI (GitHub Actions: build + lint + spell)
- 실기기 모바일 확인, 접근성 전수 스캔 (`docs/ACCESSIBILITY.md` §3)
