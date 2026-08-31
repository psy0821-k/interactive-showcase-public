"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { Group } from "three";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const meta: ShowcaseMeta = {
  title: "HDRI 환경 조명",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "hdri-environment"],
  description:
    "Lightformer로 만든 환경맵이 금속 표면에 반사된다. 외부 CDN 없이 이미지 기반 조명(IBL)을 구성한 예제.",
};

/** 회전 속도(라디안/초). 반사가 흐르는 것을 보여주기 위해 느리게 돈다. */
const ROTATION_SPEED = 0.25;

export function Scene() {
  const groupRef = useRef<Group>(null);
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * ROTATION_SPEED;
  });

  return (
    <>
      {/*
        children을 주면 환경맵을 절차적으로 생성한다 — preset과 달리 외부 CDN에
        의존하지 않는다. 이 사각/원형 광원들이 금속 표면에 그대로 비친다.
      */}
      <Environment resolution={256} environmentIntensity={0.85}>
        {/* 위쪽 대형 스트립 — 제품 사진의 소프트박스 역할 */}
        <Lightformer
          form="rect"
          intensity={8}
          scale={[12, 5]}
          position={[0, 6, -4]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#ffffff"
        />
        {/* 좌측 냉색 필 — 반사에 색 변화를 준다 */}
        <Lightformer
          form="circle"
          intensity={5}
          scale={5}
          position={[-7, 2, 3]}
          color="#a0c4ff"
        />
        {/* 우측 난색 필 */}
        <Lightformer
          form="rect"
          intensity={4}
          scale={[7, 7]}
          position={[7, 1, 2]}
          color="#ffd6a5"
        />
      </Environment>

      {/*
        HDRI는 또렷한 그림자를 만들지 않으므로 key light 하나를 병행한다.
        ambientLight는 환경맵과 역할이 겹쳐 넣지 않는다.
      */}
      <directionalLight position={[4, 6, 4]} intensity={1.1} castShadow />

      <group ref={groupRef}>
        {/* 거울에 가까운 금속 — 환경맵이 없으면 검게 보인다 */}
        <mesh position={[-1.3, 0, 0]} castShadow>
          <sphereGeometry args={[0.9, 64, 64]} />
          <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.08} />
        </mesh>

        {/* 거친 금속 — 같은 환경맵이 흐릿하게 반사된다 */}
        <mesh position={[1.3, 0, 0]} castShadow>
          <sphereGeometry args={[0.9, 64, 64]} />
          <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.35} />
        </mesh>
      </group>

      {/* 그림자가 보일 만큼 밝되 구체보다 튀지 않는 중간 톤 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.8} metalness={0.1} />
      </mesh>
    </>
  );
}
