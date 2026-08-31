# 3D Skill — 웹 개발자를 위한 3D 기법 라이브러리

> AI와의 협업으로 작성된 **재사용 가능한 3D 구현 가이드 모음**. 마케팅 페이지, 제품 뷰어, 스크롤 스토리텔링 같은 웹 프로젝트에서 Claude Code의 SKILL.md로 즉시 활용 가능합니다.

**[갤러리 보기 →](https://interactive-showcase-public.vercel.app/) · [기술 문서](docs/TECHNICAL-HIGHLIGHTS.md) · [접근성 문서](docs/ACCESSIBILITY.md)**

---

## 이 프로젝트는 무엇인가

**개발자 포트폴리오이자 실무용 가이드입니다.**

3D 웹 작업에서 자주 마주치는 "왜 갑자기 그림자가 사라졌지?", "모바일에서 스크롤이 안 되네?" 같은 문제를 **"함정 우선"** 철학으로 다룹니다. 각 기법마다:

- **"이렇게 하면 조용히 깨진다"** (실제로 마주친 버그)
- **최신 기술 스택 검증** (Next.js 16 + R3F v9 + three.js 0.185)
- **실무 패턴** (에러 처리, 성능 최적화, 접근성)
- **라이브 쇼케이스** (38개 씬, 직접 상호작용 가능)

---

## 핵심 기법 3개 (이 프로젝트의 스위트스팟)

| 기법 | 문제 | 해결 |
|------|------|------|
| **모바일 터치 + 스크롤 조화**<br>(`gesture-orbit-inertia`) | 3D 캔버스가 두 손가락 회전을 인식하며 한 손가락 스크롤을 가로막음 | `touch-action: pan-y` + OrbitControls `touches` 조정. 한 손가락=스크롤, 두 손가락=회전·줌 |
| **DoF + 색보정 연쇄**<br>(`depth-of-field-focus` + `color-grading-lut`) | 함께 쓰면 계산량 폭증, 초기 프레임이 검게 나옴 | 포스트프로세싱 체인 순서(Bloom→DoF→ToneMapping)와 초기화 시점 조정 |
| **물리 엔진 인터랙션**<br>(`physics-rigidbody`) | 강체마다 클릭 이벤트를 다는 건 성능 낭비 | 카메라·씬 사이 투명 평면 1개로 클릭 방향 계산 |

세부 구현·성능 수치는 [`docs/TECHNICAL-HIGHLIGHTS.md`](docs/TECHNICAL-HIGHLIGHTS.md) 참조.

---

## 아키텍처: 셸 Contract

모든 38개 쇼케이스가 같은 구조를 따릅니다 — 3D 씬만 반환하고, `<Canvas>`·`<OrbitControls>`는 셸(`showcase-canvas.tsx`)이 제공합니다.

```tsx
export function Scene() {
  return <group><mesh>...</mesh></group>;
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
- **접근성**: 캔버스 `role="img"` + `aria-label`, `prefers-reduced-motion` 대응, WebGL 폴백, ErrorBoundary `role="alert"`을 셸이 공통 제공합니다. axe-core 검증 결과는 [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) (**violations 0**).

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
│   └── showcases/            # 38개 쇼케이스, 8개 카테고리
│       └── {slug}/index.tsx  # Scene + meta export (셸 Contract)
└── package.json
```

---

## 기술 스택

Next.js 16.3 (React 19) · React Three Fiber v9 · three.js 0.185 · drei · @react-three/postprocessing · @react-three/rapier · TypeScript 5 · Tailwind CSS 4 · Bun 1.3.5 · DRACO

---

## 다음 계획

| 항목 | 상태 |
| --- | --- |
| 38개 쇼케이스 + 셸 Contract | ✅ 완료 |
| Vercel 배포 | ✅ 완료 |
| axe 접근성 스캔 (대표 4페이지) | ✅ violations 0 |
| 실측 성능 3씬 · E2E · CI · 실기기 확인 | ⏳ 진행 중 |

애니메이션 타임라인(GSAP), 다중 뷰포트, 3D 변환 툴, 데이터 바인딩은 아직 없습니다.

---

## 기여 & 라이선스

- 사용 후기·기술 제안: p49417875@gmail.com
- 라이선스: MIT (코드) + CC BY-NC 4.0 (문서)

---

**마지막 갱신:** 2026-08-31 · **관리자:** psy0821-k
