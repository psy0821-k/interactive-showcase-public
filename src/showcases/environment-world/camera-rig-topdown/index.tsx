"use client";

import { PerspectiveCamera } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "탑다운 카메라 리그",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "camera-rig"],
  description:
    "위에서 내려다보는 구도가 씬의 본질인 경우. 기본 카메라(z=5, fov 75)로는 담기지 않아 makeDefault로 교체했다.",
};

export function Scene() {
  return (
    <>
      {/*
        지형 전체를 조망해야 하는 씬이라 기본 카메라로는 담기지 않는다.
        near/far를 씬 규모(약 20유닛)에 맞춰 좁혀 depth 정밀도를 확보한다.
        far/near = 60/0.5 = 120 으로 기본값(10,000)보다 훨씬 여유롭다.
      */}
      <PerspectiveCamera
        makeDefault
        fov={45}
        near={0.5}
        far={60}
        position={[0, 12, 14]}
      />

      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 10, 6]} intensity={2} castShadow />
      <directionalLight position={[-6, 3, 2]} intensity={0.5} />

      {/* 격자로 배치한 기둥 — 탑다운 구도에서 높이 차가 드러난다 */}
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => {
          const height = 0.6 + ((row * 5 + col) % 4) * 0.5;
          return (
            <mesh
              key={`${row}-${col}`}
              position={[(col - 2) * 2.2, height / 2, (row - 2) * 2.2]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1.2, height, 1.2]} />
              <meshStandardMaterial
                color={`hsl(${200 + row * 8}, 45%, ${45 + col * 4}%)`}
                roughness={0.6}
              />
            </mesh>
          );
        }),
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
    </>
  );
}
