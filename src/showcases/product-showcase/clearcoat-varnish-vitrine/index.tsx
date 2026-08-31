"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneLabel, SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "코팅 재질 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "hdri-environment",
    "clearcoat-varnish",
  ],
  description:
    "같은 라운드 큐브 4개를 서로 다른 clearcoat 재질로 놓고 비교한다 — 자동차 도장(금속 base + 매끈 코팅), 바니시 목재(거친 나무 base + 매끈 코팅 = 이중 하이라이트), 젖은 표면(거친 무광 base 유지 + 부분 코팅), 오렌지필(clearcoatNormalMap으로 코팅 층만 요철). 구가 아니라 곡률이 넓게 변하는 라운드 큐브라 코팅 하이라이트가 면을 따라 늘어져 base·coat 두 로브가 분리돼 보인다. 오렌지필 노멀맵은 offscreen canvas에서 사인파 높이장으로 절차 생성(에셋 0). IBL은 Lightformer 스트립 라이트(preset 금지). 그리드가 아주 느리게 회전해 좁은 코팅 하이라이트가 넓은 base 하이라이트 위를 미끄러진다.",
};

/** 셀 하나의 재질 정의. */
interface CoatCell {
  label: string;
  /** base 색 */
  color: string;
  /** base 금속성 — 자동차 도장·오렌지필은 1, 나무·젖은 표면은 0 */
  metalness: number;
  /** base 거칠기 — 거칠수록 넓은 하이라이트 (이중 로브의 아래층) */
  roughness: number;
  /** 코팅 세기 — 젖음만 중간값, 나머지는 1 */
  clearcoat: number;
  /** 코팅 거칠기 — base roughness와 독립. 작을수록 선명한 광택 */
  clearcoatRoughness: number;
  /** true면 clearcoatNormalMap을 물려 코팅 층만 요철 (오렌지필) */
  orangePeel?: boolean;
}

/**
 * 4셀 재질 프리셋. 같은 라운드 큐브, 재질만 다르다. 2×2 그리드.
 */
const CELLS: CoatCell[] = [
  {
    label: "자동차 도장\nmetal · coatR 0.05",
    color: "#8a1a1a",
    metalness: 1,
    roughness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  },
  {
    label: "바니시 목재\nbaseR 0.7 · coatR 0.12",
    color: "#7a4a24",
    metalness: 0,
    roughness: 0.7,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  },
  {
    label: "젖은 표면\nclearcoat 0.85",
    color: "#3a3a3a",
    metalness: 0,
    roughness: 0.9,
    clearcoat: 0.85,
    clearcoatRoughness: 0.18,
  },
  {
    label: "오렌지필\nclearcoatNormalMap",
    color: "#d0d0d0",
    metalness: 1,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    orangePeel: true,
  },
];

/** 그리드 배치 — 2열 × 2행. */
const GRID_COLS = 2;
const CELL_SPACING = 2.4;

/** 라운드 큐브 크기·모서리 반경. 곡률이 넓게 변해야 이중 로브가 보인다. */
const BOX_SIZE: [number, number, number] = [1.15, 1.15, 1.15];
const BOX_RADIUS = 0.2;

function cellPosition(index: number): [number, number, number] {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return [
    (col - (GRID_COLS - 1) / 2) * CELL_SPACING,
    ((GRID_COLS - 1) / 2 - row) * CELL_SPACING + 0.2,
    0,
  ];
}

/**
 * 오렌지필 노멀맵을 절차 생성한다.
 *
 * 반복 사인파 높이장에서 유한차분으로 법선을 구해 RGB([-1,1] → [0,1])로
 * 인코딩한다. 에셋 파일 없음. colorSpace는 건드리지 않는다 — 수치 데이터라
 * NoColorSpace(기본값)가 정답이다.
 */
function createOrangePeelNormalMap(
  size = 256,
  frequency = 18,
  amplitude = 1,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const image = ctx.createImageData(size, size);
  const twoPi = Math.PI * 2;

  // 두 방향 사인파를 겹쳐 불규칙한 오돌토돌함을 만든다.
  const height = (x: number, y: number): number => {
    const u = (x / size) * twoPi * frequency;
    const v = (y / size) * twoPi * frequency;
    return (
      Math.sin(u) * Math.cos(v * 0.9) +
      Math.sin(u * 1.7 + 1.3) * Math.cos(v * 1.3) * 0.5
    );
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // 유한차분으로 기울기 → 법선.
      const hL = height(x - 1, y);
      const hR = height(x + 1, y);
      const hD = height(x, y - 1);
      const hU = height(x, y + 1);
      const nx = (hL - hR) * amplitude;
      const ny = (hD - hU) * amplitude;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);

      const idx = (y * size + x) * 4;
      image.data[idx] = ((nx / len) * 0.5 + 0.5) * 255;
      image.data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      image.data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      image.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

interface CoatBoxProps {
  cell: CoatCell;
  position: [number, number, number];
  normalMap: THREE.Texture;
  reducedMotion: boolean;
}

/** 코팅 라운드 큐브 한 개 + 그 아래 재질 요약 라벨. */
function CoatBox({ cell, position, normalMap, reducedMotion }: CoatBoxProps) {
  const boxRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const box = boxRef.current;
    if (!box || reducedMotion) return;
    // 큐브를 제자리에서 아주 느리게 돌린다 — 좁은 코팅 하이라이트가 넓은 base
    // 하이라이트 위를 미끄러지는 게 보인다. 그리드 전체를 돌리면 셀이 화면 밖으로
    // 밀려나므로 각 큐브만 회전한다.
    box.rotation.y += delta * 0.15;
  });

  return (
    <group position={position}>
      <RoundedBox
        ref={boxRef}
        args={BOX_SIZE}
        radius={BOX_RADIUS}
        smoothness={6}
        castShadow
      >
        <meshPhysicalMaterial
          color={cell.color}
          metalness={cell.metalness}
          roughness={cell.roughness}
          clearcoat={cell.clearcoat}
          clearcoatRoughness={cell.clearcoatRoughness}
          clearcoatNormalMap={cell.orangePeel ? normalMap : null}
          clearcoatNormalScale={
            cell.orangePeel ? new THREE.Vector2(0.3, 0.3) : undefined
          }
          envMapIntensity={1}
        />
      </RoundedBox>

      <SceneLabel
        position={[0, -BOX_SIZE[1] / 2 - 0.4, 0]}
        fontSize={0.15}
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

/** 재질 파라미터 계기판 — 각 셀 값을 텍스트로 요약 (setState 아님, ref 갱신). */
function MaterialReadout() {
  // 정적 요약이지만 troika 초기화 타이밍 문제를 피해 SceneReadout로 갱신한다.
  const getText = useCallback(
    () =>
      "clearcoat = base 위 얇은 유전체 코팅 · 반사는 항상 흰색(IOR≈1.5)\n" +
      "이중 로브 = 거친 base 하이라이트 + 매끈한 코팅 하이라이트",
    [],
  );

  return (
    <SceneReadout
      getText={getText}
      backdrop={[6.4, 1]}
      position={[0, 3.4, -1]}
      fontSize={0.17}
      color="#cdd6f4"
      textAlign="center"
      lineHeight={1.5}
    />
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();

  // 오렌지필 노멀맵 — 컴포넌트 안에서 절차 생성. 언마운트 시 dispose.
  const orangePeelNormal = useMemo(() => createOrangePeelNormalMap(), []);
  useEffect(() => () => orangePeelNormal.dispose(), [orangePeelNormal]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0.4, 7.5]}
        fov={44}
        near={0.1}
        far={100}
      />

      {/*
        코팅 반사는 비출 환경이 없으면 안 보인다. Lightformer로 절차 생성해
        외부 파일 의존을 없앴다(preset 금지). 형태가 뚜렷한 사각 스트립일수록
        코팅 하이라이트가 선명하다.
      */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={5}
          scale={[10, 3]}
          position={[0, 5, -3]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={2.5}
          scale={[6, 4]}
          position={[-6, 1, 3]}
          color="#a8c8ff"
        />
        <Lightformer
          form="rect"
          intensity={2}
          scale={[5, 3]}
          position={[6, 2, 3]}
          color="#ffd9a8"
        />
      </Environment>

      {/* 환경맵은 또렷한 그림자를 안 만들므로 key light 하나 병행. */}
      <directionalLight position={[4, 6, 5]} intensity={1.1} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#15161a" roughness={0.95} metalness={0} />
      </mesh>

      {CELLS.map((cell, index) => (
        <CoatBox
          key={cell.label}
          cell={cell}
          position={cellPosition(index)}
          normalMap={orangePeelNormal}
          reducedMotion={reducedMotion}
        />
      ))}

      <MaterialReadout />
    </>
  );
}
