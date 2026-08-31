"use client";

export { meta } from "./meta";

// cspell:ignore nior -- 라벨 문자열의 "\n" + "ior"(굴절률)가 합쳐져 보이는 것

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  PerspectiveCamera,
} from "@react-three/drei";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneLabel, SceneReadout } from "@/components/scene-label";

/** 셀 하나의 재질 정의. */
interface GlassCell {
  label: string;
  /** MeshPhysicalMaterial(false) 또는 MeshTransmissionMaterial(true) */
  useMTM: boolean;
  ior: number;
  thickness: number;
  roughness: number;
  /** Beer-Lambert 흡수 색. 없으면 맑음. */
  attenuationColor?: string;
  attenuationDistance?: number;
  /** MeshPhysicalMaterial dispersion / MTM chromaticAberration */
  dispersion?: number;
  chromaticAberration?: number;
  /** 이 셀만 아주 느리게 회전 (색수차 히어로) */
  spin?: boolean;
}

/**
 * 6셀 재질 프리셋. 같은 구, 재질만 다르다.
 * 3×2 그리드로 배치된다.
 */
const CELLS: GlassCell[] = [
  {
    label: "맑은 유리\nPhysical  ior 1.5",
    useMTM: false,
    ior: 1.5,
    thickness: 0.5,
    roughness: 0,
  },
  {
    label: "맑은 유리\nMTM  배경 굴절",
    useMTM: true,
    ior: 1.5,
    thickness: 0.5,
    roughness: 0,
  },
  {
    label: "간유리\nroughness 0.45",
    useMTM: true,
    ior: 1.5,
    thickness: 0.4,
    roughness: 0.45,
  },
  {
    label: "색유리\nattenuation 0.4",
    useMTM: true,
    ior: 1.5,
    thickness: 0.6,
    roughness: 0,
    attenuationColor: "#2f9e6e",
    attenuationDistance: 0.4,
  },
  {
    label: "액체\nior 1.33  레드",
    useMTM: true,
    ior: 1.33,
    thickness: 0.6,
    roughness: 0,
    attenuationColor: "#a82424",
    attenuationDistance: 0.5,
  },
  {
    label: "색수차\ndispersion",
    useMTM: false,
    ior: 1.5,
    thickness: 0.7,
    roughness: 0,
    dispersion: 0.06,
    spin: true,
  },
];

/** 그리드 배치 — 3열 × 2행. */
const GRID_COLS = 3;
const CELL_SPACING = 2.2;

/** 구 반지름. 굴절이 각지지 않게 세그먼트를 충분히 준다. */
const SPHERE_RADIUS = 0.7;

function cellPosition(index: number): [number, number, number] {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return [
    (col - (GRID_COLS - 1) / 2) * CELL_SPACING,
    (0.5 - row) * CELL_SPACING + 0.3,
    0,
  ];
}

interface GlassSphereProps {
  cell: GlassCell;
  position: [number, number, number];
  reducedMotion: boolean;
}

/** 유리 구 한 개 + 그 아래 재질 요약 라벨. */
function GlassSphere({ cell, position, reducedMotion }: GlassSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !cell.spin || reducedMotion) return;
    mesh.rotation.y += delta * 0.15;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow={false}>
        <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
        {cell.useMTM ? (
          <MeshTransmissionMaterial
            transmission={1}
            ior={cell.ior}
            thickness={cell.thickness}
            roughness={cell.roughness}
            // 색수차·roughness가 있으면 샘플을 늘려 노이즈를 줄인다.
            samples={cell.roughness > 0 || cell.chromaticAberration ? 12 : 6}
            resolution={512}
            // 여러 MTM이 배경 버퍼를 한 번만 렌더해 공유한다(성능 절).
            transmissionSampler
            anisotropicBlur={cell.roughness > 0 ? 0.6 : 0}
            chromaticAberration={cell.chromaticAberration ?? 0}
            attenuationColor={cell.attenuationColor ?? "#ffffff"}
            attenuationDistance={cell.attenuationDistance ?? Infinity}
          />
        ) : (
          <meshPhysicalMaterial
            transmission={1}
            ior={cell.ior}
            thickness={cell.thickness}
            roughness={cell.roughness}
            dispersion={cell.dispersion ?? 0}
            attenuationColor={cell.attenuationColor ?? "#ffffff"}
            attenuationDistance={cell.attenuationDistance ?? Infinity}
            envMapIntensity={1}
          />
        )}
      </mesh>

      <SceneLabel
        position={[0, -SPHERE_RADIUS - 0.35, 0]}
        fontSize={0.16}
        color="#cdd6f4"
        anchorY="top"
        textAlign="center"
        lineHeight={1.4}
        outlineWidth={0.004}
      >
        {cell.label}
      </SceneLabel>
    </group>
  );
}

/** gl.info.render.calls 계기판 — transmissionSampler 효과를 숫자로 보여준다. */
function RenderStats() {
  const gl = useThree((state) => state.gl);

  const getText = useCallback(() => {
    const { calls, triangles } = gl.info.render;
    return (
      `드로우콜 ${calls}  ·  삼각형 ${triangles.toLocaleString("ko-KR")}\n` +
      `MTM 4개 · transmissionSampler 공유`
    );
  }, [gl]);

  return (
    <SceneReadout
      getText={getText}
      backdrop={[5.8, 1.1]}
      position={[0, 3.5, -1]}
      fontSize={0.2}
      color="#cdd6f4"
      textAlign="center"
      lineHeight={1.5}
    />
  );
}

/** 유리 뒤 격자 패턴 배경 — 굴절·프로스팅이 배경을 어떻게 왜곡하는지 드러낸다. */
function PatternBackdrop() {
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1a1f2b";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "#4a90d9";
      ctx.lineWidth = 3;
      const step = size / 12;
      for (let i = 0; i <= 12; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * step, 0);
        ctx.lineTo(i * step, size);
        ctx.moveTo(0, i * step);
        ctx.lineTo(size, i * step);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0.5, -2.4]}>
      <planeGeometry args={[14, 9]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0.6, 7.5]}
        fov={44}
        near={0.1}
        far={100}
      />

      {/*
        투과 재질은 굴절·반사할 환경이 없으면 시커멓게 나온다.
        Lightformer로 절차 생성해 외부 파일 의존을 없앴다(preset 금지).
      */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={5}
          scale={[12, 6]}
          position={[0, 6, -4]}
          color="#ffffff"
        />
        <Lightformer
          form="circle"
          intensity={2.5}
          scale={5}
          position={[-7, 2, 4]}
          color="#a8c8ff"
        />
        <Lightformer
          form="rect"
          intensity={2}
          scale={[6, 4]}
          position={[7, 1, 4]}
          color="#ffd9a8"
        />
      </Environment>

      {/* 환경맵은 또렷한 그림자를 안 만들므로 key light 하나 병행 (유리는 castShadow off). */}
      <directionalLight position={[4, 6, 5]} intensity={1} />

      <PatternBackdrop />

      {CELLS.map((cell, index) => (
        <GlassSphere
          key={cell.label}
          cell={cell}
          position={cellPosition(index)}
          reducedMotion={reducedMotion}
        />
      ))}

      <RenderStats />
    </>
  );
}
