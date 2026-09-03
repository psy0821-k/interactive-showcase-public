'use client';

import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';

/**
 * R3F 크기 측정 옵션.
 *
 * 이 캔버스는 `position: fixed` 컨테이너 안에서 `dynamic(ssr:false)`로 늦게
 * 붙는다. `react-use-measure`의 기본 측정이 스크롤 최하단 등에서 0으로 잡혀
 * 드로잉 버퍼가 기본값(300×150)으로 되돌아가는 문제가 있어, 뷰포트에 고정된
 * 이 캔버스는 아래 `style`로 크기를 100vw/100vh로 못박고 측정에 의존하지
 * 않는다. `offsetSize: true`는 그래도 남겨 초기 측정을 돕는다.
 */
const RESIZE_OPTIONS = { offsetSize: true, debounce: 0 } as const;

/** 뷰포트 크기 고정 — fixed 캔버스라 항상 전체 화면. */
const CANVAS_STYLE = { width: '100vw', height: '100vh' } as const;

/**
 * 캔버스 자리 폴백. WebGL 미지원 브라우저·Scene 예외에서 스크린리더가 읽는다
 * (accessible-3d — 3D 씬은 이미지에 준하는 임베디드 콘텐츠).
 */
function CanvasFallback({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex h-full w-full items-center justify-center bg-neutral-950 text-sm text-neutral-400"
    >
      {message}
    </div>
  );
}

interface LandingCanvasProps {
  /** 캔버스 대체 텍스트. 스크린리더가 읽는다. */
  label: string;
  /** R3F Scene 노드. */
  children: ReactNode;
}

/**
 * `/landings/*` 전용 Canvas 래퍼.
 *
 * 이 라우트는 쇼케이스 셸(`showcase-canvas.tsx`) 밖 독립 페이지이므로
 * `standard-scene-setup`의 렌더러 기본값(그림자·톤매핑)을 여기서 직접 준다
 * (gsap-scrolltrigger-scene 형태 B).
 *
 * - `<OrbitControls>`는 두지 않는다 — 스크롤 페이지에서 휠이 충돌한다.
 * - `frameloop`는 항상 `"always"` — 스크롤 중 매 프레임 `useFrame` 보간이 돈다.
 * - 카메라·조명은 각 Scene이 `standard-scene-setup`대로 직접 구성한다.
 */
export function LandingCanvas({ label, children }: LandingCanvasProps) {
  return (
    <Canvas
      shadows
      frameloop="always"
      dpr={[1, 2]}
      resize={RESIZE_OPTIONS}
      style={CANVAS_STYLE}
      gl={{ toneMappingExposure: 1 }}
      role="img"
      aria-label={label}
      fallback={
        <CanvasFallback message="이 데모를 보려면 WebGL이 필요합니다." />
      }
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
