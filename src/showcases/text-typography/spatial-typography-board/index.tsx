"use client";

import { useCallback, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, PerspectiveCamera } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneLabel, SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "공간 타이포그래피 보드",
  category: "text-typography",
  usedSkills: ["standard-scene-setup", "sdf-text-rendering"],
  description:
    "drei <Text>(troika SDF)의 네 가지 쓰임을 한 화면에 모았다 — (1) 씬 상단 헤드라인은 outlineWidth로 복잡한 배경 위에서 읽힌다, (2) 뒤 오브젝트 3개(구·큐브·원기둥)의 이름표는 <Billboard>로 감싸 카메라가 회전해도 정면을 유지한다, (3) 같은 위치의 고정 라벨 하나는 Billboard 없이 두어 각도가 틀어지면 안 읽히는 대조를 보여준다, (4) maxWidth로 줄바꿈된 본문과 매 프레임 갱신되는 계기판(SceneReadout — ref로 .text 직접 갱신, setState 없음). 폰트는 Pretendard 서브셋 WOFF2 자체 호스팅(CDN Roboto 의존 없음). 카메라는 좌우로 아주 느리게 스윙한다(prefers-reduced-motion이면 정지).",
};

/** 배경 오브젝트 색. */
const SPHERE_COLOR = "#8ab4f8";
const CUBE_COLOR = "#f7a072";
const CYL_COLOR = "#9be7c4";

/** 텍스트 색 — 어두운 배경 위 밝은 회백색. */
const TEXT_COLOR = "#e8eaf0";

/** 뒤에 놓는 3개 오브젝트. 각자 옆에 Billboard 이름표가 붙는다. */
const OBJECTS: ReadonlyArray<{
  name: string;
  position: [number, number, number];
  color: string;
}> = [
  { name: "구", position: [-2.6, 0.4, -1], color: SPHERE_COLOR },
  { name: "정육면체", position: [0, 0.4, -2], color: CUBE_COLOR },
  { name: "원기둥", position: [2.6, 0.4, -1], color: CYL_COLOR },
];

/** 배경 오브젝트 하나 + 카메라를 따라 도는 이름표. */
function LabeledObject({
  name,
  position,
  color,
}: {
  name: string;
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        {name === "구" && <sphereGeometry args={[0.6, 32, 32]} />}
        {name === "정육면체" && <boxGeometry args={[1, 1, 1]} />}
        {name === "원기둥" && <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />}
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Billboard — 자식이 항상 카메라를 향한다. 이름표는 어느 각도에서도 읽힌다. */}
      <Billboard position={[0, 1.1, 0]}>
        <SceneLabel fontSize={0.22} color={TEXT_COLOR} outlineWidth={0.012}>
          {name}
        </SceneLabel>
      </Billboard>
    </group>
  );
}

/**
 * 고정 라벨 — Billboard로 감싸지 않는다.
 *
 * 씬에 붙박여 있어 카메라가 스윙하면 글자가 비스듬해지고, 측면에서는 거의
 * 선으로 보인다. Billboard 이름표와의 대조가 이 쇼케이스의 논점 하나다.
 */
function FixedLabel() {
  return (
    <SceneLabel
      position={[0, 2.0, -2]}
      fontSize={0.16}
      color="#c0c6d4"
      outlineWidth={0.01}
    >
      고정 라벨 · 각도가 틀어지면 안 읽힌다
    </SceneLabel>
  );
}

/** 씬 회전각·경과 시간을 표시하는 계기판. */
function SwingReadout({ rigRef }: { rigRef: RefObject<THREE.Group | null> }) {
  const clock = useThree((state) => state.clock);

  const getText = useCallback(() => {
    // 리그(배경 오브젝트 + 고정 라벨)가 카메라에 대해 돌아간 각도(도).
    const swing = THREE.MathUtils.radToDeg(rigRef.current?.rotation.y ?? 0);
    return (
      `씬 회전 ${swing.toFixed(1)}°  ·  경과 ${clock.elapsedTime.toFixed(1)}초\n` +
      `Billboard 라벨은 계속 정면 · 고정 라벨은 위 각도만큼 기운다`
    );
  }, [rigRef, clock]);

  return (
    <SceneReadout
      getText={getText}
      backdrop={[5.6, 0.78]}
      backdropOpacity={0.7}
      position={[0, -0.95, 2.6]}
      fontSize={0.13}
      color={TEXT_COLOR}
      textAlign="center"
      lineHeight={1.5}
    />
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();
  const rigRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const rig = rigRef.current;
    if (!rig || reducedMotion) return;
    // 아주 느린 좌우 스윙 — Billboard vs 고정 라벨 대조를 눈으로 보게 한다.
    // ±0.26rad(≈15°) — 이보다 크면 고정 라벨이 완전히 옆을 보여 대조가 아니라 소실.
    rig.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.26;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.9, 7.6]} fov={48} near={0.5} far={60} />

      <color attach="background" args={["#0d1017"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 10, 6]} intensity={1.3} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.3} color="#c8d6ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#161b28" roughness={0.95} />
      </mesh>

      {/* 헤드라인 — 씬 상단. 뒤 오브젝트·바닥 위에서 outline으로 읽힌다. */}
      <SceneLabel
        position={[0, 2.55, 0]}
        fontSize={0.42}
        color={TEXT_COLOR}
        outlineWidth={0.016}
        maxWidth={6}
        textAlign="center"
      >
        공간 안의 텍스트
      </SceneLabel>

      {/* 본문 — maxWidth로 줄바꿈된 3~4줄. anchorX left. 카메라 앞쪽 좌하단. */}
      <SceneLabel
        position={[-3.0, -0.2, 2.4]}
        fontSize={0.12}
        color="#b8bfce"
        anchorX="left"
        maxWidth={2.3}
        textAlign="left"
        lineHeight={1.55}
        outlineWidth={0.006}
      >
        SDF 텍스트는 폰트를 거리장 텍스처로 구워 어떤 크기·각도에서도 선명하다. maxWidth를 주면 그 폭에서 자동으로 줄바꿈된다.
      </SceneLabel>

      {/* 회전 리그 — 배경 오브젝트와 고정 라벨이 함께 돈다. 카메라는 고정. */}
      <group ref={rigRef}>
        {OBJECTS.map((object) => (
          <LabeledObject key={object.name} {...object} />
        ))}
        <FixedLabel />
      </group>

      <SwingReadout rigRef={rigRef} />
    </>
  );
}
