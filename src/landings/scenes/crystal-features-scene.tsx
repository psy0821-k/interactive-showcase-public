'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { LandingSceneContext } from '../landing-shell';
import { useEasedProgress } from './use-eased-progress';

/** 바깥을 도는 작은 결정 수(기능 항목에 대응). */
const SATELLITE_COUNT = 5;
/** 상시 흔들림 진폭(라디안)·주기. 무한 자전이 아니라 좁은 왕복이라
 *  위성이 화면 밖으로 나가지 않는다. */
const SWAY_AMPLITUDE = 0.12;
const SWAY_SPEED = 0.4;

/**
 * 길쭉한 육각기둥 + 위아래 뿔로 결정 하나를 만든다.
 * procedural-geometry: CylinderGeometry(6각) + ConeGeometry 조합.
 */
function Crystal({ scale = 1, color }: { scale?: number; color: string }) {
  return (
    <group scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.4, 6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.1}
          flatShading
        />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.4, 0.7, 6]} />
        <meshStandardMaterial color={color} roughness={0.15} flatShading />
      </mesh>
      <mesh position={[0, -1.05, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.4, 0.7, 6]} />
        <meshStandardMaterial color={color} roughness={0.15} flatShading />
      </mesh>
    </group>
  );
}

/**
 * Fluxnote Features 히어로.
 *
 * 가운데 큰 결정 하나 + 둘러싼 작은 결정 5개. 처음엔 작은 결정들이 중심에
 * 모여 scale 0.2로 닫혀 있다. 스크롤 진행률에 따라 하나씩(스태거) 바깥으로
 * 밀려나며 scale 1로 열린다. 결정은 상시 미세하게 자전.
 */
export function CrystalFeaturesScene({
  progress,
  reduced,
}: LandingSceneContext) {
  const groupRef = useRef<THREE.Group>(null);
  const satelliteRefs = useRef<(THREE.Group | null)[]>([]);
  const eased = useEasedProgress(progress);

  const satellites = useMemo(
    () =>
      Array.from({ length: SATELLITE_COUNT }, (_, i) => {
        const angle = (i / SATELLITE_COUNT) * Math.PI * 2;
        return {
          angle,
          // XY 평면 원형 배치. z를 두면 자전 시 카메라 뒤로 사라진다.
          open: new THREE.Vector3(
            Math.cos(angle) * 3,
            Math.sin(angle) * 2.4,
            0,
          ),
          color: ['#a78bfa', '#c4b5fd', '#8b5cf6', '#ddd6fe', '#7c3aed'][i],
          stagger: i * 0.16,
        };
      }),
    [],
  );

  useFrame((state) => {
    const t = reduced ? 1 : eased.current;
    // 좁은 각도로 왕복만 한다(무한 자전 아님). 스크롤이 끝에 멈춰
    // onUpdate가 끊겨도 클러스터가 한 바퀴 돌아 화면 밖으로 나가지 않는다.
    if (groupRef.current && !reduced) {
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * SWAY_SPEED) * SWAY_AMPLITUDE;
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * SWAY_SPEED * 0.7) * SWAY_AMPLITUDE;
    }
    satellites.forEach((sat, i) => {
      const node = satelliteRefs.current[i];
      if (!node) return;
      const local = THREE.MathUtils.clamp(
        (t - sat.stagger) / (1 - sat.stagger),
        0,
        1,
      );
      node.position.lerpVectors(new THREE.Vector3(0, 0, 0), sat.open, local);
      node.scale.setScalar(THREE.MathUtils.lerp(0.2, 1, local));
      node.rotation.z = (1 - local) * Math.PI;
    });
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={45}
        near={0.5}
        far={30}
        position={[0, 1, 11]}
      />

      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 7, 4]} intensity={2.2} castShadow />
      <pointLight
        position={[0, 0, 2]}
        intensity={6}
        distance={10}
        color="#c4b5fd"
      />

      <group ref={groupRef}>
        {/* 중심 결정 */}
        <Crystal scale={0.95} color="#7c3aed" />

        {/* 위성 결정 */}
        {satellites.map((sat, i) => (
          <group
            key={sat.color}
            ref={(el) => {
              satelliteRefs.current[i] = el;
            }}
          >
            <Crystal scale={0.6} color={sat.color} />
          </group>
        ))}
      </group>
    </>
  );
}
