# 3D Skill — R3F 3D 웹 기법 쇼케이스

> AI가 만든 3D 씬 초안을 프로덕션 기준(성능·접근성·구조)으로 끌어올리는 과정을, 실제로 동작하는 쇼케이스로 정리한 프로젝트입니다. R3F로 3D 웹을 만들 때 반복해서 마주치는 함정을 각 쇼케이스가 하나씩 재현하고, 원인·회피법·직접 수정한 내역을 남깁니다.

[![CI](https://github.com/psy0821-k/interactive-showcase-public/actions/workflows/ci.yml/badge.svg)](https://github.com/psy0821-k/interactive-showcase-public/actions/workflows/ci.yml)

[갤러리 보기 →](https://interactive-showcase-public.vercel.app/) · [기술 문서](docs/TECHNICAL-HIGHLIGHTS.md) · [접근성 문서](docs/ACCESSIBILITY.md) · [성능 문서](docs/PERFORMANCE.md)

---

## 이 프로젝트로 보여주려는 것

| 축                   | 내용                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| AI 산출물 → 프로덕션 | AI 초안이 자주 틀리는 지점(리렌더 폭증, 카메라 소유권 충돌, 컬러스페이스, 기기 감지)을 찾아 재구조화 — 대표 3개에 before/after 기록 |
| 엔지니어링 규율      | 39개 쇼케이스를 관통하는 셸 Contract, 홈 번들 4.6MB→603KB 분리, 온디맨드 렌더링, CI(build·lint·spell·unit·e2e·a11y)                 |
| 접근성·성능          | axe 전수 스캔 71개 페이지 violations 0, `prefers-reduced-motion` 전대응, LCP·드로우콜 계측 후 최적화                                |
| 기술 범위            | GPGPU 파티클(FBO 핑퐁), 커스텀 셰이더 후처리, rapier 물리, 포스트프로세싱 체인 순서                                                 |

- 라이브 쇼케이스 (R3F 39개 + GSAP Lab 30개 + 랜딩 11개, 직접 상호작용 가능)
- 최신 스택 (Next.js 16 + R3F v9 + three.js 0.185)

---

## AI 초안을 고친 대표 3개

실무에서 R3F로 가장 많이 하는 작업 유형이다. 상세 페이지의 "AI 초안에서 고친 것" 블록에 전체 내역이 있다.

| 유형                                                    | AI 초안의 문제                                                                            | 수정                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **제품 뷰어 + 모바일 터치**<br>(`gesture-guide-viewer`) | `userAgent`로 기기 감지 → 하이브리드 기기에서 틀린 조작 안내, 캔버스가 페이지 스크롤 봉쇄 | `event.pointerType`으로 실제 입력 판별, `touches` 재매핑 + `touch-action: pan-y` |
| **스크롤 연동 3D**<br>(`scroll-section-reactor`)        | `useFrame`에서 `setState` → 초당 60 리렌더, OrbitControls와 카메라 소유권 충돌로 떨림     | 공유 ref로 렌더 사이클 제거, `controlsMode: "none"` 옵트인 + 지수 감쇠           |
| **PBR 재질·환경광**<br>(`pbr-material-grid`)            | `<Environment>` 누락으로 금속이 검게, 텍스처 맵 컬러스페이스 미지정                       | `<Lightformer>` 절차적 IBL, 맵별 `colorSpace` 지정                               |

세부 구현·성능 수치는 [`docs/TECHNICAL-HIGHLIGHTS.md`](docs/TECHNICAL-HIGHLIGHTS.md) 참조.

---

## 아키텍처: 셸 Contract

모든 39개 R3F 쇼케이스가 같은 구조를 따릅니다 — 3D 씬만 반환하고, `<Canvas>`·`<OrbitControls>`는 셸(`showcase-canvas.tsx`)이 제공합니다.

```tsx
export function Scene() {
  return (
    <group>
      <mesh>...</mesh>
    </group>
  );
}

export const meta = {
  title: 'Example Scene',
  usedSkills: ['gesture-orbit-inertia'],
  category: 'interaction',
  description: '...',
};
```

**이점:** 일관된 라이프사이클, ErrorBoundary로 에러 격리, 씬별 독립 로드.

---

## 성능 & 접근성

- **성능**: 프레임 개수 → 드로우콜/정점/픽셀/그림자 비용 → 다운로드·GPU 메모리 순으로 계측·최적화하는 층위 사고 모델을 씁니다. 담당 skill과 실측 방법은 [`docs/TECHNICAL-HIGHLIGHTS.md`](docs/TECHNICAL-HIGHLIGHTS.md) §3.
- **접근성**: 캔버스 `role="img"` + `aria-label`, `prefers-reduced-motion` 대응, WebGL 폴백, ErrorBoundary `role="alert"`을 셸이 공통 제공합니다. axe-core 전수 스캔 **71개 페이지 violations 0** — 상세는 [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md).

---

## 로컬 실행

```bash
cd interactive-gallery
bun install
bun run dev
```

브라우저에서 `http://localhost:3000` 열기.

**요구사항:** Node.js 18+ (또는 Bun 1.3.5), 3GB 디스크(node_modules)

```bash
bun run build   # 타입 체크 포함 빌드
bun run lint    # ESLint (0 errors/warnings 유지)
bun run spell   # 맞춤법 검사
```

---

## 구조

```
interactive-gallery/
├── docs/                     # 기술·접근성 상세 문서
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/           # 갤러리·셸·에러 바운더리
│   ├── showcases/            # 39개 R3F 쇼케이스 — {category}/{slug}/{index.tsx,meta.ts}
│   ├── gsap-lab/             # 30개 순수 DOM GSAP 데모
│   └── landings/             # 11개 완성형 랜딩페이지
└── package.json
```

---

## 기술 스택

Next.js 16.3 (React 19) · React Three Fiber v9 · three.js 0.185 · drei · @react-three/postprocessing · @react-three/rapier · TypeScript 5 · Tailwind CSS 4 · Bun 1.3.5 · DRACO

---

## 진행 상황

| 항목                               | 상태            |
| ---------------------------------- | --------------- |
| 39개 R3F 쇼케이스 + 셸 Contract    | ✅ 완료         |
| GSAP Lab 30개 · 랜딩 11개          | ✅ 완료         |
| Vercel 배포                        | ✅ 완료         |
| axe 접근성 전수 스캔 (71개 페이지) | ✅ violations 0 |
| E2E · CI · 실측 성능               | ✅ 완료         |
| 실기기 확인                        | ⏳ 진행 중      |

---

## 기여 & 라이선스

- 사용 후기·기술 제안: p49417875@gmail.com
- 라이선스: MIT (코드) + CC BY-NC 4.0 (문서)

---

**마지막 갱신:** 2026-09-04 · **관리자:** psy0821-k
