"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "호버 하이라이트 그리드",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "camera-rig", "pointer-raycast-hover"],
  description:
    "포인터가 올라간 큐브 하나만 떠오르며 빛난다. 3D에서 오브젝트는 기본적으로 포인터에 투명하므로, 겹친 오브젝트를 가리려면 stopPropagation이 필요하다는 점을 앞줄에 놓인 판으로 드러낸다.",
};

/** 격자 한 변의 개수. 총 큐브는 GRID_SIZE^2 개다. */
const GRID_SIZE = 4;
/** 큐브 한 변의 길이 */
const CUBE_SIZE = 0.62;
/** 격자 간격. 큐브 크기의 1.4~2배여야 호버 대상을 구분하기 쉽다. */
const CELL_GAP = 1.05;

/** 기본 색과 호버 색. THREE.Color 인스턴스를 공유하면 모든 큐브가 같은 색이 되므로 문자열로 둔다. */
const BASE_COLOR = "#4a5568";
const HOVER_COLOR = "#ffb347";

/** 호버 시 목표 스케일. 1.3을 넘으면 이웃 큐브와 겹쳐 판정이 꼬인다. */
const HOVER_SCALE = 1.28;
/** 호버 시 목표 부양 높이 */
const HOVER_LIFT = 0.3;
/** 지수 감쇠 계수. 낮으면 늘어지고 높으면 즉각적이다. */
const DAMP_RATE = 10;

/** 앞줄 가림판의 색. 반투명이라 뒤 큐브가 비쳐 보인다. */
const OCCLUDER_COLOR = "#7ecfff";

/**
 * 프레임률과 무관한 지수 감쇠 보간 계수.
 * delta를 곱해 계산하므로 저프레임에서도 같은 속도로 수렴한다.
 */
function dampFactor(delta: number): number {
  return 1 - Math.exp(-DAMP_RATE * delta);
}

/** 격자 좌표(ix, iz)에서 큐브의 월드 위치를 만든다. */
function cellPosition(ix: number, iz: number): [number, number, number] {
  const offset = ((GRID_SIZE - 1) * CELL_GAP) / 2;
  return [ix * CELL_GAP - offset, 0, iz * CELL_GAP - offset];
}

interface HoverCubeProps {
  id: number;
  position: [number, number, number];
  hovered: boolean;
  onHover: (id: number) => void;
  onUnhover: () => void;
}

/**
 * 격자 큐브 하나.
 *
 * 호버 상태는 부모가 단일 hoveredId로 들고 prop으로 내려준다(방식 A).
 * "동시에 하나만"이 구조적으로 보장되고, 부모가 어느 큐브인지 알아야
 * 좌표 라벨 같은 파생 표현을 붙일 수 있기 때문이다.
 */
function HoverCube({ id, position, hovered, onHover, onUnhover }: HoverCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // 매 프레임 보간에 쓰는 임시 객체. 컴포넌트마다 하나씩 가져야 서로 간섭하지 않는다.
  const baseColor = useMemo(() => new THREE.Color(BASE_COLOR), []);
  const hoverColor = useMemo(() => new THREE.Color(HOVER_COLOR), []);

  // 색·스케일 전이는 useFrame에서 직접 만진다.
  // 상태에는 목표(hovered)만 두므로 리렌더는 호버 전이 시 1회뿐이다.
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const factor = dampFactor(delta);
    const targetScale = hovered ? HOVER_SCALE : 1;
    const targetLift = hovered ? HOVER_LIFT : 0;

    mesh.scale.setScalar(
      mesh.scale.x + (targetScale - mesh.scale.x) * factor,
    );
    mesh.position.y += (position[1] + targetLift - mesh.position.y) * factor;

    material.color.lerp(hovered ? hoverColor : baseColor, factor);
    material.emissiveIntensity +=
      ((hovered ? 0.9 : 0) - material.emissiveIntensity) * factor;
  });

  /**
   * stopPropagation을 setState보다 "먼저" 부른다.
   * 이 호출 도중에 다른 오브젝트의 pointerout이 발생하는데, 순서를 뒤집으면
   * 남의 onUnhover()가 내 onHover(id)를 덮어써 하이라이트가 꺼진다.
   */
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(id);
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onPointerOver={handlePointerOver}
      onPointerOut={onUnhover}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial
        ref={materialRef}
        color={BASE_COLOR}
        emissive={HOVER_COLOR}
        emissiveIntensity={0}
        roughness={0.45}
        metalness={0.1}
      />
    </mesh>
  );
}

/**
 * 카메라 앞을 가로지르는 반투명 판 두 장.
 *
 * 이 skill의 핵심 교훈을 드러내기 위한 장치다. 3D에서 광선은 뒤 오브젝트까지
 * 전부 통과하므로, 이 판에 핸들러가 없으면 판 뒤의 큐브가 그대로 호버된다.
 *
 * - 왼쪽 판: stopPropagation을 호출한다 → 뒤 큐브가 반응하지 않는다(가려진다).
 * - 오른쪽 판: raycast를 꺼서 판정에서 아예 제외한다 → 뒤 큐브가 그대로 반응한다.
 *
 * 두 판 아래에서 마우스를 좌우로 옮기면 차이가 바로 드러난다.
 */
function OccluderPanels() {
  return (
    <>
      {/*
        핸들러가 있어야 stopPropagation을 부를 수 있다. 이 판 자체는 아무 상태도
        갖지 않지만, 뒤 오브젝트로의 이벤트 전달을 막는 역할만 한다.
      */}
      <mesh
        position={[-1.6, 0.55, 1.5]}
        onPointerOver={(event) => event.stopPropagation()}
      >
        <planeGeometry args={[2.4, 2.2]} />
        <meshStandardMaterial
          color={OCCLUDER_COLOR}
          transparent
          opacity={0.22}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/*
        raycast를 null로 만들면 레이캐스팅 대상에서 빠진다. 광선이 이 판을
        무시하고 지나가므로 뒤 큐브가 정상적으로 호버된다.
      */}
      <mesh position={[1.6, 0.55, 1.5]} raycast={() => null}>
        <planeGeometry args={[2.4, 2.2]} />
        <meshStandardMaterial
          color={OCCLUDER_COLOR}
          transparent
          opacity={0.22}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

/**
 * 포인터가 멈춰 있어도 카메라가 움직이면 hover 판정을 다시 돌린다.
 *
 * R3F는 기본적으로 사용자가 캔버스와 상호작용할 때만 레이캐스팅한다.
 * 이 갤러리는 OrbitControls가 항상 켜져 있으므로, 마우스를 그대로 둔 채
 * 카메라만 돌리면 하이라이트가 이전 오브젝트에 남는다.
 */
function RaycastOnCameraMove() {
  // 리렌더에도 살아남아야 비교가 의미를 갖는다.
  // 컴포넌트 본문에서 new Matrix4()를 만들면 매 렌더 초기화돼 항상 불일치가 된다.
  const previousMatrix = useRef(new THREE.Matrix4());

  useFrame((state) => {
    // 카메라가 실제로 움직였을 때만 갱신한다.
    // 매 프레임 update()를 부르면 씬 전체 레이캐스팅이 매 프레임 돌아 낭비다.
    if (previousMatrix.current.equals(state.camera.matrixWorld)) return;

    // 마지막으로 알려진 포인터 위치로 onPointerMove를 다시 발생시킨다.
    // events.update는 타입상 선택적이므로(이벤트 매니저가 연결되기 전 시점이 있다)
    // 옵셔널 호출로 둔다.
    state.events.update?.();
    previousMatrix.current.copy(state.camera.matrixWorld);
  });

  return null;
}

export function Scene() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // 격자 배치는 한 번만 계산한다.
  const cells = useMemo(() => {
    const result: { id: number; position: [number, number, number] }[] = [];
    for (let iz = 0; iz < GRID_SIZE; iz += 1) {
      for (let ix = 0; ix < GRID_SIZE; ix += 1) {
        result.push({
          id: iz * GRID_SIZE + ix,
          position: cellPosition(ix, iz),
        });
      }
    }
    return result;
  }, []);

  /**
   * 커서 변경은 반드시 useEffect + cleanup으로 한다.
   * onPointerOut에 복원을 맡기면, 호버한 채로 페이지를 벗어났을 때
   * out 이벤트가 발생하지 않아 커서가 pointer로 영원히 남는다.
   * cleanup은 hoveredId 변경 시와 언마운트 시 모두 실행되므로 안전하다.
   */
  useEffect(() => {
    if (hoveredId === null) return;

    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hoveredId]);

  return (
    <>
      {/*
        격자 전체(약 3.2유닛)와 가림판을 함께 담아야 하고, 겹침을 만들려면
        비스듬히 내려다보는 구도가 필요해 기본 카메라(z=5, fov 75)를 교체한다.
        far/near = 40/0.5 = 80 으로 depth 정밀도는 여유롭다.
      */}
      <PerspectiveCamera makeDefault fov={45} near={0.5} far={40} position={[0, 3.4, 6.2]} />

      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer
          form="rect"
          intensity={4}
          scale={[10, 5]}
          position={[0, 6, -4]}
          color="#dce8ff"
        />
      </Environment>

      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />

      {/* 바닥. 호버 대상이 아니므로 레이캐스팅에서 제외해 오탐과 비용을 함께 없앤다. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -CUBE_SIZE / 2 - 0.01, 0]}
        receiveShadow
        raycast={() => null}
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#1b1f27" roughness={0.95} />
      </mesh>

      {cells.map((cell) => (
        <HoverCube
          key={cell.id}
          id={cell.id}
          position={cell.position}
          hovered={hoveredId === cell.id}
          onHover={setHoveredId}
          onUnhover={() => setHoveredId(null)}
        />
      ))}

      <OccluderPanels />
      <RaycastOnCameraMove />
    </>
  );
}
