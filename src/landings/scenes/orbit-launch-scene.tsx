'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { LandingSceneContext } from '../landing-shell';
import { useEasedProgress } from './use-eased-progress';

/** 궤도를 도는 노드 개수. */
const NODE_COUNT = 8;
/** 궤도 반지름. */
const ORBIT_RADIUS = 3.4;

/** 노드 초기 배치 — 궤도 위 균등 분포 + 약간의 높이 흔들림. */
function useNodeLayout() {
  return useMemo(() => {
    return Array.from({ length: NODE_COUNT }, (_, i) => {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const tilt = Math.sin(angle * 2) * 0.6;
      return {
        angle,
        base: new THREE.Vector3(
          Math.cos(angle) * ORBIT_RADIUS,
          tilt,
          Math.sin(angle) * ORBIT_RADIUS,
        ),
        spin: 0.3 + (i % 3) * 0.15,
      };
    });
  }, []);
}

/**
 * Fluxnote Launch 히어로.
 *
 * 중심 구 + 궤도를 도는 아이코사면체 노드 8개. 노드는 중심과 가는 선으로
 * 연결된다. 스크롤 진행률 0→1에 따라 전체 그룹이 Y축으로 한 바퀴 돌고
 * 살짝 확대된다. 노드는 상시 자전.
 */
export function OrbitLaunchScene({ progress, reduced }: LandingSceneContext) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const layout = useNodeLayout();
  const eased = useEasedProgress(progress);

  // 중심 → 각 노드 연결선. 위치는 고정이므로 한 번만 만든다.
  const linePositions = useMemo(() => {
    const arr = new Float32Array(NODE_COUNT * 2 * 3);
    layout.forEach((node, i) => {
      arr.set([0, 0, 0], i * 6);
      arr.set([node.base.x, node.base.y, node.base.z], i * 6 + 3);
    });
    return arr;
  }, [layout]);

  useFrame((_, delta) => {
    const t = reduced ? 1 : eased.current;
    const group = groupRef.current;
    if (group) {
      // 스크롤 진행률에 따라 3/4 바퀴 돈다(한 바퀴는 제자리라 변화가 안 보인다).
      group.rotation.y = t * Math.PI * 1.5;
      group.scale.setScalar(THREE.MathUtils.lerp(0.85, 1, t));
    }
    if (!reduced) {
      nodeRefs.current.forEach((mesh, i) => {
        if (mesh) mesh.rotation.y += delta * layout[i].spin;
      });
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={45}
        near={0.5}
        far={40}
        position={[0, 1.2, 13]}
      />

      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 5]} intensity={2} castShadow />
      <pointLight
        position={[0, 0, 0]}
        intensity={8}
        distance={12}
        color="#a5b4fc"
      />

      <group ref={groupRef}>
        {/* 중심 구 */}
        <mesh castShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial
            color="#4338ca"
            emissive="#4338ca"
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* 연결선 */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#818cf8" transparent opacity={0.35} />
        </lineSegments>

        {/* 궤도 노드 */}
        {layout.map((node, i) => (
          <mesh
            key={i}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            position={node.base}
            castShadow
          >
            <icosahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial
              color="#c7d2fe"
              roughness={0.25}
              metalness={0.1}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
