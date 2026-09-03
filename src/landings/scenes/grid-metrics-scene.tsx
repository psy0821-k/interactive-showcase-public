'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import type { LandingSceneContext } from '../landing-shell';
import { useEasedProgress } from './use-eased-progress';

/** 그리드 한 변의 막대 수. 12×12 = 144개. */
const GRID = 12;
/** 막대 간격. */
const SPACING = 0.5;

const COUNT = GRID * GRID;
/** 재사용 매트릭스 — 매 프레임 new 하지 않는다. */
const DUMMY = new THREE.Object3D();

/**
 * Fluxnote Analytics 히어로.
 *
 * InstancedMesh 하나로 12×12 막대 그리드를 그린다(드로우콜 1, merge-draw-calls).
 * 스크롤 진행률 0→1에 따라 각 막대가 0에서 목표 높이까지 자란다 —
 * 가운데에서 바깥으로 퍼지는 순서(중심 거리 기반 스태거).
 */
export function GridMetricsScene({ progress, reduced }: LandingSceneContext) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const eased = useEasedProgress(progress);

  // 인스턴스별 위치·목표높이·스태거 오프셋.
  const cells = useMemo(() => {
    const half = (GRID - 1) / 2;
    const maxDist = Math.hypot(half, half);
    return Array.from({ length: COUNT }, (_, i) => {
      const col = i % GRID;
      const row = Math.floor(i / GRID);
      const x = (col - half) * SPACING;
      const z = (row - half) * SPACING;
      const dist = Math.hypot(col - half, row - half);
      // 유사난수 목표 높이 (0.4 ~ 2.4).
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const targetH = 0.4 + (seed - Math.floor(seed)) * 2;
      return { x, z, targetH, stagger: (dist / maxDist) * 0.5 };
    });
  }, []);

  // 초기 배치 (높이 최소).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    cells.forEach((cell, i) => {
      DUMMY.position.set(cell.x, 0.01, cell.z);
      DUMMY.scale.set(1, 0.02, 1);
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = reduced ? 1 : eased.current;
    cells.forEach((cell, i) => {
      const local = THREE.MathUtils.clamp(
        (t - cell.stagger) / (1 - cell.stagger),
        0,
        1,
      );
      const h = Math.max(0.02, cell.targetH * local);
      DUMMY.position.set(cell.x, h / 2, cell.z);
      DUMMY.scale.set(1, h, 1);
      DUMMY.updateMatrix();
      mesh.setMatrixAt(i, DUMMY.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={40}
        near={0.5}
        far={40}
        position={[0, 5.5, 8]}
        rotation={[-0.5, 0, 0]}
      />

      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 9, 4]} intensity={2.2} castShadow />
      <directionalLight
        position={[-5, 3, -3]}
        intensity={0.5}
        color="#fcd34d"
      />

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, COUNT]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[SPACING * 0.7, 1, SPACING * 0.7]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} />
      </instancedMesh>

      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1c1917" roughness={0.95} />
      </mesh>
    </>
  );
}
