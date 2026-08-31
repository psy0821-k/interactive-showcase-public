"use client";

export { meta } from "./meta";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";

/** 보드 한 변의 길이. 영역 제약(clamp)의 기준이 된다. */
const BOARD_SIZE = 6;
/** 말의 반지름. clamp 경계를 이 값만큼 안쪽으로 당겨야 말이 보드 밖으로 삐져나오지 않는다. */
const PIECE_RADIUS = 0.42;
/** 말이 놓이는 높이. 드래그 평면도 이 높이에 만든다. */
const PIECE_HEIGHT = PIECE_RADIUS;

/** clamp가 실제로 허용하는 절반 폭. 경계에서 말의 몸통이 걸리도록 반지름을 뺀다. */
const CLAMP_HALF_EXTENT = BOARD_SIZE / 2 - PIECE_RADIUS;

/** X축 레일의 z 위치. 축 고정 말은 이 선을 벗어나지 않는다. */
const RAIL_Z = -2.1;
/** 레일 길이. 시각적 안내선과 clamp 범위를 같은 값으로 묶는다. */
const RAIL_HALF_LENGTH = 2.4;

/** 말 색. THREE.Color 인스턴스를 공유하면 세 말이 같은 색이 되므로 문자열로 둔다. */
const PIECE_COLORS = ["#ff8f5c", "#6fd08c", "#7ea6ff"] as const;
/** 잡고 있는 동안 덧입히는 발광 강도 */
const DRAG_EMISSIVE = 0.85;

/** 드래그 제약 방식. 세 가지를 나란히 보여주는 것이 이 쇼케이스의 목적이다. */
type DragConstraint = "free" | "axis-x" | "clamped";

interface PieceConfig {
  id: number;
  constraint: DragConstraint;
  color: string;
  initialPosition: [number, number, number];
}

/** 말 세 개의 초기 배치. 순수 데이터라 모듈 스코프에 둬도 부수효과가 없다. */
const PIECES: PieceConfig[] = [
  { id: 0, constraint: "free", color: PIECE_COLORS[0], initialPosition: [-1.9, PIECE_HEIGHT, 1.4] },
  { id: 1, constraint: "axis-x", color: PIECE_COLORS[1], initialPosition: [0, PIECE_HEIGHT, RAIL_Z] },
  { id: 2, constraint: "clamped", color: PIECE_COLORS[2], initialPosition: [1.9, PIECE_HEIGHT, 1.4] },
];

/**
 * `enabled`를 가진 컨트롤인지 좁힌다.
 *
 * R3F의 `state.controls`는 `THREE.EventDispatcher | null` 로만 타이핑돼 있어
 * `.enabled`가 타입에 없다. `any` 캐스팅 대신 이 가드로 좁혀 쓴다.
 */
function hasEnabledFlag(value: unknown): value is { enabled: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "enabled" in value &&
    typeof (value as { enabled: unknown }).enabled === "boolean"
  );
}

/** 값을 [-limit, limit] 범위로 자른다. */
function clampSymmetric(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value));
}

/**
 * 평면에 투영된 원시 위치에 제약을 적용한다.
 *
 * 제약은 "투영 후 · 대입 전" 한 곳에서만 적용한다. 투영 자체를 손보면
 * 카메라 각도에 따라 결과가 달라지고, 대입 후에 고치면 한 프레임 튄다.
 */
function applyConstraint(
  constraint: DragConstraint,
  raw: THREE.Vector3,
  initial: [number, number, number],
  target: THREE.Vector3,
): void {
  switch (constraint) {
    case "axis-x":
      // 축 고정: 자유롭게 둘 축만 남기고 나머지는 시작 값으로 되돌린다.
      target.set(clampSymmetric(raw.x, RAIL_HALF_LENGTH), initial[1], initial[2]);
      return;
    case "clamped":
      // 영역 제약: 보드 안쪽으로 자른다. 높이는 평면 높이로 고정된다.
      target.set(
        clampSymmetric(raw.x, CLAMP_HALF_EXTENT),
        initial[1],
        clampSymmetric(raw.z, CLAMP_HALF_EXTENT),
      );
      return;
    default:
      // 자유 이동. 평면 위이므로 y는 이미 평면 높이다.
      target.set(raw.x, initial[1], raw.z);
  }
}

interface DraggablePieceProps {
  config: PieceConfig;
  dragging: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
}

/**
 * 끌어서 옮길 수 있는 말 하나.
 *
 * 위치는 React 상태가 아니라 `mesh.position`을 직접 갱신한다. 포인터 이동은
 * 초당 수십~수백 번 발생하므로 상태로 들면 그만큼 리렌더가 돈다.
 * 상태로 드는 것은 "지금 잡고 있는가" 하나뿐이고, 그건 전이 시에만 바뀐다.
 */
function DraggablePiece({ config, dragging, onDragStart, onDragEnd }: DraggablePieceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // 컨트롤 객체는 훅 반환값으로 들지 않는다. React Compiler가 훅이 돌려준 값의
  // 변형을 금지하므로, 필요한 순간에 스토어에서 직접 꺼내 쓴다.
  const getR3FState = useThree((state) => state.get);

  /**
   * 드래그 계산에 쓰는 재사용 객체들.
   *
   * 매 포인터 이벤트마다 new 를 부르면 초당 수백 개의 쓰레기가 생긴다.
   * ref/useMemo로 컴포넌트마다 하나씩 갖되, 다른 말과 공유하지는 않는다.
   */
  const dragPlane = useMemo(() => new THREE.Plane(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  /** 잡은 순간의 "말 위치 - 포인터 위치". 이게 없으면 말이 커서 중심으로 순간이동한다. */
  const grabOffset = useMemo(() => new THREE.Vector3(), []);
  const nextPosition = useMemo(() => new THREE.Vector3(), []);

  /** 드래그 중 여부를 이벤트 핸들러에서 즉시 읽기 위한 ref. 상태는 렌더용이라 한 박자 늦다. */
  const isDraggingRef = useRef(false);

  /** OrbitControls를 켜고 끈다. 끄지 않으면 드래그가 카메라 회전과 동시에 일어난다. */
  const setControlsEnabled = useCallback(
    (enabled: boolean) => {
      const { controls } = getR3FState();
      if (hasEnabledFlag(controls)) {
        controls.enabled = enabled;
      }
    },
    [getR3FState],
  );

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // 뒤에 있는 말·보드로 이벤트가 흘러가면 두 개를 동시에 잡게 된다.
    // stopPropagation은 첫 줄에 둔다 (pointer-raycast-hover 3절).
    event.stopPropagation();

    /**
     * 드래그 평면을 만든다.
     *
     * 카메라의 시선 방향을 법선으로 삼으면 어느 각도에서 봐도 화면과 나란한
     * 평면이 되어, 포인터 이동량과 오브젝트 이동량이 어긋나지 않는다.
     * 여기서는 말이 바닥 위를 미끄러지는 것이 의도이므로 위쪽 법선(y)을 쓴다.
     * 카메라를 향한 평면이 필요하면 camera.getWorldDirection(planeNormal) 을 쓴다.
     */
    planeNormal.set(0, 1, 0);
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, mesh.position);

    // 잡은 지점을 평면 위로 투영하고, 말 위치와의 차이를 오프셋으로 기억한다.
    if (!event.ray.intersectPlane(dragPlane, hitPoint)) return;
    grabOffset.copy(mesh.position).sub(hitPoint);

    isDraggingRef.current = true;
    setControlsEnabled(false);

    /**
     * 포인터를 이 요소에 붙잡아 둔다.
     *
     * 이게 없으면 포인터를 빠르게 움직여 말 밖으로 나가는 순간 pointermove가
     * 끊겨 드래그가 중간에 풀린다. R3F 이벤트 객체는 DOM 이벤트 데이터를
     * 그대로 물고 있으므로 표준 Pointer Capture API를 그대로 쓸 수 있다.
     */
    (event.target as Element | null)?.setPointerCapture?.(event.pointerId);

    onDragStart(config.id);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const mesh = meshRef.current;
    if (!mesh || !isDraggingRef.current) return;

    event.stopPropagation();

    // 화면의 2D 포인터 → 평면과의 교차점 → 3D 위치. 교차가 없으면(시선과 평면이
    // 거의 나란함) 이전 위치를 그대로 둔다.
    if (!event.ray.intersectPlane(dragPlane, hitPoint)) return;

    // 잡은 순간의 오프셋을 더해야 "집은 지점"이 커서를 따라간다.
    hitPoint.add(grabOffset);
    applyConstraint(config.constraint, hitPoint, config.initialPosition, nextPosition);
    mesh.position.copy(nextPosition);
  };

  /** 드래그 종료. up·cancel·lostpointercapture가 모두 이리로 모인다. */
  const endDrag = useCallback(
    (event?: ThreeEvent<PointerEvent>) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setControlsEnabled(true);

      if (event) {
        (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
      }
      onDragEnd();
    },
    [onDragEnd, setControlsEnabled],
  );

  /**
   * 잡은 채로 언마운트되면 OrbitControls가 꺼진 상태로 남는다.
   * `controls`는 씬 밖(캔버스 셸)의 객체라 Scene이 사라져도 살아 있기 때문에,
   * 정리 책임은 이 컴포넌트에 있다.
   */
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setControlsEnabled(true);
      }
    };
  }, [setControlsEnabled]);

  // 잡은 동안 발광으로 피드백을 준다. 전이 시에만 바뀌므로 렌더 중 대입으로 충분하다.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.emissiveIntensity = dragging ? DRAG_EMISSIVE : 0;
  }, [dragging]);

  return (
    <mesh
      ref={meshRef}
      position={config.initialPosition}
      castShadow
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      // 포인터 캡처가 강제로 해제되는 경우(다른 제스처 인식 등)에도 상태를 되돌린다.
      onLostPointerCapture={endDrag}
    >
      <sphereGeometry args={[PIECE_RADIUS, 32, 24]} />
      <meshStandardMaterial
        ref={materialRef}
        color={config.color}
        emissive={config.color}
        emissiveIntensity={0}
        roughness={0.35}
        metalness={0.15}
      />
    </mesh>
  );
}

/**
 * 제약을 눈으로 보이게 하는 안내선.
 *
 * 레이캐스팅 대상이 될 이유가 없으므로 전부 제외한다.
 * 안내선이 광선을 먹으면 그 위에서 드래그가 끊긴다.
 */
function ConstraintGuides() {
  return (
    <>
      {/* X축 레일 — 축 고정 말이 움직일 수 있는 유일한 선 */}
      <mesh position={[0, 0.011, RAIL_Z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[RAIL_HALF_LENGTH * 2, 0.09]} />
        <meshBasicMaterial color={PIECE_COLORS[1]} transparent opacity={0.55} />
      </mesh>

      {/* 영역 제약 경계 — clamp가 허용하는 정사각형의 테두리 네 줄 */}
      {[
        { position: [0, 0.01, CLAMP_HALF_EXTENT] as const, size: [CLAMP_HALF_EXTENT * 2, 0.05] as const },
        { position: [0, 0.01, -CLAMP_HALF_EXTENT] as const, size: [CLAMP_HALF_EXTENT * 2, 0.05] as const },
        { position: [CLAMP_HALF_EXTENT, 0.01, 0] as const, size: [0.05, CLAMP_HALF_EXTENT * 2] as const },
        { position: [-CLAMP_HALF_EXTENT, 0.01, 0] as const, size: [0.05, CLAMP_HALF_EXTENT * 2] as const },
      ].map((edge) => (
        <mesh
          key={`${edge.position[0]}-${edge.position[2]}`}
          position={edge.position}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <planeGeometry args={[edge.size[0], edge.size[1]]} />
          <meshBasicMaterial color={PIECE_COLORS[2]} transparent opacity={0.4} />
        </mesh>
      ))}
    </>
  );
}

export function Scene() {
  /** 지금 잡고 있는 말. 커서 변경과 발광 피드백의 단일 진실 공급원이다. */
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const handleDragEnd = useCallback(() => setDraggingId(null), []);

  /**
   * 드래그 중에는 커서를 grabbing으로 바꾼다.
   *
   * cleanup이 없으면 잡은 채로 페이지를 벗어났을 때 커서가 영원히 남는다
   * (pointer-raycast-hover 5절과 같은 함정).
   */
  useEffect(() => {
    if (draggingId === null) return;

    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [draggingId]);

  return (
    <>
      {/* 보드 전체(6유닛)를 담고 깊이가 읽히도록 비스듬히 내려다본다. far/near = 80. */}
      <PerspectiveCamera makeDefault fov={45} near={0.5} far={40} position={[0, 6.2, 7.4]} />

      <Environment resolution={256} environmentIntensity={0.5}>
        <Lightformer form="rect" intensity={4} scale={[12, 6]} position={[0, 7, -5]} color="#dce8ff" />
      </Environment>

      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 7, 4]} intensity={2.2} castShadow />

      {/* 보드. 드래그 대상이 아니므로 레이캐스팅에서 제외한다. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[BOARD_SIZE, BOARD_SIZE]} />
        <meshStandardMaterial color="#1d222b" roughness={0.9} />
      </mesh>

      <ConstraintGuides />

      {PIECES.map((piece) => (
        <DraggablePiece
          key={piece.id}
          config={piece}
          dragging={draggingId === piece.id}
          onDragStart={setDraggingId}
          onDragEnd={handleDragEnd}
        />
      ))}
    </>
  );
}
