# Claude Code Agent 가이드

이 파일은 Claude Code에서 이 프로젝트를 작업할 때 필요한 지침을 제공합니다.

## 개발 명령어

```bash
# 개발 서버 실행 (Turbopack 사용)
bun run dev

# 프로덕션 빌드 (타입 체크 포함)
bun run build

# 프로덕션 서버 실행
bun run start

# ESLint 검사 (0 errors/warnings 유지)
bun run lint

# TypeScript 타입 체크
bunx tsc --noEmit

# 맞춤법 검사 (한글·영문)
bun run spell
```

## 프로젝트 개요

**3D Skill — 웹 개발자를 위한 3D 기법 라이브러리**

- **35개 재사용 가능한 3D 구현 가이드**
- **Next.js 16 + React Three Fiber v9 + three.js 0.185**
- **모바일 지원** (한 손가락 스크롤 + 두 손가락 회전)
- **성능 최적화** (LOD, 드로우콜 병합, 온디맨드 렌더링)

## 핵심 아키텍처

### 셸 Contract (모든 쇼케이스가 따르는 구조)

```tsx
// 각 쇼케이스는 Scene 컴포넌트만 반환 (Canvas는 showcaseCanvas.tsx가 제공)
export function Scene() {
  return (
    <group>
      <mesh>...</mesh>
      {/* 3D 렌더링만 작성 */}
    </group>
  );
}

// 메타데이터 (갤러리에서 카드·검색에 사용)
export const meta = {
  title: '예시 씬',
  skills: ['gesture-orbit-inertia'],
  category: 'interaction',
  description: '이 씬은...',
  thumbnail: '/thumbnails/example.png',
};
```

**이점:**
- 35개 씬이 일관된 라이프사이클을 따름
- 에러 발생해도 ErrorBoundary가 격리
- 갤러리 성능 최적화 (각 씬 독립 로드)

## 폴더 구조

```
src/
├── app/
│   ├── layout.tsx (루트 레이아웃)
│   ├── page.tsx (갤러리 메인)
│   ├── not-found.tsx
│   └── showcase/
│       └── [slug]/page.tsx (상세 페이지)
│
├── components/
│   ├── gallery-browser.tsx (갤러리 필터·검색)
│   ├── showcase-canvas.tsx (3D 렌더 셸)
│   ├── showcase-detail.tsx (상세 페이지 레이아웃)
│   ├── scene-error-boundary.tsx (에러 처리)
│   └── scene-label.tsx (3D 텍스트 래퍼)
│
├── domain/
│   ├── showcase.ts (타입 정의)
│   └── technique-category.ts (카테고리 분류)
│
├── hooks/
│   └── use-reduced-motion.ts (접근성)
│
└── showcases/
    ├── registry.ts (메타데이터 중앙 관리)
    ├── data-visualization/ (데이터 시각화)
    ├── environment-world/ (환경·세계 구축)
    ├── immersive-background/ (몰입형 배경)
    ├── interactive-art/ (인터랙티브 아트)
    ├── product-showcase/ (제품 뷰어)
    ├── scroll-storytelling/ (스크롤 스토리텔링)
    ├── text-typography/ (텍스트·타이포그래피)
    └── transition-effect/ (포스트프로세싱)
```

## 성능 최적화 3층 구조

### Layer 1: 프레임 개수 제어
- 사용자 상호작용 없으면 `onDemandRendering` 활성화
- 배터리·GPU 온도 절감

### Layer 2: 프레임 비용 절감
- 드로우콜 줄이기 (`merge-draw-calls`)
- LOD 거리에 따른 품질 단계 (`lod-and-frustum`)
- 절두체 컬링 (화면 밖 오브젝트 스킵)

### Layer 3: 초기 로드 및 메모리
- DRACO 압축 (GLB 파일 50~80% 축소)
- 텍스처 해상도 최적화
- 온디맨드 에셋 로드

**실측:** 기본(12 fps) → 최적화(60 fps, 45MB 절감)

## 함정 문서화 (실무에서 시간을 아껴주는 것들)

| 기법 | 함정 | 해결 |
|------|------|------|
| `shadow-setup` | 그림자 카메라와 prop을 동시에 설정하면 frustum 갱신 누락 | `useLayoutEffect`에서 한 번에 처리 |
| `transmission-glass-material` | IBL 없으면 투과 재질이 검게 나옴 | `<Environment>` 필수 |
| `asset-optimization` | HDR 다운샘플 후 타입 미설정하면 값이 48000배 뻥튀기 | `setDataType(THREE.FloatType)` 호출 |
| `sdf-text-rendering` | Troika는 WOFF2를 못 읽음 (WOFF1만 지원) | 폰트 빌드 시 `targetFormat: "woff"` |
| `depth-of-field-focus` | `focusDistance` [0,1] 범위가 직관적 아님 | Autofocus 훅으로 자동화 |

## 기술 스택

**프레임워크:**
- Next.js 16.3 (React 19)
- React Three Fiber v9
- three.js 0.185

**렌더링:**
- drei (R3F 유틸리티 라이브러리)
- @react-three/postprocessing (효과 체인)
- @react-three/rapier (물리 엔진)

**개발:**
- TypeScript 5 (any 금지)
- Tailwind CSS 4 (CSS 기반 설정)
- ESLint 9 (강화 규칙)

**도구:**
- Bun 1.3.5 (패키지 관리)
- DRACO (GLB 압축)
- gltf-transform (에셋 최적화)

## 코드 스타일 규칙

### 명명 규칙
- **변수명·함수명:** `camelCase` (영어)
- **클래스명·컴포넌트명:** `PascalCase`
- **상수명:** `UPPER_SNAKE_CASE`
- **파일명:** `kebab-case`

### 코드 품질
- ✅ `any` 타입 금지 (타입 안전성)
- ✅ DRY 원칙 준수 (중복 제거)
- ✅ YAGNI 원칙 준수 (필요한 것만 작성)
- ✅ 함수는 하나의 책임만 가지기
- ✅ 기존 아키텍처·컴포넌트 재사용 우선

### 작성 원칙
- 요청하지 않은 리팩토링 금지
- 변경된 코드만 제안
- 필요한 설명만 제공
- 관련 파일만 확인
- 전체 프로젝트 분석은 요청 시에만 수행

## 커밋 메시지

모든 커밋 메시지는 **한국어**로 작성합니다.

```
기능명: 변경 내용 요약 (30자 이내)

선택적 본문 (필요 시)
```

**예시:**
```
쇼케이스 추가: gesture-orbit-inertia 모바일 제스처 기법

모바일 터치 + 페이지 스크롤을 조화시키는 예제 추가.
touch-action: pan-y와 OrbitControls touches 설정을 통해
한 손가락 스크롤은 페이지 스크롤, 두 손가락은 3D 회전.
```

## 접근성 & 모바일 지원

✅ **키보드 네비게이션** (Tab으로 카테고리·쇼케이스 이동)
✅ **prefers-reduced-motion** 준수 (애니메이션 비활성화)
✅ **색약 모드** (DevTools 시뮬레이션으로 검증)
✅ **모바일 터치** (한 손가락 스크롤 + 두 손가락 회전)
✅ **WebGL 폴백** (미지원 브라우저 → 안내 메시지)

## 성능 측정 기준

| 쇼케이스 | Avg FPS | GPU Memory | Load Time |
|---------|---------|------------|-----------|
| gesture-orbit-inertia (모바일 터치) | 58-60 | 45MB | 1.2s |
| depth-of-field-rack (DoF 자동) | 45-55 | 87MB | 2.1s |
| physics-block-tower (20개 강체) | 40-50 | 52MB | 1.8s |
| color-grade-lookbook (LUT 체인) | 50-58 | 64MB | 1.5s |

**측정 방법:**
1. Chrome DevTools → Performance 탭
2. 30초 녹화 + 일반적인 상호작용
3. Avg FPS는 DevTools 통계에서 읽음
4. 3회 반복 후 평균값

## 요구사항

- **Node.js 18+** (또는 Bun 1.3.5)
- **3GB 디스크** (node_modules)

## 설치 및 실행

```bash
cd interactive-gallery
bun install
bun run dev
```

브라우저에서 `http://localhost:3000` 열기

---

**마지막 갱신:** 2026-08-31
