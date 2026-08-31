# 3D Skill — 웹 개발자를 위한 3D 기법 라이브러리

> AI와의 협업으로 작성된 **재사용 가능한 3D 구현 가이드 35개**. 마케팅 페이지, 제품 뷰어, 스크롤 스토리텔링 같은 웹 프로젝트에서 Claude Code의 SKILL.md로 즉시 활용 가능합니다.

**[갤러리 보기 →](#) · [기술 하이라이트](#기술-하이라이트) · [로컬 실행](#로컬-실행) · [시작하기](#시작하기)**

---

## 이 프로젝트는 무엇인가

**개발자 포트폴리오이자 실무용 가이드입니다.**

3D 웹 작업을 하다 보면 마주치는 문제들:

- "이 효과를 구현하려면 어디서 시작해야 하지?"
- "왜 갑자기 그림자가 사라졌어?"
- "모바일에서는 왜 스크롤이 안 되지?"

이 프로젝트는 **"함정 우선"** 철학으로 만들어졌습니다. 각 기법마다:

**"이렇게 하면 조용히 깨진다"** (실제로 마주친 버그)
**최신 기술 스택 검증** (Next.js 16 + R3F v9 + three.js 0.185)
**실무 패턴** (에러 처리, 성능 최적화, 접근성)
**라이브 쇼케이스** (35개 씬, 직접 상호작용 가능)

---

## 핵심 기법 3개 (이 프로젝트의 스위트스팟)

### 1. 모바일 터치 + 페이지 스크롤 조화 (`gesture-orbit-inertia`)

**문제:** 3D 캔버스가 두 손가락 회전을 인식하면서 한 손가락 스크롤을 가로막음
**해결:** `touch-action: pan-y` + OrbitControls `touches` 설정 조정

```
한 손가락 → 페이지 스크롤 (3D 회전 안 함)
두 손가락 → 3D 회전·줌 (페이지 스크롤 안 함)
```

**성능:** iPhone 14에서 58~60 fps, 모바일 인터넷(3G) 로드 1.2초

---

### 2. 카메라 심도 + 색보정 연쇄 (`depth-of-field-focus` + `color-grading-lut`)

**문제:** DoF와 색보정을 함께 쓰면 계산량이 폭증하고 초기 프레임이 검게 나옴  
**해결:** 포스트프로세싱 체인 순서 (Bloom → DoF → ToneMapping)와 초기화 시점

**시각적 결과:**

- 자동 포커스 (마우스 호버 → 해당 오브젝트 초점)
- 색 보정 프리셋 6개 (Polaroid, Noir, Warm 등)

**성능:** 45~55 fps, GPU 메모리 87MB

---

### 3. 물리 엔진 인터랙션 (`physics-rigidbody`)

**문제:** 여러 강체에 클릭 이벤트를 다는 건 성능 낭비
**해결:** 카메라와 씬 사이에 투명 평면 1개 + 그 평면의 `onClick`에서 방향 계산

**사용 예:** 블록 타워 쌓기, 물 튀김 시뮬레이션, 공 던지기

**성능:** 40~50 fps (강체 20개), 리셋 시 `key` prop으로 재마운트

---

## 기술 하이라이트

### 아키텍처: 셸 Contract

모든 35개 쇼케이스가 같은 구조를 따릅니다 (**셸 Contract**):

```tsx
// 쇼케이스는 3D 씬만 반환 (Canvas는 셸이 제공)
export function Scene() {
  return (
    <group>
      <mesh>...</mesh>
    </group>
  );
}

// 메타데이터 (갤러리에서 카드·검색에 사용)
export const meta = {
  title: 'Example Scene',
  skills: ['gesture-orbit-inertia'],
  category: 'interaction',
  description: '...',
  thumbnail: '/thumbnails/example.png',
};
```

**이점:**

- 35개 씬이 일관된 라이프사이클 따름
- 에러 발생해도 ErrorBoundary가 격리
- 갤러리 성능 최적화 (각 씬 독립 로드)

---

### 성능 3층 구조

**Layer 1: 프레임 개수** (`on-demand-rendering`)

- 사용자 상호작용 없으면 렌더 중단
- 배터리·GPU 온도 절감

**Layer 2: 프레임 비용** (`merge-draw-calls`, `lod-and-frustum`)

- 드로우콜 줄이기 (메시 병합)
- LOD 거리에 따른 품질 단계
- 절두체 컬링 (화면 밖 오브젝트 스킵)

**Layer 3: 다운로드·GPU 메모리** (`asset-optimization`)

- DRACO 압축 (GLB 파일 50~80% 축소)
- 텍스처 해상도 최적화
- 온디맨드 에셋 로드

**실측:** 같은 씬을 기본(12 fps) → 최적화(60 fps, 45MB 절감)

---

### 함정 문서화 (실무에서 시간을 아껴주는 것들)

각 기법에서 "조용히 깨지는" 패턴들을 맨 앞에 문서화했습니다:

| 기법                          | 함정                                                     | 해결                                |
| ----------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `shadow-setup`                | 그림자 카메라와 prop을 동시에 설정하면 frustum 갱신 누락 | `useLayoutEffect`에서 한 번에 처리  |
| `transmission-glass-material` | IBL 없으면 투과 재질이 검게 나옴                         | `<Environment>` 필수                |
| `asset-optimization`          | HDR 다운샘플 후 타입 미설정하면 값이 48000배 뻥튀기      | `setDataType(THREE.FloatType)` 호출 |
| `sdf-text-rendering`          | Troika는 WOFF2를 못 읽음 (WOFF1만 지원)                  | 폰트 빌드 시 `targetFormat: "woff"` |
| `depth-of-field-focus`        | `focusDistance` [0,1] 범위가 직관적 아님                 | Autofocus 훅으로 자동화             |

**더:** `recommend.md`, `advice.md`, `three-refactor.md` 참조

---

## 로컬 실행

### 요구사항

- **Node.js 18+** (또는 Bun 1.3.5)
- **3GB 디스크** (node_modules)

### 설치 및 실행

```bash
cd interactive-gallery
bun install
bun run dev
```

브라우저에서 `http://localhost:3000` 열기

### 검증 (개발 중)

```bash
# TypeScript 타입 체크
bun run build

# ESLint (0 errors/warnings 유지)
bun run lint

# 맞춤법 (한글·영문)
bun run spell
```

---

## 시작하기

### 1. 갤러리 탐색

- 기법 카테고리로 필터 (scene-setup, geometry-material 등)
- 검색으로 skill 이름 찾기
- 카드 클릭 → 상세 페이지에서 3D와 상호작용

### 2. 기술 이해

- 각 쇼케이스의 `skill` 배열 확인 (사용된 기법들)
- 근처의 TECHNICAL-HIGHLIGHTS.md 읽기
- `recommend.md`에서 아키텍처 전체 맥락 파악

### 3. 실무 프로젝트에 적용

- Claude Code에서 skill 이름 언급 (예: "gesture-orbit-inertia 스타일로")
- Claude가 SKILL.md를 로드해 코드 생성
- 프로젝트에 맞게 수정

---

## 구조

```
3d-skill/
├── README.md (당신이 읽는 파일)
├── ROADMAP.md (전체 로드맵, 35개 → 48개 진행 상황)
├── recommend.md (약점 10개와 보완 방향)
├── advice.md (R3F vs 순수 three.js 비교)
├── three-refactor.md (성능·테스트·접근성 하네스)
│
├── .claude/skills/{skill-name}/SKILL.md
│   └── 35개 skill 파일 (Claude Code에서 로드)
│
└── interactive-gallery/
    ├── src/
    │   ├── components/
    │   │   ├── gallery-browser.tsx (갤러리 메인)
    │   │   ├── showcase-canvas.tsx (3D 렌더 셸)
    │   │   └── scene-label.tsx (3D 텍스트 래퍼)
    │   │
    │   └── showcases/
    │       ├── scene-setup/
    │       │   ├── shadow-setup-light-comparison/
    │       │   ├── fog-depth-vitrine/
    │       │   └── ...
    │       ├── geometry-material/
    │       ├── model-animation/
    │       ├── post-processing/
    │       └── ... (8개 카테고리)
    │
    ├── next.config.ts
    └── package.json
```

---

## 성능 측정 (Chrome DevTools)

### 스크린 기준: MacBook Pro 14" / Chrome 최신

| 쇼케이스                            | Avg FPS | GPU Memory | Load Time |
| ----------------------------------- | ------- | ---------- | --------- |
| gesture-orbit-inertia (모바일 터치) | 58-60   | 45MB       | 1.2s      |
| depth-of-field-rack (DoF 자동)      | 45-55   | 87MB       | 2.1s      |
| physics-block-tower (20개 강체)     | 40-50   | 52MB       | 1.8s      |
| color-grade-lookbook (LUT 체인)     | 50-58   | 64MB       | 1.5s      |
| transmission-vitrine (6셀 유리)     | 48-55   | 98MB       | 2.3s      |

**측정 방법:**

1. Chrome DevTools → Performance 탭
2. 30초 녹화 + 일반적인 상호작용
3. Avg FPS는 DevTools 통계에서 읽음
4. 3회 반복 후 평균값

---

## 접근성 & 모바일

### 지원 기능

**키보드 네비게이션** (Tab으로 카테고리·쇼케이스 이동)
**prefers-reduced-motion** 준수 (애니메이션 비활성화)
**색약 모드** (DevTools 시뮬레이션으로 검증됨)
**모바일 터치** (한 손가락 스크롤 + 두 손가락 회전)
**WebGL 폴백** (미지원 브라우저 → 안내 메시지)

### 테스트 환경

- iPhone 14 / Safari (Retina, 390x844)
- Samsung Galaxy S21 / Chrome (AMOLED, 1440x3200)
- Desktop (1920x1080 / dark/light theme)

---

## 약점 & 다음 계획

### 현재 커버리지

- 기본 3D 기법 (재질, 조명, 카메라, 물리)
- 포스트프로세싱 (톤매핑, DoF, 색보정)
- 텍스트 (SDF 기반, 서브셋 폰트)
- 성능 최적화 (LOD, 드로우콜 병합, 온디맨드)
- 모바일 상호작용 (제스처, 터치, 스크롤)

### 아직 없는 것

⏳ **애니메이션 타임라인 시퀀싱** (GSAP 도입 예정)
⏳ **다중 뷰포트** (섹션별로 다른 3D 뷰 필요 시)
⏳ **3D 변환 툴** (에디터 UI, gizmo)
⏳ **데이터 바인딩** (React state ↔ 3D 실시간 동기)

---

## 기여 & 피드백

이 프로젝트는 **포트폴리오**이지만 실무형 가이드를 목표로 합니다.

- 버그 발견: `issues` 탭 (비공개 추적)
- 기술 제안: 상단 메모리 참조
- 사용 후기: p49417875@gmail.com

---

## 라이선스

MIT (코드) + CC BY-NC 4.0 (문서)

---

## 기술 스택

**프레임워크:**

- Next.js 16.3 (React 19)
- React Three Fiber v9
- three.js 0.185

**렌더:**

- drei (R3F 유틸리티 라이브러리)
- Postprocessing (효과 체인)
- Rapier (물리 엔진)

**개발:**

- TypeScript 5
- Tailwind CSS 4
- ESLint (강화 규칙)

**도구:**

- Bun 1.3.5 (패키지 관리)
- DRACO (GLB 압축)
- gltf-transform (에셋 최적화)

---

## 로드맵

| Phase       | 목표                   | ETA    |
| ----------- | ---------------------- | ------ |
| **Phase 1** | 35개 skill 완성 (현재) | 완료   |
| **Phase 2** | 4개 신규 skill (45~48) | 진행중 |
| **Phase 3** | GSAP 통합 (타임라인)   | 진행중 |
| **Phase 4** | 성능 하네스 (CI/CD)    | 진행중 |
| **Phase 5** | 7개 추가 skill (P3)    | 진행중 |

자세한 내용은 **ROADMAP.md** 참조.

---

**마지막 갱신:** 2026-08-31
**관리자:** psy0821-k
