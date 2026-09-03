'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { LandingSceneContext } from '../landing-shell';
import { useEasedProgress } from './use-eased-progress';

/** 프리즘 뒤에 펼쳐지는 스펙트럼 조각(요금제 3종에 대응). */
const SPECTRUM = ['#f87171', '#fbbf24', '#34d399'];
/** 상시 자전 각속도. */
const SPIN_SPEED = 0.5;

/**
 * Fluxnote Pricing 히어로.
 *
 * 코드로 생성한 팔면체(octahedron) 프리즘이 상시 자전한다. 스크롤 진행률
 * 0→1에 따라 프리즘이 45도 기울고, 뒤쪽 스펙트럼 조각 3개가 좌→우로
 * 스태거되어 펼쳐진다(요금제 카드의 3D 대응물).
 */
export function PrismPricingScene({ progress, reduced }: LandingSceneContext) {
  const prismRef = useRef<THREE.Mesh>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const eased = useEasedProgress(progress);

  // 스펙트럼 조각 초기 위치·목표 위치.
  const shards = useMemo(
    () =>
      SPECTRUM.map((color, i) => ({
        color,
        hidden: new THREE.Vector3(0, 0, 0),
        // 프리즘(원점) 좌·우로 넓게 벌린다. 가운데(i=1)는 프리즘 뒤로 보내
        // 프리즘 자체가 "가운데 스펙트럼"이 되게 한다. 양옆은 정면을 향한다.
        shown: new THREE.Vector3(
          (i - 1) * 3.6,
          (i - 1) * 0.2,
          i === 1 ? -1.5 : 1.5,
        ),
        stagger: 0.15 + i * 0.15,
      })),
    [],
  );

  useFrame((_, delta) => {
    const t = reduced ? 1 : eased.current;
    const prism = prismRef.current;
    if (prism) {
      if (!reduced) prism.rotation.y += delta * SPIN_SPEED;
      prism.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 4, t);
    }
    shards.forEach((shard, i) => {
      const mesh = shardRefs.current[i];
      if (!mesh) return;
      // 조각별 스태거: 진행률에서 자기 몫만큼 늦게 시작.
      const local = THREE.MathUtils.clamp(
        (t - shard.stagger) / (1 - shard.stagger),
        0,
        1,
      );
      mesh.position.lerpVectors(shard.hidden, shard.shown, local);
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.2, 1, local));
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = local;
    });
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={45}
        near={0.5}
        far={30}
        position={[0, 0, 10.5]}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={2.4} castShadow />
      <directionalLight
        position={[-4, -2, 2]}
        intensity={0.7}
        color="#6ee7b7"
      />

      {/* 프리즘 */}
      <mesh ref={prismRef} castShadow>
        <octahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial
          color="#047857"
          emissive="#10b981"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.2}
          flatShading
        />
      </mesh>

      {/* 스펙트럼 조각 */}
      {shards.map((shard, i) => (
        <mesh
          key={shard.color}
          ref={(el) => {
            shardRefs.current[i] = el;
          }}
          position={shard.hidden}
        >
          <boxGeometry args={[1.3, 1.7, 0.12]} />
          <meshStandardMaterial
            color={shard.color}
            emissive={shard.color}
            emissiveIntensity={0.3}
            roughness={0.4}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </>
  );
}
