"use client";

export { meta } from "./meta";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";

/** 전시물 하나의 정의. 모듈 스코프에는 순수 데이터만 둔다(계약 7번). */
interface Exhibit {
  id: string;
  /** 좌대 위 중심 위치 */
  position: [number, number, number];
  color: string;
  /** 지오메트리 종류 — 크기가 서로 다르게 만들어 거리 유도를 드러낸다. */
  kind: "tall" | "wide" | "small";
}

/**
 * 전시물 3종.
 *
 * 일부러 크기를 크게 다르게 잡았다. 카메라 거리를 상수로 고정하면
 * 큰 것은 화면 밖으로 넘치고 작은 것은 점처럼 보이므로,
 * Box3로 실측해 거리를 유도해야 한다는 점이 눈으로 드러난다.
 */
const EXHIBITS: readonly Exhibit[] = [
  { id: "tower", position: [-2.6, 0, 0], color: "#f0a35e", kind: "tall" },
  { id: "slab", position: [0, 0, 0.4], color: "#7ecfff", kind: "wide" },
  { id: "gem", position: [2.5, 0, -0.2], color: "#b6f08a", kind: "small" },
];

/** 포커스가 없을 때(전체 뷰)의 카메라 위치와 타깃. */
const OVERVIEW_POSITION: [number, number, number] = [0, 2.4, 7.2];
const OVERVIEW_TARGET: [number, number, number] = [0, 0.7, 0];

/**
 * 카메라 추적 속도. 1 - exp(-rate * delta) 의 rate다.
 * 2~4는 늘어지고 12 이상은 스무딩이 사라진다. 5~8이 실용 범위.
 */
const FOCUS_DAMP_RATE = 5.5;

/**
 * 도착 판정 임계값(월드 단위).
 * 지수 감쇠는 수학적으로 목표에 영원히 닿지 않으므로,
 * 이 거리 안에 들어오면 스냅하고 전환을 끝낸다.
 */
const ARRIVAL_EPSILON = 0.01;

/**
 * 목표 거리 = 오브젝트 바운딩 구 반지름 × 이 배수.
 * fov 45 기준 2.5~3.0이 피사체를 화면 높이의 절반 남짓 채운다.
 */
const FIT_DISTANCE_FACTOR = 2.6;
/** 유도된 거리의 하한. 아주 작은 오브젝트에 코를 박지 않게 한다. */
const MIN_FOCUS_DISTANCE = 1.6;

/** 포커스 시 시선을 오브젝트 중심보다 살짝 위로 둔다. 좌대가 화면 밑을 채운다. */
const FOCUS_TARGET_LIFT = 0.05;

/** 카메라가 오브젝트에 접근하는 방향(정규화 전). 정면에서 살짝 위. */
const APPROACH_DIRECTION: [number, number, number] = [0.35, 0.42, 1];

/** 지오메트리 종류별 크기. Box3 실측 결과를 눈으로 대조하기 위한 값이다. */
const EXHIBIT_SIZES: Record<Exhibit["kind"], [number, number, number]> = {
  tall: [0.5, 2.4, 0.5],
  wide: [2.0, 0.5, 0.9],
  small: [0.34, 0.34, 0.34],
};

/** 프레임률과 무관한 지수 감쇠 계수. */
function dampFactor(delta: number, rate: number): number {
  return 1 - Math.exp(-rate * delta);
}

/**
 * `target`과 `update()`를 가진 궤도 컨트롤인지 좁힌다.
 *
 * R3F는 `state.controls`를 `EventDispatcher | null` 수준으로만 타이핑하므로
 * `any` 캐스팅 없이 쓰려면 타입 가드가 필요하다(전역 규칙: any 금지).
 */
function isOrbitLikeControls(
  value: unknown,
): value is { target: THREE.Vector3; update: () => void } {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { target?: unknown; update?: unknown };
  return (
    candidate.target instanceof THREE.Vector3 &&
    typeof candidate.update === "function"
  );
}

interface ExhibitMeshProps {
  exhibit: Exhibit;
  focused: boolean;
  onFocus: (id: string, object: THREE.Object3D) => void;
}

/**
 * 전시물 하나. 클릭 판정은 pointer-raycast-hover의 규칙을 그대로 따른다.
 *
 * - `stopPropagation()`을 먼저 불러 뒤에 있는 오브젝트와 바닥이 함께 반응하지 않게 한다.
 * - 클릭이 넘기는 것은 **id와 실제 Object3D**다. 카메라 목표는 그 오브젝트를
 *   Box3로 재서 유도하므로, 좌표를 따로 하드코딩할 필요가 없다.
 */
function ExhibitMesh({ exhibit, focused, onFocus }: ExhibitMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const size = EXHIBIT_SIZES[exhibit.kind];

  // 클릭 시 발광이 살짝 오르는 정도의 피드백. 상태에는 목표만 두고 전이는 프레임에서 한다.
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const factor = dampFactor(delta, 10);
    const targetIntensity = focused ? 0.55 : hovered ? 0.22 : 0;
    material.emissiveIntensity +=
      (targetIntensity - material.emissiveIntensity) * factor;
  });

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      // 겹친 오브젝트·바닥으로 클릭이 새지 않게 먼저 막는다.
      event.stopPropagation();
      const mesh = meshRef.current;
      if (!mesh) return;
      onFocus(exhibit.id, mesh);
    },
    [exhibit.id, onFocus],
  );

  const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setHovered(true);
  }, []);

  return (
    <group position={exhibit.position}>
      {/* 좌대. 클릭 대상이 아니므로 레이캐스팅에서 뺀다. */}
      <mesh position={[0, -0.06, 0]} receiveShadow raycast={() => null}>
        <cylinderGeometry args={[Math.max(size[0], size[2]) * 0.8, Math.max(size[0], size[2]) * 0.9, 0.12, 24]} />
        <meshStandardMaterial color="#2a2f38" roughness={0.8} />
      </mesh>

      <mesh
        ref={meshRef}
        position={[0, size[1] / 2, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          ref={materialRef}
          color={exhibit.color}
          emissive={exhibit.color}
          emissiveIntensity={0}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
    </group>
  );
}

interface FocusCameraRigProps {
  /** 현재 포커스 대상. null이면 전체 뷰로 복귀한다. */
  focusedId: string | null;
  /** 포커스 대상의 실제 Object3D. Box3로 크기를 재기 위해 필요하다. */
  focusedObject: THREE.Object3D | null;
}

/**
 * 카메라 전환 담당. 이 컴포넌트가 이 skill의 전부다.
 *
 * 1. **카메라 소유권** — 셸의 `<OrbitControls makeDefault />`는 priority -1의
 *    useFrame에서 매 프레임 `controls.update()`를 부른다. 그 update는
 *    `controls.target`을 기준으로 카메라를 재배치하므로, 위치만 보간하면
 *    다음 프레임에 되돌아간다. 그래서 **위치와 target을 함께 쓰고 update()를
 *    직접 부른다.** 컨트롤을 끄지 않으므로 도착 후 사용자가 그대로 궤도를 돌릴 수 있다.
 * 2. **위치와 타깃 동시 보간** — 타깃을 즉시 대입하면 도착 전에 시선이 홱 꺾인다.
 * 3. **도착 판정** — 임계 거리 안에 들어오면 스냅하고 전환 플래그를 내린다.
 *    그 뒤로는 카메라를 만지지 않아 사용자의 궤도 조작을 뺏지 않는다.
 */
function FocusCameraRig({ focusedId, focusedObject }: FocusCameraRigProps) {
  // 훅 반환값을 직접 변형하면 React Compiler가 lint 에러로 막는다(troubleshooting 12-G).
  // 스토어 getter로 그때그때 꺼내면 "훅 반환값 변형"이 아니다.
  const getR3FState = useThree((state) => state.get);

  // 매 프레임 재사용하는 벡터들. useFrame 안에서 new 하지 않기 위해서다.
  const desiredPosition = useRef(new THREE.Vector3(...OVERVIEW_POSITION));
  const desiredTarget = useRef(new THREE.Vector3(...OVERVIEW_TARGET));
  const scratchBox = useRef(new THREE.Box3());
  const scratchSphere = useRef(new THREE.Sphere());
  const approach = useRef(
    new THREE.Vector3(...APPROACH_DIRECTION).normalize(),
  );

  /** 전환 중인지. setState로 두면 프레임마다 리렌더가 나므로 ref다. */
  const isTransitioning = useRef(false);

  /**
   * 클릭된 오브젝트에서 카메라 목표를 유도한다.
   *
   * 좌표를 하드코딩하지 않는 이유: 오브젝트마다 크기가 다르면 같은 거리에서
   * 화면 점유율이 완전히 달라진다. `Box3.setFromObject`로 월드 기준 경계를 재고,
   * 그 바운딩 구의 반지름에 비례해 거리를 잡으면 크기와 무관하게 일정해진다.
   */
  const aimAt = useCallback((object: THREE.Object3D) => {
    const box = scratchBox.current.setFromObject(object);
    const sphere = box.getBoundingSphere(scratchSphere.current);

    const distance = Math.max(
      MIN_FOCUS_DISTANCE,
      sphere.radius * FIT_DISTANCE_FACTOR,
    );

    desiredTarget.current.copy(sphere.center);
    desiredTarget.current.y += FOCUS_TARGET_LIFT;

    // 중심에서 접근 방향으로 distance만큼 물러난 지점이 카메라 자리다.
    desiredPosition.current
      .copy(desiredTarget.current)
      .addScaledVector(approach.current, distance);

    isTransitioning.current = true;
  }, []);

  /** 포커스 해제 — 전체 뷰로 복귀. */
  const aimAtOverview = useCallback(() => {
    desiredTarget.current.set(...OVERVIEW_TARGET);
    desiredPosition.current.set(...OVERVIEW_POSITION);
    isTransitioning.current = true;
  }, []);

  /*
   * 목표 교체는 focusedId가 바뀔 때 한 번만 계산하면 된다.
   *
   * 전환 도중에 새 클릭이 들어와도 특별한 처리가 없다는 점이 중요하다.
   * 카메라의 "현재 위치"는 건드리지 않고 목표(desired*)만 바꾸므로,
   * 다음 프레임부터 지금 있는 자리에서 새 목표로 이어서 감쇠한다.
   * 진행률이나 시작점을 들고 있었다면 여기서 리셋 처리가 필요했을 것이다.
   */
  useEffect(() => {
    if (focusedId === null || focusedObject === null) {
      aimAtOverview();
      return;
    }
    aimAt(focusedObject);
  }, [focusedId, focusedObject, aimAt, aimAtOverview]);

  useFrame((state, delta) => {
    // 전환이 끝났으면 카메라를 놓아준다. 사용자의 궤도 조작을 뺏지 않기 위해서다.
    if (!isTransitioning.current) return;

    const { controls } = getR3FState();
    const factor = dampFactor(delta, FOCUS_DAMP_RATE);

    state.camera.position.lerp(desiredPosition.current, factor);

    if (isOrbitLikeControls(controls)) {
      // 위치와 타깃을 같은 계수로 함께 보간해야 회전이 튀지 않는다.
      controls.target.lerp(desiredTarget.current, factor);
      // OrbitControls는 target 기준으로 카메라를 정렬한다. 직접 불러 이번 프레임에 반영한다.
      controls.update();
    } else {
      // 컨트롤이 없는 구성에서도 동작하도록 한 대비책.
      state.camera.lookAt(desiredTarget.current);
    }

    // 도착 판정 — 지수 감쇠는 목표에 영원히 닿지 않으므로 임계값으로 끊는다.
    const positionGap = state.camera.position.distanceTo(desiredPosition.current);
    const targetGap = isOrbitLikeControls(controls)
      ? controls.target.distanceTo(desiredTarget.current)
      : 0;

    if (positionGap < ARRIVAL_EPSILON && targetGap < ARRIVAL_EPSILON) {
      state.camera.position.copy(desiredPosition.current);
      if (isOrbitLikeControls(controls)) {
        controls.target.copy(desiredTarget.current);
        controls.update();
      }
      isTransitioning.current = false;
    }
  });

  return null;
}

/** 포커스 선택 상태. 대상 오브젝트를 함께 들어야 Box3로 크기를 잴 수 있다. */
interface FocusSelection {
  id: string;
  object: THREE.Object3D;
}

export function Scene() {
  /*
   * 포커스 대상은 React 상태다. 전환 "진행 상태"와 혼동하지 않는다.
   * - 무엇을 보고 있는가(선택) → 클릭 때 한 번 바뀌고 렌더에 반영된다 → useState
   * - 지금 어디까지 갔는가(진행) → 매 프레임 바뀌고 렌더에 안 쓴다 → rig 내부의 ref
   */
  const [selection, setSelection] = useState<FocusSelection | null>(null);
  const focusedId = selection?.id ?? null;

  const handleFocus = useCallback((id: string, object: THREE.Object3D) => {
    setSelection({ id, object });
  }, []);

  /** 빈 곳(바닥) 클릭 = 포커스 해제. */
  const handleClearFocus = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    setSelection(null);
  }, []);

  return (
    <>
      {/*
        전시대 전체 폭이 약 6유닛이라 기본 카메라(z=5, fov 75)로는 담기지 않는다.
        near/far = 0.3/60 으로 비율 200 — depth 정밀도에 여유가 크다.
      */}
      <PerspectiveCamera
        makeDefault
        fov={45}
        near={0.3}
        far={60}
        position={OVERVIEW_POSITION}
      />

      <Environment resolution={256} environmentIntensity={0.5}>
        <Lightformer
          form="rect"
          intensity={4}
          scale={[12, 5]}
          position={[0, 6, 3]}
          color="#dbe6ff"
        />
      </Environment>

      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} castShadow />

      {/* 바닥. 클릭하면 포커스가 풀린다. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
        receiveShadow
        onClick={handleClearFocus}
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#161a21" roughness={0.95} />
      </mesh>

      {EXHIBITS.map((exhibit) => (
        <ExhibitMesh
          key={exhibit.id}
          exhibit={exhibit}
          focused={focusedId === exhibit.id}
          onFocus={handleFocus}
        />
      ))}

      <FocusCameraRig
        focusedId={focusedId}
        focusedObject={selection?.object ?? null}
      />
    </>
  );
}
