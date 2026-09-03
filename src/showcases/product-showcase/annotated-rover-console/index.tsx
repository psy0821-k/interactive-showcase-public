'use client';

export { meta } from './meta';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, PerspectiveCamera } from '@react-three/drei';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** 콘솔 전체가 도는 각속도(rad/s). 부위가 본체 뒤로 돌아가는 것을 보이려면 계속 돈다. */
const TURNTABLE_SPEED = 0.28;
/** 모션 축소 시 배속. 완전히 멈추면 occlude 페이드를 볼 수 없다. */
const REDUCED_MOTION_SCALE = 0.15;

/** 라벨이 앵커에서 떨어지는 거리(월드 단위). */
const LABEL_LIFT = 0.34;
/** distanceFactor — "이 거리에서 1배" 기준. 값이 클수록 라벨이 크게 유지된다. */
const LABEL_DISTANCE_FACTOR = 5.5;

/** 부위 색 */
const BODY_COLOR = '#39414f';
const PART_COLOR_IDLE = '#5b6577';
const PART_COLOR_HOVER = '#8ad2ff';

/**
 * 라벨을 달 부위 정의. 순수 데이터라 모듈 스코프에 둔다.
 *
 * position은 본체 중심 기준 로컬 좌표다. 부위는 본체의 자식 <group> 안에 놓여
 * 함께 회전하고, <Html>은 그 부위의 위치를 앵커로 삼는다.
 */
const PARTS = [
  {
    id: 'sensor',
    position: [0, 0.95, 0],
    size: [0.34, 0.34, 0.34],
    label: '광학 센서 돔',
    spec: '360° LIDAR · 20 Hz',
  },
  {
    id: 'antenna',
    position: [0.62, 0.62, -0.15],
    size: [0.1, 0.9, 0.1],
    label: '고이득 안테나',
    spec: 'X-band · 8.4 GHz',
  },
  {
    id: 'intake',
    position: [-0.66, 0.05, 0.42],
    size: [0.3, 0.42, 0.22],
    label: '냉각 흡기구',
    spec: '이중 팬 · 42 CFM',
  },
  {
    id: 'battery',
    position: [0.05, -0.35, 0.5],
    size: [0.7, 0.34, 0.18],
    label: '배터리 팩',
    spec: '리튬이온 · 4.1 kWh',
  },
  {
    id: 'wheel',
    position: [-0.72, -0.62, -0.3],
    size: [0.24, 0.24, 0.5],
    label: '구동 휠',
    spec: '인휠 모터 · 6×6',
  },
] as const;

type PartId = (typeof PARTS)[number]['id'];

interface AnnotatedPartProps {
  part: (typeof PARTS)[number];
  hovered: boolean;
  /** 본체 자체의 메시 ref. occlude가 이 메시로 라벨을 가린다. */
  bodyRef: React.RefObject<THREE.Mesh | null>;
  onHover: (id: PartId) => void;
  onUnhover: () => void;
}

/**
 * 부위 하나 — 박스 + 앵커된 <Html> 라벨.
 *
 * 라벨은 호버 중일 때만 마운트한다. <Html>은 인스턴스마다 매 프레임 DOM 스타일을
 * 갱신하므로, 다섯 개를 상시 띄우기보다 지금 보는 하나만 띄우는 편이 가볍다.
 */
function AnnotatedPart({
  part,
  hovered,
  bodyRef,
  onHover,
  onUnhover,
}: AnnotatedPartProps) {
  const [occluded, setOccluded] = useState(false);
  const reducedMotion = useReducedMotion();

  // occlude에 넘길 ref 배열. drei가 매 프레임 .current를 읽으므로 배열만 안정적이면 된다.
  const occludeTargets = useMemo(
    () => [bodyRef as React.RefObject<THREE.Object3D>],
    [bodyRef],
  );

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    // 뒤 부위까지 호버가 전파되면 라벨이 두 개 켜진다.
    event.stopPropagation();
    onHover(part.id);
  };

  return (
    <group position={part.position}>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={onUnhover}
        castShadow
      >
        <boxGeometry args={part.size} />
        <meshStandardMaterial
          color={hovered ? PART_COLOR_HOVER : PART_COLOR_IDLE}
          roughness={0.5}
          metalness={0.25}
        />
      </mesh>

      {hovered && (
        <Html
          position={[0, part.size[1] / 2 + LABEL_LIFT, 0]}
          center
          distanceFactor={LABEL_DISTANCE_FACTOR}
          // 본체 뒤로 돌아간 부위의 라벨은 숨긴다. 레이캐스트 방식이라 가볍다.
          occlude={occludeTargets}
          onOcclude={setOccluded}
          // zIndexRange를 좁혀 갤러리의 다른 UI 위로 튀지 않게 한다.
          zIndexRange={[120, 0]}
        >
          <div
            style={{
              padding: '7px 11px',
              borderRadius: 7,
              background: 'rgba(9, 12, 18, 0.88)',
              border: '1px solid rgba(138, 210, 255, 0.35)',
              color: '#e8edf5',
              fontSize: 13,
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
              // 라벨은 표시 전용이라 포인터 이벤트를 통과시킨다.
              pointerEvents: 'none',
              userSelect: 'none',
              // 본체 뒤로 가면 부드럽게 사라진다.
              transition: reducedMotion
                ? 'none'
                : 'opacity 0.28s, transform 0.28s',
              opacity: occluded ? 0 : 1,
              transform: `scale(${occluded ? 0.7 : 1})`,
            }}
          >
            <strong>{part.label}</strong>
            <br />
            <span style={{ color: '#9fb2cc', fontSize: 12 }}>{part.spec}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * 본체 + 부위들. 통째로 천천히 돈다.
 *
 * 회전은 ref를 직접 만져 리렌더를 만들지 않는다. 포인터가 멈춘 채 부위가
 * 커서 아래로 들어오고 나가므로, 회전 중 state.events.update로 레이캐스팅을
 * 다시 돌려야 호버가 실제로 "지금 커서 아래 있는 것"을 따라간다.
 */
function RoverConsole() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<PartId | null>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const scale = reducedMotion ? REDUCED_MOTION_SCALE : 1;
    group.rotation.y += TURNTABLE_SPEED * delta * scale;

    // 오브젝트가 움직였으니 마지막 포인터 위치로 레이캐스팅을 다시 돌린다.
    state.events.update?.();
  });

  return (
    <group ref={groupRef}>
      {/* 본체 — occlude 대상. 부위와 라벨은 이 메시 뒤로 돌아가면 가려진다. */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <boxGeometry args={[1.3, 1.5, 1.0]} />
        <meshStandardMaterial
          color={BODY_COLOR}
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {PARTS.map((part) => (
        <AnnotatedPart
          key={part.id}
          part={part}
          hovered={hoveredId === part.id}
          bodyRef={bodyRef}
          onHover={setHoveredId}
          onUnhover={() => setHoveredId(null)}
        />
      ))}
    </group>
  );
}

export function Scene() {
  const [anyHovered, setAnyHovered] = useState(false);

  // 커서 변경은 useEffect + cleanup으로 한다. onPointerOut에 맡기면
  // 호버한 채로 페이지를 벗어났을 때 커서가 pointer로 영원히 남는다.
  useEffect(() => {
    if (!anyHovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [anyHovered]);

  // RoverConsole 내부 hover 상태를 커서용으로만 끌어올린다.
  const hoverProbe = useMemo(
    () => ({
      onOver: () => setAnyHovered(true),
      onOut: () => setAnyHovered(false),
    }),
    [],
  );

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={42}
        near={0.5}
        far={40}
        position={[0, 0.6, 6.4]}
      />

      <color attach="background" args={['#0b0d13']} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={2.1} castShadow />
      <directionalLight
        position={[-5, 2, -3]}
        intensity={0.55}
        color="#8fb4ff"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.4, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#14171f" roughness={0.95} />
      </mesh>

      <group onPointerOver={hoverProbe.onOver} onPointerOut={hoverProbe.onOut}>
        <RoverConsole />
      </group>
    </>
  );
}
