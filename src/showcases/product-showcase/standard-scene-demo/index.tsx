"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const meta: ShowcaseMeta = {
  title: "기본 씬 셋업",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup"],
  description:
    "3점 조명(key/fill/rim)과 표준 카메라 스케일을 적용한 기본 씬. 그림자는 key 라이트 하나만 드리운다.",
};

/** 회전 속도(라디안/초). prefers-reduced-motion이면 정지한다. */
const ROTATION_SPEED = 0.4;

export function Scene() {
  const meshRef = useRef<Mesh>(null);
  const reducedMotion = useReducedMotion();

  // 프레임 수가 아니라 delta 기준으로 회전시켜 주사율과 무관하게 만든다.
  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return;
    meshRef.current.rotation.y += delta * ROTATION_SPEED;
  });

  return (
    <>
      {/* 암부의 바닥값. 0.5를 넘기면 형태감이 사라진다. */}
      <ambientLight intensity={0.3} />
      {/* Key — 가장 강하고, 그림자를 드리우는 유일한 조명 */}
      <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
      {/* Fill — key 반대편에서 암부를 들어올린다 */}
      <directionalLight position={[-5, 2, 2]} intensity={0.6} />
      {/* Rim — 피사체 뒤쪽에서 실루엣을 배경과 분리한다 */}
      <directionalLight position={[0, 3, -6]} intensity={1.2} />

      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color="#c9c9c9" metalness={0.1} roughness={0.35} />
      </mesh>

      {/* 그림자를 받을 면이 없으면 castShadow를 켜도 그림자가 보이지 않는다. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </>
  );
}
