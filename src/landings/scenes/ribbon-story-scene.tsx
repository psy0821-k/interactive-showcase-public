"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { LandingSceneContext } from "../landing-shell";
import { useEasedProgress } from "./use-eased-progress";

/** 리본을 정의하는 제어점. S자로 공간을 가로지른다. */
const CONTROL_POINTS = [
  new THREE.Vector3(-6, -2, 4),
  new THREE.Vector3(-2, 1.5, 0),
  new THREE.Vector3(2, -1.5, -4),
  new THREE.Vector3(5, 2, -9),
  new THREE.Vector3(1, 0, -14),
];

/** 리본을 따라 놓이는 마커(스토리 지점) 위치 t. */
const MARKER_TS = [0.15, 0.5, 0.85];

/**
 * Fluxnote Story 히어로.
 *
 * CatmullRomCurve3 + TubeGeometry로 만든 리본이 공간을 가로지른다.
 * 스크롤 진행률을 곡선 매개변수 t로 써서 카메라가 리본을 따라 날아간다
 * (getPointAt / getTangentAt). 리본 위 마커 3개가 스토리 지점을 표시한다.
 */
export function RibbonStoryScene({ progress, reduced }: LandingSceneContext) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const eased = useEasedProgress(progress, { smooth: true, stiffness: 3 });

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(CONTROL_POINTS, false, "catmullrom", 0.5),
    [],
  );

  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 200, 0.4, 16, false),
    [curve],
  );

  const markers = useMemo(
    () => MARKER_TS.map((t) => curve.getPointAt(t)),
    [curve],
  );

  // 재사용 벡터.
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    // 리본 초입(t≈0.08)에서 시작해 끝(t≈0.95)까지. 0에서 시작하면 리본이
    // 화면 밖이라 히어로가 비어 보인다. reduced면 초입에 고정.
    const raw = reduced ? 0 : eased.current;
    const t = THREE.MathUtils.lerp(0.08, 0.95, raw);

    curve.getPointAt(t, camPos);
    curve.getTangentAt(t, tangent);

    // 리본을 옆·위에서 넓게 조망하며 따라간다. 접선 반대로 물러서고(진행 방향을
    // 앞에 두고), 위로 크게 띄우고, 접선에 수직인 방향으로 옆으로 비켜 리본
    // 표면에 파묻히지 않게 한다.
    const side = new THREE.Vector3()
      .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
      .normalize();
    camera.position
      .copy(camPos)
      .addScaledVector(tangent, -5)
      .addScaledVector(side, 3.5)
      .add(new THREE.Vector3(0, 3.5, 0));
    curve.getPointAt(Math.min(t + 0.08, 1), lookTarget);
    camera.lookAt(lookTarget);
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={55}
        near={0.1}
        far={60}
        position={[-6, -1, 6]}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 3]} intensity={2} castShadow />
      <directionalLight position={[-4, 2, -6]} intensity={0.6} color="#f9a8d4" />

      {/* 리본 */}
      <mesh geometry={tubeGeometry} castShadow>
        <meshStandardMaterial
          color="#be185d"
          emissive="#ec4899"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 스토리 마커 */}
      {markers.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial
            color="#fbcfe8"
            emissive="#f9a8d4"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
      ))}
    </>
  );
}
