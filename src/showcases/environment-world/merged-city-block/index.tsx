"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { SceneLabel, SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "병합된 도시 블록",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "merge-draw-calls", "instanced-particles"],
  description:
    "똑같은 정적 건물 140동을 세 가지 방식으로 그린다. 실측 드로우콜은 개별 메시 283개, 종류별 인스턴싱 11개, mergeGeometries로 합친 지오메트리 5개다. 삼각형 수는 셋 다 약 5,100개로 같다 — 화면도 형상도 그대로인데 CPU가 GPU에 거는 호출 횟수만 달라진다는 것이 이 쇼케이스의 논점이다.",
};

/** 블록 한 변에 놓는 건물 수. 총 개수는 이 값의 제곱이 아니라 아래 buildLots가 정한다. */
const GRID_SIZE = 12;
/** 격자 한 칸의 간격(월드 유닛). */
const LOT_SPACING = 0.62;
/** 건물 종류 수. 지오메트리가 서로 달라 인스턴싱만으로는 드로우콜 1이 되지 않는다. */
const KIND_COUNT = 4;

/** 건물 높이 범위. */
const HEIGHT_MIN = 0.25;
const HEIGHT_MAX = 1.9;
/** 건물 바닥 한 변의 크기 범위. */
const FOOTPRINT_MIN = 0.26;
const FOOTPRINT_MAX = 0.44;

/** 계기판 갱신 주기(초). 매 프레임 문자열을 만들 이유가 없다. */
const HUD_INTERVAL = 0.25;
const HUD_FONT_SIZE = 0.3;
const HUD_COLOR = "#cbd5f5";
const HUD_HINT_COLOR = "#7c89ad";

/** 자동으로 다음 모드로 넘어가는 주기(초). 클릭하면 즉시 넘어간다. */
const MODE_CYCLE_SECONDS = 4;

/** 도시 바닥과 건물의 공통 색. 머티리얼을 공유해야 병합이 의미를 갖는다. */
const BUILDING_COLOR = "#8fa3c8";
const GROUND_COLOR = "#141a2a";
const BACKGROUND_COLOR = "#080b14";

/** 렌더 방식. 세 값 모두 화면 결과는 같고 드로우콜만 다르다. */
type RenderMode = "separate" | "instanced" | "merged";

const MODE_ORDER: readonly RenderMode[] = ["separate", "instanced", "merged"] as const;

/** 계기판에 쓰는 한국어 표시명과 기대 드로우콜 설명. */
const MODE_LABELS: Record<RenderMode, string> = {
  separate: "개별 메시 (병합 전)",
  instanced: "종류별 인스턴싱",
  merged: "지오메트리 병합 (병합 후)",
};

/** 건물 한 동의 고정 배치 정보. 정적이므로 한 번 만들고 끝이다. */
interface Lot {
  /** 건물 종류 인덱스. 종류마다 지오메트리가 다르다. */
  kind: number;
  x: number;
  z: number;
  /** 바닥 한 변 크기 */
  footprint: number;
  height: number;
  /** Y축 회전 */
  rotationY: number;
}

/**
 * 결정적 의사난수. 같은 인덱스는 항상 같은 값을 준다.
 *
 * Math.random()을 쓰면 모드를 바꿀 때마다 도시가 달라져 "같은 그림인데
 * 드로우콜만 다르다"는 이 쇼케이스의 논점 자체가 증명되지 않는다.
 * 이 프로젝트의 lint(react-hooks/purity)도 렌더 중 Math.random()을 막는다.
 */
function pseudoRandom(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** 격자 위에 건물 배치를 만든다. 가운데 광장은 비운다. */
function buildLots(): Lot[] {
  const lots: Lot[] = [];
  const half = (GRID_SIZE - 1) / 2;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const index = row * GRID_SIZE + col;
      const offsetX = (col - half) * LOT_SPACING;
      const offsetZ = (row - half) * LOT_SPACING;

      // 가운데 2x2는 광장으로 비워 도시처럼 읽히게 한다.
      if (Math.abs(offsetX) < LOT_SPACING && Math.abs(offsetZ) < LOT_SPACING) continue;

      lots.push({
        kind: index % KIND_COUNT,
        x: offsetX,
        z: offsetZ,
        footprint:
          FOOTPRINT_MIN + pseudoRandom(index, 1) * (FOOTPRINT_MAX - FOOTPRINT_MIN),
        height: HEIGHT_MIN + pseudoRandom(index, 2) ** 2 * (HEIGHT_MAX - HEIGHT_MIN),
        rotationY: pseudoRandom(index, 3) * Math.PI * 0.5,
      });
    }
  }

  return lots;
}

/**
 * 건물 종류별 원형(prototype) 지오메트리를 만든다.
 *
 * 네 종류가 서로 다른 지오메트리라는 점이 이 쇼케이스의 전제다. 하나였다면
 * `instanced-particles`만으로 드로우콜 1이 나오고 병합할 이유가 없다.
 *
 * 모두 인덱스가 있는 지오메트리이고 속성 구성(position/normal/uv)이 같다.
 * 이 조건이 깨지면 `mergeGeometries`가 콘솔에 error를 찍고 **null을 돌려준다**.
 */
function createPrototypes(): THREE.BufferGeometry[] {
  return [
    // 각기둥 형태의 오피스. 원점이 바닥이 되도록 위로 0.5 올려 둔다.
    new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    // 팔각 타워
    new THREE.CylinderGeometry(0.5, 0.5, 1, 8).translate(0, 0.5, 0),
    // 위가 좁아지는 저층 건물
    new THREE.CylinderGeometry(0.32, 0.5, 1, 4).translate(0, 0.5, 0),
    // 뾰족지붕 첨탑
    new THREE.ConeGeometry(0.5, 1, 6).translate(0, 0.5, 0),
  ];
}

/**
 * 건물 하나가 놓일 자리로 보내는 변환 행렬을 만든다.
 *
 * 세 가지 렌더 방식이 **같은 행렬**을 쓰기 때문에 화면 결과가 동일해진다.
 * 개별 메시는 이 행렬을 씬 그래프에 맡기고, 인스턴싱은 `setMatrixAt`으로
 * 넘기고, 병합은 `applyMatrix4`로 정점에 구워 넣는다. 셋의 차이는 그 지점뿐이다.
 */
function composeLotMatrix(target: THREE.Matrix4, lot: Lot): THREE.Matrix4 {
  return target.compose(
    new THREE.Vector3(lot.x, 0, lot.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), lot.rotationY),
    new THREE.Vector3(lot.footprint, lot.height, lot.footprint),
  );
}

/**
 * 방식 1 — 건물 하나당 `<mesh>` 하나.
 *
 * 가장 읽기 쉽고 가장 느리다. 건물 수만큼 드로우콜이 난다. 삼각형 수는
 * 아래 두 방식과 **완전히 동일**한데도 프레임이 다르다는 점이 핵심이다.
 * 병목은 삼각형이 아니라 CPU가 GPU에 거는 호출 횟수다.
 */
function SeparateMeshes({
  lots,
  prototypes,
  material,
}: {
  lots: Lot[];
  prototypes: THREE.BufferGeometry[];
  material: THREE.Material;
}) {
  return (
    <>
      {lots.map((lot, index) => (
        <mesh
          key={index}
          geometry={prototypes[lot.kind]}
          material={material}
          position={[lot.x, 0, lot.z]}
          rotation={[0, lot.rotationY, 0]}
          scale={[lot.footprint, lot.height, lot.footprint]}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

/**
 * 방식 2 — 종류별 `InstancedMesh`.
 *
 * 드로우콜이 건물 수가 아니라 **종류 수**로 떨어진다. 인스턴싱의 전제는
 * "지오메트리 1개 + 머티리얼 1개"이므로, 종류가 4개면 메시도 4개다.
 *
 * 배치가 정적이라 `useFrame`이 아니라 `useLayoutEffect`에서 한 번만 쓴다.
 * 매 프레임 행렬 버퍼를 올릴 이유가 없다.
 */
function InstancedByKind({
  lots,
  prototypes,
  material,
}: {
  lots: Lot[];
  prototypes: THREE.BufferGeometry[];
  material: THREE.Material;
}) {
  // 종류별로 그 종류에 속한 건물만 모은다.
  const lotsByKind = useMemo(() => {
    const groups: Lot[][] = prototypes.map(() => []);
    for (const lot of lots) groups[lot.kind].push(lot);
    return groups;
  }, [lots, prototypes]);

  return (
    <>
      {lotsByKind.map((group, kind) => (
        <KindInstances
          key={kind}
          lots={group}
          geometry={prototypes[kind]}
          material={material}
        />
      ))}
    </>
  );
}

/** 한 종류의 건물 전체를 InstancedMesh 하나로 그린다. */
function KindInstances({
  lots,
  geometry,
  material,
}: {
  lots: Lot[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // 행렬 조립용 임시 객체. 루프 안에서 new를 만들지 않는다.
  const scratchMatrix = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < lots.length; i += 1) {
      mesh.setMatrixAt(i, composeLotMatrix(scratchMatrix, lots[i]));
    }

    mesh.instanceMatrix.needsUpdate = true;
    // 정적 배치이므로 배치가 끝난 "뒤"에 바운딩을 계산해 둔다.
    // 하지 않으면 생성 시점의 단위행렬 기준 구가 남아 컬링이 오작동한다.
    mesh.computeBoundingSphere();
  }, [lots, scratchMatrix]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, lots.length]}
      castShadow
      receiveShadow
    />
  );
}

/**
 * 방식 3 — `mergeGeometries`로 합친 지오메트리 하나.
 *
 * 종류가 달라도 드로우콜이 1이 된다. 대가는 명확하다.
 * 개별 건물을 따로 움직일 수도, 레이캐스팅으로 구분할 수도 없다.
 * 그래서 **완전히 정적인 것에만** 쓴다.
 */
function MergedCity({
  lots,
  prototypes,
  material,
}: {
  lots: Lot[];
  prototypes: THREE.BufferGeometry[];
  material: THREE.Material;
}) {
  const merged = useMemo(() => {
    const scratchMatrix = new THREE.Matrix4();

    // 합치면 개별 transform을 잃는다. 그러므로 합치기 "전에" 각 복제본에
    // 위치·회전·크기를 applyMatrix4로 정점에 구워 넣어야 한다.
    // 이 단계를 빠뜨리면 모든 건물이 원점에 겹쳐 한 채처럼 보인다.
    const placed = lots.map((lot) =>
      prototypes[lot.kind].clone().applyMatrix4(composeLotMatrix(scratchMatrix, lot)),
    );

    // useGroups는 기본값 false. false여야 그룹이 생기지 않아 드로우콜이 1이 된다.
    // true로 주면 지오메트리는 하나여도 그룹마다 draw가 나뉜다.
    const result = mergeGeometries(placed);

    // 원본 복제본은 병합이 끝나면 필요 없다. 남겨 두면 GPU 메모리가 샌다.
    for (const geometry of placed) geometry.dispose();

    return result;
  }, [lots, prototypes]);

  // mergeGeometries는 속성 구성이 어긋나면 throw가 아니라 null을 돌려준다.
  // 타입이 `BufferGeometry | null`이라 가드가 강제된다.
  if (!merged) return null;

  return <mesh geometry={merged} material={material} castShadow receiveShadow />;
}

/**
 * 렌더 통계 계기판.
 *
 * 값을 `useState`에 담지 않는다. `useFrame` 안에서 setState를 부르면 매 프레임
 * 리렌더가 나고, 그 리렌더 자체가 측정 대상인 렌더 비용을 바꾼다
 * (troubleshooting 12-J). troika 메시의 `text` 속성을 직접 갱신한다.
 *
 * `gl.info.render`는 **직전 프레임에 실제로 그려진 것**의 통계다. 따라서
 * 이 계기판 자신(텍스트 2줄 + 바닥)도 숫자에 포함된다. 건물만의 드로우콜을
 * 보려면 그 상수를 빼야 하므로, 표시에는 총계를 그대로 쓰고 라벨로 구분한다.
 */
function RenderStats({ mode, buildingCount }: { mode: RenderMode; buildingCount: number }) {
  const gl = useThree((state) => state.gl);

  const getText = useCallback(() => {
    const { calls, triangles } = gl.info.render;
    return (
      `${MODE_LABELS[mode]}  ·  건물 ${buildingCount}동\n` +
      `드로우콜 ${calls}  ·  삼각형 ${triangles.toLocaleString("ko-KR")}`
    );
  }, [gl, mode, buildingCount]);

  return (
    <>
      <SceneReadout
        getText={getText}
        interval={HUD_INTERVAL}
        position={[0, 3.75, 0]}
        fontSize={HUD_FONT_SIZE}
        color={HUD_COLOR}
        textAlign="center"
        lineHeight={1.5}
      />
      <SceneLabel
        position={[0, 3.15, 0]}
        fontSize={HUD_FONT_SIZE * 0.62}
        color={HUD_HINT_COLOR}
        outlineWidth={0.004}
      >
        클릭하면 방식이 바뀐다 · 삼각형 수는 셋 다 같다
      </SceneLabel>
    </>
  );
}

export function Scene() {
  const [mode, setMode] = useState<RenderMode>("separate");

  const lots = useMemo(() => buildLots(), []);
  const prototypes = useMemo(() => createPrototypes(), []);

  /**
   * 건물 전원이 공유하는 단 하나의 머티리얼.
   *
   * 병합의 전제다. 머티리얼이 서로 다르면 지오메트리를 합쳐도 드로우콜이
   * 줄지 않는다 — 드로우콜은 "지오메트리 × 머티리얼" 조합마다 나기 때문이다.
   * 개별 메시 방식도 같은 인스턴스를 넘겨 셋의 비교를 공정하게 만든다.
   */
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: BUILDING_COLOR, roughness: 0.62 }),
    [],
  );

  // 직접 만든 지오메트리·머티리얼은 R3F가 dispose 해주지 않는다.
  // 언마운트 시 직접 해제한다.
  useEffect(() => {
    return () => {
      material.dispose();
      for (const geometry of prototypes) geometry.dispose();
    };
  }, [material, prototypes]);

  // 조작 없이도 세 방식을 볼 수 있도록 주기적으로 순환시킨다.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMode((current) => MODE_ORDER[(MODE_ORDER.indexOf(current) + 1) % MODE_ORDER.length]);
    }, MODE_CYCLE_SECONDS * 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} near={0.5} far={60} position={[7.4, 5.9, 8.6]} />

      <color attach="background" args={[BACKGROUND_COLOR]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 9, 5]} intensity={2.2} castShadow />
      <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#6f8ff5" />

      {/* 바닥. 클릭으로 방식을 바꾸는 판이기도 하다. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={() =>
          setMode(
            (current) => MODE_ORDER[(MODE_ORDER.indexOf(current) + 1) % MODE_ORDER.length],
          )
        }
      >
        <planeGeometry args={[11, 11]} />
        <meshStandardMaterial color={GROUND_COLOR} roughness={0.9} />
      </mesh>

      {mode === "separate" && (
        <SeparateMeshes lots={lots} prototypes={prototypes} material={material} />
      )}
      {mode === "instanced" && (
        <InstancedByKind lots={lots} prototypes={prototypes} material={material} />
      )}
      {mode === "merged" && (
        <MergedCity lots={lots} prototypes={prototypes} material={material} />
      )}

      <RenderStats mode={mode} buildingCount={lots.length} />
    </>
  );
}
