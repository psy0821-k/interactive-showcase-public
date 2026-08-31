"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Outline,
  Select,
  Selection,
} from "@react-three/postprocessing";
import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "외곽선 선택 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "pointer-raycast-hover",
    "bloom-postprocessing",
    "outline-selection",
  ],
  description:
    "천천히 도는 진열대 위 세 오브젝트 중 마우스가 올라간 하나에만 외곽선이 그려진다. 색도 크기도 전혀 바뀌지 않고 선택 표현을 온전히 후처리에 맡기며, 앞 기둥 뒤로 들어간 부분은 xRay 덕분에 어두운 외곽선으로 비쳐 보인다.",
};

/** 진열 반지름. 세 오브젝트를 원호 위에 놓아 앞뒤 겹침을 만든다. */
const PODIUM_RADIUS = 2.05;
/** 받침대 높이. 오브젝트는 이 위에 얹힌다. */
const PEDESTAL_HEIGHT = 0.34;
/** 받침대 윗면 반지름 */
const PEDESTAL_RADIUS = 0.62;

/** 보이는 부분의 외곽선 색. 밝을수록 눈에 띈다. */
const VISIBLE_EDGE_COLOR = "#ffd479";
/** 가려진 부분의 외곽선 색. xRay가 켜져야 실제로 그려진다. */
const HIDDEN_EDGE_COLOR = "#8a4a1c";
/** 외곽선 굵기·밝기. 2 아래는 실제 화면에서 거의 안 보인다. */
const EDGE_STRENGTH = 8;
/** 외곽선 밝기의 맥동 속도(rad/s 계열). 0이면 정지한다. */
const PULSE_SPEED = 0.32;

/** 앞을 가로지르는 기둥의 색. 외곽선이 가려지는 상황을 만든다. */
const PILLAR_COLOR = "#2b3240";
/** 기둥이 서는 x 좌표 두 곳 */
const PILLAR_X_POSITIONS = [-1.05, 1.05] as const;

/** 진열대 각속도(rad/s). delta를 곱해 프레임률과 무관하게 만든다. */
const TURNTABLE_SPEED = 0.07;

/** 진열 품목. id는 호버 상태 비교에 쓰는 키다. */
const DISPLAY_ITEMS = [
  { id: "torus", color: "#d94f5c" },
  { id: "knot", color: "#4fb0d9" },
  { id: "octa", color: "#8bd94f" },
] as const;

type DisplayItemId = (typeof DISPLAY_ITEMS)[number]["id"];

/** 원호 위 index번째 자리의 위치를 만든다. */
function podiumPosition(index: number, total: number): [number, number, number] {
  const angle = (index / total) * Math.PI * 2;
  return [Math.sin(angle) * PODIUM_RADIUS, 0, Math.cos(angle) * PODIUM_RADIUS];
}

/** id에 대응하는 지오메트리. 형태가 서로 달라야 외곽선 모양으로도 구분된다. */
function ItemGeometry({ id }: { id: DisplayItemId }) {
  if (id === "torus") return <torusGeometry args={[0.42, 0.17, 24, 64]} />;
  if (id === "knot") return <torusKnotGeometry args={[0.36, 0.12, 128, 20]} />;
  return <octahedronGeometry args={[0.55, 0]} />;
}

interface DisplayItemProps {
  id: DisplayItemId;
  color: string;
  position: [number, number, number];
  hovered: boolean;
  onHover: (id: DisplayItemId) => void;
  onUnhover: () => void;
}

/**
 * 진열 품목 하나 — 받침대 + 오브젝트.
 *
 * `<Select enabled>`가 이 skill의 핵심이다. enabled가 true가 되면 Select가
 * 자기 아래 메시들을 traverse 해 Selection 컨텍스트에 등록하고, `<Outline>`이
 * 그 목록을 읽어 외곽선을 그린다. 여기서 오브젝트의 색·스케일은 **전혀 건드리지
 * 않는다** — 선택 표현을 온전히 후처리에 맡기는 것이 이 예제의 요점이다.
 *
 * 받침대는 Select 밖에 둔다. 안에 넣으면 받침대에도 선이 둘려 무엇이 선택됐는지
 * 오히려 흐려진다. "무엇을 Select로 감싸는가"가 곧 "무엇에 선이 그려지는가"다.
 */
function DisplayItem({
  id,
  color,
  position,
  hovered,
  onHover,
  onUnhover,
}: DisplayItemProps) {
  /**
   * stopPropagation을 setState보다 먼저 부른다. 이 호출 도중에 다른 오브젝트의
   * pointerout이 발생하므로, 순서를 뒤집으면 남의 onUnhover가 내 onHover를
   * 덮어써 외곽선이 꺼진다 (pointer-raycast-hover 소관의 규칙).
   */
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(id);
  };

  return (
    <group position={position}>
      {/* 받침대. 선택 대상이 아니므로 Select 밖이고, 레이캐스팅에서도 뺀다. */}
      <mesh
        position={[0, PEDESTAL_HEIGHT / 2 - 0.55, 0]}
        receiveShadow
        raycast={() => null}
      >
        <cylinderGeometry
          args={[PEDESTAL_RADIUS, PEDESTAL_RADIUS + 0.08, PEDESTAL_HEIGHT, 32]}
        />
        <meshStandardMaterial color="#20242e" roughness={0.85} metalness={0.05} />
      </mesh>

      <Select enabled={hovered}>
        <mesh
          position={[0, 0.15, 0]}
          castShadow
          onPointerOver={handlePointerOver}
          onPointerOut={onUnhover}
        >
          <ItemGeometry id={id} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
        </mesh>
      </Select>
    </group>
  );
}

/**
 * 진열대를 천천히 돌린다.
 *
 * 포인터가 멈춰 있어도 오브젝트가 커서 아래로 들어오고 빠져나가므로,
 * 외곽선이 실제로 "지금 커서 아래 있는 것"을 따라가는지 가만히 앉아서
 * 확인할 수 있다. 회전은 ref를 직접 만져 리렌더를 만들지 않는다.
 */
function Turntable({ children }: { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += TURNTABLE_SPEED * delta;

    // 오브젝트가 움직였으니 마지막 포인터 위치로 레이캐스팅을 다시 돌린다.
    // 이게 없으면 커서를 가만히 둔 채로는 외곽선이 원래 오브젝트에 붙어 있다.
    state.events.update?.();
  });

  return <group ref={groupRef}>{children}</group>;
}

export function Scene() {
  const [hoveredId, setHoveredId] = useState<DisplayItemId | null>(null);

  const items = useMemo(
    () =>
      DISPLAY_ITEMS.map((item, index) => ({
        ...item,
        position: podiumPosition(index, DISPLAY_ITEMS.length),
      })),
    [],
  );

  /**
   * 커서 변경은 useEffect + cleanup으로 한다. onPointerOut에 복원을 맡기면
   * 호버한 채로 페이지를 벗어났을 때 커서가 pointer로 영원히 남는다.
   */
  useEffect(() => {
    if (hoveredId === null) return;

    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hoveredId]);

  return (
    /*
      <Selection>이 선택 목록을 들고 있는 컨텍스트 제공자다.
      <Select>(생산자)와 <EffectComposer> 안의 <Outline>(소비자)이 **둘 다**
      이 안에 있어야 한다. EffectComposer를 Selection 밖에 두면 Outline이
      컨텍스트를 읽지 못해 아무 일도 일어나지 않는다 — 에러도 경고도 없다.
    */
    <Selection>
      {/*
        원호 지름(약 4.1유닛)과 앞 기둥을 한 화면에 담는 구도.
        far/near = 40/0.5 = 80 이라 depth 정밀도는 여유롭다.
      */}
      <PerspectiveCamera
        makeDefault
        fov={42}
        near={0.5}
        far={40}
        position={[0, 2.0, 6.9]}
      />

      {/* 어두운 배경이라야 밝은 외곽선이 또렷하게 읽힌다. */}
      <color attach="background" args={["#0b0d13"]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={2.1} castShadow />
      <directionalLight position={[-5, 2, -3]} intensity={0.6} color="#8fb4ff" />

      {/* 바닥. 선택 대상이 아니므로 레이캐스팅에서 제외한다. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.56, 0]}
        receiveShadow
        raycast={() => null}
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#14171f" roughness={0.95} />
      </mesh>

      <Turntable>
        {items.map((item) => (
          <DisplayItem
            key={item.id}
            id={item.id}
            color={item.color}
            position={item.position}
            hovered={hoveredId === item.id}
            onHover={setHoveredId}
            onUnhover={() => setHoveredId(null)}
          />
        ))}
      </Turntable>

      {/*
        앞을 가로지르는 기둥 두 개. 회전하는 오브젝트가 이 뒤로 지나갈 때
        xRay가 켜진 외곽선이 어두운 색(hiddenEdgeColor)으로 비쳐 보인다.
        stopPropagation을 불러 기둥 뒤 오브젝트가 호버되지 않게 막는다.
      */}
      {PILLAR_X_POSITIONS.map((x) => (
        <mesh
          key={x}
          position={[x, 0.1, 2.45]}
          onPointerOver={(event) => event.stopPropagation()}
        >
          <boxGeometry args={[0.5, 1.7, 0.32]} />
          <meshStandardMaterial color={PILLAR_COLOR} roughness={0.6} metalness={0.2} />
        </mesh>
      ))}

      {/*
        autoClear={false}는 Outline의 요구사항이다. 기본값(true)이면
        "Outline requires <EffectComposer autoClear={false}>" 경고가 뜬다.

        효과 순서: Outline이 먼저, Bloom이 나중.
        Bloom은 자기 앞 효과가 만들어 놓은 결과의 밝은 픽셀을 읽어 번지게
        하므로, 뒤에 놓아야 외곽선까지 은은하게 번진다. 순서를 뒤집으면
        Bloom이 외곽선 없는 화면만 보고 지나가 선이 날카롭게 남는다.

        multisampling={0}: MSAA는 후처리 체인에서 비싸고, 이 씬의 선명도는
        외곽선 자체가 담당한다.
      */}
      <EffectComposer autoClear={false} multisampling={0}>
        <Outline
          edgeStrength={EDGE_STRENGTH}
          visibleEdgeColor={VISIBLE_EDGE_COLOR}
          hiddenEdgeColor={HIDDEN_EDGE_COLOR}
          pulseSpeed={PULSE_SPEED}
          blur
          xRay
        />
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.75}
          luminanceSmoothing={0.25}
          mipmapBlur
        />
      </EffectComposer>
    </Selection>
  );
}
