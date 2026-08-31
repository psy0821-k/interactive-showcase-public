"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import { type ThreeEvent } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { SceneLabel, SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "그림자 품질 진열대",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "shadow-setup"],
  description:
    "directionalLight 그림자의 3대 아티팩트 — 표면 줄무늬(acne), 씬 일부에서 끊기는 frustum 잘림, 계단처럼 각진 가장자리 — 를 한 화면에서 동시에 노출하고, 클릭 한 번으로 교정값을 적용해 대조한다. broken 세트는 bias=0 / mapSize=512 / shadow-camera 기본(±5), fixed 세트는 normalBias=0.035 / mapSize=2048 / 씬에 맞춘 frustum. fixed에서는 노란 CameraHelper 와이어프레임이 그림자 카메라 절두체를 그려 frustum이 씬을 감싸는지 눈으로 확인시킨다.",
};

/** broken / fixed 두 세트의 그림자 파라미터. 화면에서 대조하는 대상이다. */
interface ShadowPreset {
  bias: number;
  normalBias: number;
  mapSize: number;
  /** shadow-camera 직교 절두체의 반경 (±extent) */
  frustumExtent: number;
  near: number;
  far: number;
}

/**
 * broken: 전부 기본값. 넓은 바닥(가로세로 24유닛) 위에서
 * - bias=0        → 곡면·비스듬한 면에 acne 줄무늬
 * - mapSize=512   → 그림자 가장자리 계단
 * - frustumExtent=5 → 씬(반경 ~9)을 못 담아 한쪽 그림자가 잘림
 * 세 아티팩트가 동시에 보인다.
 */
const BROKEN_PRESET: ShadowPreset = {
  bias: 0,
  normalBias: 0,
  mapSize: 512,
  frustumExtent: 5,
  near: 0.5,
  far: 500,
};

/**
 * fixed: shadow-setup의 교정 순서를 그대로 적용.
 * 1) frustumExtent를 오브젝트가 놓인 영역(반경 ~11)에 맞춰 좁힌다.
 *    broken의 ±5는 씬을 절반도 못 담았다.
 * 2) near/far는 광원(8,6,5)에서 씬을 통과하는 깊이 범위를 감싸게.
 *    광원에서 바닥 먼 모서리까지가 약 27이라 far는 그보다 여유 있게 34.
 * 3) normalBias로 acne를 잡고 mapSize를 2048로 올린다.
 */
const FIXED_PRESET: ShadowPreset = {
  bias: -0.0002,
  normalBias: 0.035,
  mapSize: 2048,
  frustumExtent: 11,
  near: 2,
  far: 34,
};

/**
 * 광원 위치. 낮은 편의 저각 — 빛이 표면에 비스듬히 들어올수록 섀도우맵
 * 텍셀당 깊이 변화가 커져 acne(줄무늬)가 심해지고, 그림자도 길게 늘어져
 * frustum(±5) 밖으로 삐져나간다. 다만 너무 낮추면 직교 그림자 카메라가
 * 거의 수평이 되어 near/far 잡기가 불안정하므로 y는 6 정도로 둔다.
 */
const LIGHT_POSITION: [number, number, number] = [8, 6, 5];

/** 기둥 배치 — 서로 다른 높이·간격. 결정적(Math.random 없음). */
const PILLARS: { x: number; z: number; height: number }[] = [
  { x: -5.5, z: -1.5, height: 3.2 },
  { x: -2.5, z: 1.5, height: 1.8 },
  { x: 0.5, z: -2.5, height: 4.0 },
  { x: 3.5, z: 0.5, height: 2.4 },
  { x: 6.0, z: -1.0, height: 3.0 },
];

/** 구 배치 — 곡면 acne가 가장 잘 보이는 오브젝트. */
const SPHERES: { x: number; z: number; radius: number }[] = [
  { x: -1.0, z: 3.5, radius: 1.1 },
  { x: 4.5, z: 3.0, radius: 0.8 },
];

const PILLAR_RADIUS = 0.55;
/** 바닥은 broken 세트에서 frustum 밖으로 삐져나가도록 넉넉히 깐다. */
const FLOOR_SIZE = 24;

interface ShadowRigProps {
  preset: ShadowPreset;
  /** fixed 모드에서만 CameraHelper를 그린다. */
  showHelper: boolean;
  /** 계기판이 읽을 수 있도록 조명 ref를 위로 전달한다. */
  lightRef: RefObject<THREE.DirectionalLight | null>;
}

/**
 * 조명 + 그림자 파라미터를 preset에서 받아 적용하는 리그.
 *
 * 절두체는 `shadow-camera-*` 개별 prop으로 넘긴다(R3F가 지원하고, 값이 바뀌면
 * 내부적으로 `updateProjectionMatrix`를 부른다). CameraHelper는 조명이
 * 마운트된 뒤 `light.shadow.camera`를 별도 ref에 담아 그린다.
 */
function ShadowRig({ preset, showHelper, lightRef }: ShadowRigProps) {
  // CameraHelper에 넘길 대상. 조명 마운트 후 light.shadow.camera를 담는다.
  const shadowCameraRef = useRef<THREE.Camera | null>(null);

  useHelper(
    showHelper ? (shadowCameraRef as RefObject<THREE.Object3D>) : false,
    THREE.CameraHelper,
  );

  // 절두체는 useLayoutEffect에서만 세팅한다(lantern-shadow-study와 동일 패턴).
  // shadow-camera-* prop과 병용하면 R3F의 applyProps와 순서가 꼬여
  // updateProjectionMatrix가 누락되고 그림자가 렌더되지 않는다.
  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) return;
    const cam = light.shadow.camera as THREE.OrthographicCamera;
    cam.left = -preset.frustumExtent;
    cam.right = preset.frustumExtent;
    cam.top = preset.frustumExtent;
    cam.bottom = -preset.frustumExtent;
    cam.near = preset.near;
    cam.far = preset.far;
    cam.updateProjectionMatrix();
    shadowCameraRef.current = cam;
    light.shadow.needsUpdate = true;
  }, [preset, lightRef, showHelper]);

  return (
    <directionalLight
      ref={lightRef}
      position={LIGHT_POSITION}
      intensity={2.6}
      castShadow
      shadow-bias={preset.bias}
      shadow-normalBias={preset.normalBias}
      shadow-mapSize={[preset.mapSize, preset.mapSize]}
    />
  );
}

/** 기둥·구를 담는 정적 지오메트리. 머티리얼은 상위에서 공유받는다. */
function Vitrine({ material }: { material: THREE.Material }) {
  return (
    <>
      {PILLARS.map((pillar) => (
        <mesh
          key={`p-${pillar.x}-${pillar.z}`}
          position={[pillar.x, pillar.height / 2, pillar.z]}
          material={material}
          castShadow
          receiveShadow
        >
          <cylinderGeometry
            args={[PILLAR_RADIUS, PILLAR_RADIUS, pillar.height, 24]}
          />
        </mesh>
      ))}

      {SPHERES.map((sphere) => (
        <mesh
          key={`s-${sphere.x}-${sphere.z}`}
          position={[sphere.x, sphere.radius, sphere.z]}
          material={material}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[sphere.radius, 48, 32]} />
        </mesh>
      ))}
    </>
  );
}

interface ToggleButtonProps {
  mode: "broken" | "fixed";
  onToggle: () => void;
}

/** 클릭으로 broken ↔ fixed를 전환하는 3D 버튼. */
function ToggleButton({ mode, onToggle }: ToggleButtonProps) {
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  return (
    <group position={[0, 0.02, 6.5]}>
      <mesh onClick={handleClick} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.5, 1.1]} />
        <meshStandardMaterial
          color={mode === "fixed" ? "#7bd88f" : "#e0574a"}
          roughness={0.5}
        />
      </mesh>
      <SceneLabel
        position={[0, 0.32, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color="#0b0e14"
        anchorY="middle"
        outlineWidth={0}
      >
        {mode === "fixed" ? "FIXED (클릭: broken)" : "BROKEN (클릭: fixed)"}
      </SceneLabel>
    </group>
  );
}

interface ShadowStatsProps {
  preset: ShadowPreset;
  mode: "broken" | "fixed";
  lightRef: RefObject<THREE.DirectionalLight | null>;
}

/**
 * 현재 세트 이름 + bias / normalBias / mapSize / shadow.camera 범위를 찍는다.
 *
 * useFrame 안에서 setState를 부르지 않는다 — 매 프레임 리렌더가 나고, 그 리렌더
 * 자체가 섀도우맵 렌더 비용을 바꾼다. troika 메시의 text 속성을 ref로 직접 쓴다.
 */
function ShadowStats({ preset, mode, lightRef }: ShadowStatsProps) {
  const getText = useCallback(() => {
    // preset은 선언값, light.shadow.camera는 실제 적용값 — 둘이 일치하는지 본다.
    const light = lightRef.current;
    const cam = light?.shadow.camera as THREE.OrthographicCamera | undefined;

    const frustumLine = cam
      ? `frustum  L${cam.left.toFixed(0)} R${cam.right.toFixed(0)} ` +
        `T${cam.top.toFixed(0)} B${cam.bottom.toFixed(0)} ` +
        `N${cam.near.toFixed(0)} F${cam.far.toFixed(0)}`
      : `frustum  ±${preset.frustumExtent}`;

    return (
      `[ ${mode.toUpperCase()} ]\n` +
      `bias ${preset.bias}   normalBias ${preset.normalBias}\n` +
      `mapSize ${preset.mapSize}\n` +
      frustumLine
    );
  }, [preset, mode, lightRef]);

  return (
    <SceneReadout
      getText={getText}
      interval={0.25}
      position={[0, 4.2, -3]}
      fontSize={0.36}
      color="#cdd6f4"
      textAlign="center"
      lineHeight={1.4}
    />
  );
}

export function Scene() {
  const [mode, setMode] = useState<"broken" | "fixed">("broken");
  const preset = mode === "fixed" ? FIXED_PRESET : BROKEN_PRESET;

  // 조명 ref는 ShadowRig가 세팅하고 ShadowStats가 읽는다.
  const lightRef = useRef<THREE.DirectionalLight | null>(null);

  const handleToggle = useCallback(() => {
    setMode((current) => (current === "broken" ? "fixed" : "broken"));
  }, []);

  // 오브젝트 전체가 공유하는 무광 회색 머티리얼. acne는 재질색과 무관하게 보인다.
  const bodyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c2c7d0", roughness: 0.75 }),
    [],
  );
  const floorMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3a3f4b", roughness: 0.95 }),
    [],
  );

  useEffect(
    () => () => {
      bodyMaterial.dispose();
      floorMaterial.dispose();
    },
    [bodyMaterial, floorMaterial],
  );

  return (
    <>
      {/* 저각 구도 — 그림자가 화면에서 길게 늘어져 아티팩트가 잘 보인다. */}
      <PerspectiveCamera
        makeDefault
        position={[0, 8.5, 17]}
        fov={44}
        near={0.1}
        far={100}
      />

      {/* fill 하나만. 그림자는 key(ShadowRig) 하나만 드리운다. */}
      <ambientLight intensity={0.28} />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#8fb4ff" />

      {/*
        key={mode} — broken↔fixed 전환 시 조명을 통째로 재마운트한다.
        mapSize가 512↔2048로 바뀌면 섀도우맵이 재할당되는데, 그 과정에서
        useLayoutEffect로 세팅한 절두체가 반영되지 않는 경우가 있다.
        재마운트하면 새 조명에서 절두체·섀도우맵이 처음부터 일관되게 잡힌다.
      */}
      <ShadowRig
        key={mode}
        preset={preset}
        showHelper={mode === "fixed"}
        lightRef={lightRef}
      />

      {/* 넓은 바닥 — broken 세트에서 frustum(±5) 밖으로 삐져나간다. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={floorMaterial}
        receiveShadow
      >
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
      </mesh>

      <Vitrine material={bodyMaterial} />
      <ToggleButton mode={mode} onToggle={handleToggle} />
      <ShadowStats preset={preset} mode={mode} lightRef={lightRef} />
    </>
  );
}
