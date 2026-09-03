"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Clone, PerspectiveCamera, useGLTF } from "@react-three/drei";
import type { LandingSceneContext } from "../landing-shell";
import { useEasedProgress } from "./use-eased-progress";
import { useUiMockTexture } from "./use-ui-mock-texture";

/** asset-optimization 파이프라인 산출물. 원본 cloud.glb(71MB)는 커밋·서빙 금지. */
const CLOUD_URL = "/models/cloud-opt.glb";
/** Draco 디코더 자체 호스팅 경로. 없으면 "No DRACOLoader instance provided". */
const DRACO_PATH = "/draco/";

/** 모델을 정규화할 목표 크기(월드 유닛). glb는 단위가 제각각이라 눈대중 금지. */
const TARGET_SIZE = 6;
/** 상시 부유 각속도. */
const DRIFT_SPEED = 0.04;

/** 바운딩 박스로 "최대 변 = TARGET_SIZE, 중심 = 원점" 스케일·오프셋 계산. */
function measureNormalization(object: THREE.Object3D): {
  scale: number;
  offset: THREE.Vector3;
} {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxAxis = Math.max(size.x, size.y, size.z);
  const scale = maxAxis > 0 ? TARGET_SIZE / maxAxis : 1;
  return { scale, offset: center.multiplyScalar(-scale) };
}

/**
 * Fluxnote Cloud 히어로.
 *
 * Draco 압축 구름 두 덩이가 좌우로 떠 있고, 스크롤 진행률 0→1에 따라
 * 카메라가 두 구름 사이를 z축으로 통과한다. 통과하면 안쪽에 놓인
 * 제품 UI 판(간단한 색 블록)이 정면에 드러난다.
 */
export function CloudSyncScene({ progress, reduced }: LandingSceneContext) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const panelRef = useRef<THREE.Mesh>(null);

  // 이미지 에셋 없이 코드로 그린 Fluxnote 대시보드 목업.
  const uiTexture = useUiMockTexture({ kind: "dashboard", accent: "#38bdf8" });

  const { scene } = useGLTF(CLOUD_URL, DRACO_PATH);

  // 원본 재질이 어두워 조명을 못 받는다. 구름이니 밝은 흰색 계열로 오버라이드.
  const preparedScene = useMemo(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = new THREE.MeshStandardMaterial({
          color: "#e8eef5",
          roughness: 0.9,
          metalness: 0,
        });
        obj.castShadow = true;
      }
    });
    return scene;
  }, [scene]);

  const { scale, offset } = useMemo(
    () => measureNormalization(preparedScene),
    [preparedScene],
  );

  const eased = useEasedProgress(progress);

  useFrame((state, delta) => {
    const camera = cameraRef.current;
    const panel = panelRef.current;
    const t = reduced ? 1 : eased.current;

    // 카메라: z 7 → -2 로 전진하며 살짝 아래를 본다.
    if (camera) {
      camera.position.z = THREE.MathUtils.lerp(7, -2, t);
      camera.position.y = THREE.MathUtils.lerp(0.3, 0, t);
      camera.lookAt(0, 0, -6);
    }

    // 구름: 처음엔 화면 중앙에서 겹쳐 있다가, 통과할수록 좌우로 벌어져 길을 연다.
    const spread = THREE.MathUtils.lerp(2.2, 6.5, t);
    if (leftRef.current) leftRef.current.position.x = -spread;
    if (rightRef.current) rightRef.current.position.x = spread;

    // 제품 판: 후반부에 페이드인(머티리얼 opacity).
    if (panel) {
      const reveal = THREE.MathUtils.clamp((t - 0.55) / 0.35, 0, 1);
      const mat = panel.material as THREE.MeshStandardMaterial;
      mat.transparent = true;
      mat.opacity = reveal;
      panel.visible = reveal > 0.001;
    }

    // 상시 부유 (reduced면 정지).
    if (!reduced) {
      const bob = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
      if (leftRef.current) leftRef.current.position.y = bob;
      if (rightRef.current) rightRef.current.position.y = -bob;
      if (leftRef.current) leftRef.current.rotation.y += delta * DRIFT_SPEED;
      if (rightRef.current)
        rightRef.current.rotation.y -= delta * DRIFT_SPEED;
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={50}
        near={0.1}
        far={100}
        position={[0, 0.3, 7]}
      />

      {/* standard-scene-setup: 하늘광 + 키 + 필 */}
      <hemisphereLight args={["#e0f2fe", "#1e293b", 1.4]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={3} castShadow />
      <directionalLight position={[-6, 2, -4]} intensity={1.2} color="#bae6fd" />

      <group ref={leftRef} position={[-3.2, 0, 0]}>
        <group scale={scale} position={offset}>
          <Clone object={preparedScene} />
        </group>
      </group>
      <group ref={rightRef} position={[3.2, 0, 0]} rotation={[0, Math.PI, 0]}>
        <group scale={scale} position={offset}>
          <Clone object={preparedScene} />
        </group>
      </group>

      {/* 안쪽 제품 UI 판 — 코드로 그린 대시보드 목업 텍스처 */}
      <mesh ref={panelRef} position={[0, 0, -6]} visible={false}>
        <planeGeometry args={[4.8, 3]} />
        <meshStandardMaterial
          map={uiTexture}
          roughness={0.5}
          transparent
          opacity={0}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CLOUD_URL, DRACO_PATH);
