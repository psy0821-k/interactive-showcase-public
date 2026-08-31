"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Clone,
  Environment,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "에셋 예산: 구름",
  category: "data-visualization",
  usedSkills: ["asset-optimization", "gltf-model-loading", "hdri-environment"],
  description:
    "asset-optimization 파이프라인이 실제로 먹었는지를 씬이 숫자로 보여준다. cloud.glb 71.3MB → cloud-opt.glb 5.4MB(Draco + 1024/WebP), classroom.hdr 93.7MB → classroom-1k.hdr 2.0MB(RGBELoader 다운샘플). 계기판은 원본/최적화 크기를 나란히 두고, gl.info.memory의 geometries·textures와 gl.info.render의 삼각형·드로우콜을 실시간으로 갱신한다. Draco 디코더는 public/draco/ 자체 호스팅 — useGLTF의 두 번째 인자로 경로를 준다(gltf-model-loading 6절).",
};

/** public/ 기준 절대 경로. optimize-assets.mjs 산출물. */
const CLOUD_URL = "/models/cloud-opt.glb";
const HDRI_URL = "/hdri/classroom-1k.hdr";
/** Draco 디코더 자체 호스팅 경로. optimize-assets.mjs가 복사한다. */
const DRACO_PATH = "/draco/";

/** 최적화 전 원본 크기(디스크 기준, 상수). 계기판 상단 줄. */
const ORIGINAL_LABEL = "원본  cloud.glb 71.3 MB · classroom.hdr 93.7 MB";
/** 최적화본 크기(실측, 상수). dev 서버 gzip 때문에 Network 값은 신뢰 못 하므로 병기. */
const OPTIMIZED_LABEL = "최적화  cloud-opt.glb 5.4 MB · classroom-1k.hdr 2.0 MB";

/** 모델을 정규화할 목표 크기(월드 유닛). */
const TARGET_SIZE = 3.2;
/** 아주 느린 회전 각속도. reduced-motion이면 0. */
const SPIN_SPEED = 0.06;


/**
 * 모델 바운딩 박스를 재서 "최대 변이 TARGET_SIZE, 중심이 원점"이 되는
 * 스케일·오프셋을 계산한다. glb는 단위가 제각각이라 눈대중 금지.
 */
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
 * 최적화된 구름 모델.
 *
 * Draco 압축본이라 useGLTF 두 번째 인자로 디코더 경로를 준다. 이게 없으면
 * "No DRACOLoader instance provided" 에러로 아무것도 안 보인다(gltf-model-loading 6절).
 */
function CloudModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(CLOUD_URL, DRACO_PATH);

  const { scale, offset } = useMemo(
    () => measureNormalization(scene),
    [scene],
  );

  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || reducedMotion) return;
    group.rotation.y += delta * SPIN_SPEED;
  });

  return (
    // 계기판(상단)과 겹치지 않게 구름을 화면 아래쪽에 놓는다.
    <group ref={groupRef} position={[0, -0.7, 0]}>
      <group scale={scale} position={offset}>
        <Clone object={scene} />
      </group>
    </group>
  );
}

/**
 * 로딩 예산 계기판.
 *
 * gl.info.memory / gl.info.render 를 매 프레임 읽어 troika 텍스트에 직접 쓴다.
 * setState를 쓰면 리렌더가 나고 그 리렌더가 측정 대상인 렌더 비용을 바꾼다.
 */
function BudgetMeter() {
  const gl = useThree((state) => state.gl);

  const getText = useCallback(() => {
    const { geometries, textures } = gl.info.memory;
    const { triangles, calls } = gl.info.render;
    return (
      `${ORIGINAL_LABEL}\n` +
      `${OPTIMIZED_LABEL}\n` +
      `\n` +
      `GPU  geometries ${geometries} · textures ${textures}\n` +
      `render  삼각형 ${triangles.toLocaleString("ko-KR")} · 드로우콜 ${calls}`
    );
  }, [gl]);

  return (
    <SceneReadout
      getText={getText}
      backdrop={[6.4, 2.4]}
      backdropOpacity={0.74}
      position={[0, 1.9, 1.5]}
      fontSize={0.2}
      color="#cdd6f4"
      textAlign="center"
      lineHeight={1.55}
    />
  );
}

/** 로딩 동안 자리를 지키는 fallback. */
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y = state.clock.elapsedTime * 0.9;
  });
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.9, 0]} />
      <meshStandardMaterial color="#7f8ea3" wireframe />
    </mesh>
  );
}

export function Scene() {
  useEffect(() => {
    useGLTF.preload(CLOUD_URL, DRACO_PATH);
  }, []);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 1.6, 8.5]}
        fov={42}
        near={0.1}
        far={100}
      />

      {/* 교실 HDRI — 배경 + IBL. optimize-assets.mjs가 만든 2.0MB 다운샘플본. */}
      <Environment files={HDRI_URL} background environmentIntensity={1.1} />

      {/* HDRI는 방향 그림자를 안 만들므로 key 하나를 병행한다(hdri-environment 43줄).
          구름 모델 재질이 어두워 IBL만으로는 실루엣만 보이므로 강하게 준다. */}
      <directionalLight position={[4, 6, 5]} intensity={2.6} />
      <directionalLight position={[-4, 2, -3]} intensity={0.8} />

      <Suspense fallback={<LoadingPlaceholder />}>
        <CloudModel />
      </Suspense>

      <BudgetMeter />
    </>
  );
}
