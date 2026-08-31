"use client";

import { Suspense } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { TOUCH } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  SHOWCASE_ENTRIES,
  findShowcase,
  getSceneLoader,
} from "@/showcases/registry";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneErrorBoundary } from "./scene-error-boundary";

/**
 * 터치 제스처 매핑 (gesture-orbit-inertia, ISSUE-44).
 *
 * `ONE`(한 손가락)에 아무 값도 넣지 않는다 — `<OrbitControls>`가 한 손가락
 * 제스처를 건드리지 않으므로, 캔버스 컨테이너에 걸린 `touch-action: pan-y`
 * (`showcase-detail.tsx`)에 따라 브라우저가 세로 스크롤을 처리한다.
 * 모바일에서 캔버스가 화면 대부분을 덮어도(`h-[60vh] lg:h-[70vh]`) 페이지
 * 스크롤이 막히지 않는다. 두 손가락은 회전 + 줌.
 *
 * 데스크톱 마우스는 `mouseButtons`(기본 LEFT=ROTATE)가 따로 관리하므로
 * 이 매핑과 무관하다 — 드래그 회전·휠 줌은 그대로다.
 *
 * 매 렌더 새 객체를 넘기면 `<OrbitControls>`가 컨트롤을 재설정하므로
 * 모듈 스코프 상수로 고정한다.
 */
const ORBIT_TOUCHES = { TWO: TOUCH.DOLLY_ROTATE } as const;

/**
 * slug → 동적 Scene 컴포넌트 맵. **모듈 로드 시 한 번만** 만든다.
 *
 * `dynamic()`을 렌더 중에 부르면 매 렌더 새 컴포넌트가 생겨 상태가 초기화된다
 * (react-hooks/static-components). 등록된 모든 쇼케이스는 모듈 로드 시점에
 * 이미 알려져 있으므로(`SHOWCASE_ENTRIES`), 여기서 전부 만들어 둔다.
 * `dynamic`은 청크를 실제 사용 시점까지 로드하지 않으므로 코드 분할은 유지된다.
 */
const SCENE_COMPONENTS: Record<string, ComponentType> = Object.fromEntries(
  SHOWCASE_ENTRIES.flatMap(({ slug }) => {
    const loader = getSceneLoader(slug);
    if (!loader) return [];
    const component = dynamic(() => loader().then((mod) => mod.Scene), {
      ssr: false,
      loading: () => null,
    });
    return [[slug, component]];
  }),
);

interface Props {
  slug: string;
  /** 캔버스 대체 텍스트. 스크린리더가 읽는다 (PRD 17절). */
  label: string;
}

/**
 * 캔버스 자리를 대체하는 안내 메시지.
 *
 * 캔버스는 WebGL 렌더라 접근성 트리에 없으므로, 이 폴백이 스크린리더에
 * 전달되도록 role을 준다 (accessible-3d). 오류 상황(Scene 로드 실패·렌더
 * 예외)은 `alert`로 즉시, WebGL 미지원처럼 오류가 아닌 상태는 `status`로.
 */
function CanvasFallback({
  message,
  role = "status",
}: {
  message: string;
  role?: "alert" | "status";
}) {
  return (
    <div
      role={role}
      className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-neutral-400"
    >
      {message}
    </div>
  );
}

/**
 * 쇼케이스 상세의 라이브 캔버스.
 *
 * 이 파일이 `<Canvas>`와 `<OrbitControls>`를 렌더하는 유일한 곳이다.
 * 각 쇼케이스의 Scene은 `<Canvas>` 내부 노드만 반환하므로 캔버스를 중첩하지
 * 않는다 (Showcase Contract 1·2번).
 *
 * R3F 재조정자는 SSR 하이드레이션을 지원하지 않으므로(supportsHydration: false)
 * Scene을 `ssr: false`로 로드한다. 이 옵션은 Server Component에서 쓸 수 없어
 * 클라이언트 컴포넌트인 여기서 호출한다.
 */
export function ShowcaseCanvas({ slug, label }: Props) {
  // 관성(enableDamping)은 모션이므로 모션 축소 설정을 존중한다.
  // 훅은 조건부 return 위에서 항상 호출한다.
  const reducedMotion = useReducedMotion();

  const SceneComponent = SCENE_COMPONENTS[slug] ?? null;

  // 렌더 모드·컨트롤 모드는 쇼케이스 meta에서 옵트인한다. 생략 시 기본값.
  const meta = findShowcase(slug)?.meta;
  const frameloop = meta?.frameloop ?? "always";
  const controlsMode = meta?.controlsMode ?? "orbit";

  if (!SceneComponent) {
    return (
      <CanvasFallback role="alert" message="이 데모를 불러올 수 없습니다." />
    );
  }

  return (
    <SceneErrorBoundary
      fallback={
        <CanvasFallback role="alert" message="이 데모를 불러올 수 없습니다." />
      }
    >
      {/*
        role·aria-label은 R3F가 `{...props}`로 캔버스 래퍼 div에 전달한다
        (fiber/src/web/Canvas.tsx). role 없는 div에 aria-label만 두면
        axe `aria-prohibited-attr` 위반이므로 role="img"을 함께 준다 —
        3D 씬은 이미지에 준하는 임베디드 콘텐츠, label이 대체 텍스트다.
        (accessible-3d 6단계)
      */}
      <Canvas
        shadows
        frameloop={frameloop}
        role="img"
        aria-label={label}
        fallback={
          <CanvasFallback message="이 데모를 보려면 WebGL이 필요합니다." />
        }
      >
        <Suspense fallback={null}>
          <SceneComponent />
        </Suspense>
        {/*
          카메라 컨트롤은 쇼케이스가 아니라 이곳이 공통 제공한다.
          카메라를 코드로 모는 쇼케이스는 meta.controlsMode="none"으로 이를 끈다.

          touches: 한 손가락 = 페이지 스크롤(브라우저), 두 손가락 = 회전+줌.
          enableDamping: 관성. prefers-reduced-motion이면 끈다.
          (gesture-orbit-inertia, ISSUE-44)
        */}
        {controlsMode === "orbit" && (
          <OrbitControls
            makeDefault
            enableDamping={!reducedMotion}
            touches={ORBIT_TOUCHES}
          />
        )}
      </Canvas>
    </SceneErrorBoundary>
  );
}
