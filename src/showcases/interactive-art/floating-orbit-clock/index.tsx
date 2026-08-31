"use client";

export { meta } from "./meta";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { SceneLabel } from "@/components/scene-label";

/** 궤도를 도는 오브젝트 개수. 위상 오프셋으로 서로 어긋나게 움직인다. */
const ORB_COUNT = 5;
/** 궤도 반지름 */
const ORBIT_RADIUS = 1.15;
/** 궤도 각속도(라디안/초). 초당 회전수 = ORBIT_SPEED / (2π) */
const ORBIT_SPEED = 1.1;

/** 부유(bobbing) 진폭. 오브젝트 크기의 절반 이하가 자연스럽다. */
const BOB_AMPLITUDE = 0.16;
/** 부유 주기 각속도(라디안/초). 2π/BOB_SPEED 초마다 한 번 오르내린다. */
const BOB_SPEED = 2.2;

/** 두 리그를 좌우로 벌리는 거리. 궤도 반지름의 1.6배 이상이어야 두 리그가 겹치지 않는다. */
const RIG_OFFSET_X = 1.95;

/** 구체 반지름 */
const ORB_RADIUS = 0.19;
/** 중심 코어 반지름 */
const CORE_RADIUS = 0.44;

/**
 * delta 클램프 상한(초).
 *
 * 탭을 전환했다 돌아오면 rAF가 멈춰 있던 시간이 한 프레임 delta로 들어온다.
 * R3F는 `clock.getDelta()`를 클램프 없이 그대로 넘기므로 여기서 막아야
 * 오브젝트가 한 프레임 만에 순간이동한다. 1/10초 = 10fps 상당.
 */
const MAX_DELTA = 0.1;

/** 지수 감쇠 계수. 클수록 목표에 빨리 붙는다. */
const DAMP_RATE = 4.5;

/** 인위적 부하로 프레임을 떨어뜨릴 때 한 프레임에 태울 시간(밀리초). */
const STALL_MS = 55;
/** 부하를 거는 주기(초). 이 간격마다 STALL_MS 만큼 프레임을 막는다. */
const STALL_INTERVAL = 0.22;

const FRAME_DEPENDENT_COLOR = "#ff6b6b";
const DELTA_NORMALIZED_COLOR = "#4dd4ac";
const CORE_COLOR = "#2c3440";
const LABEL_COLOR = "#e8edf5";

/**
 * 프레임률과 무관한 지수 감쇠 보간 계수.
 *
 * `lerp(a, b, 0.1)`은 "프레임마다 10%"라서 프레임률이 바뀌면 속도가 바뀐다.
 * `1 - exp(-rate * delta)`는 "초당 rate의 비율로 수렴"이라 프레임률과 무관하다.
 */
function dampFactor(rate: number, delta: number): number {
  return 1 - Math.exp(-rate * delta);
}

/**
 * easeInOutCubic. 정규화된 진행률 t(0~1)를 받아 0~1을 돌려준다.
 *
 * 진행률을 시간으로 만들고 이징은 그 위에 얹는다. 이징 함수 자체는
 * 시간을 모르는 순수 함수여야 재사용된다.
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 0~1을 왕복(0→1→0)으로 접는다. 반복 애니메이션의 진행률에 쓴다. */
function pingPong(t: number): number {
  return 1 - Math.abs(t * 2 - 1);
}

/** 누적 위상을 0~1 진행률로 접는다. 이징 입력으로 쓰기 위한 정규화다. */
function pulseProgress(phase: number): number {
  return (phase % (Math.PI * 2)) / (Math.PI * 2);
}

interface OrbitRigProps {
  /** 좌우 배치 위치 */
  positionX: number;
  /** true면 delta를 곱해 정규화하고, false면 프레임마다 고정량을 더한다. */
  normalized: boolean;
  color: string;
  label: string;
}

/**
 * 궤도 리그 하나.
 *
 * `normalized` 하나로 두 방식을 가른다. 같은 컴포넌트를 두 번 쓰므로
 * 차이가 오직 delta 처리에서만 온다는 것이 구조적으로 보장된다.
 */
function OrbitRig({ positionX, normalized, color, label }: OrbitRigProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  /**
   * 누적 각도. state가 아니라 ref다.
   * useFrame 안에서 setState를 부르면 초당 60회 리렌더가 나고, 그 리렌더가
   * 다음 프레임을 늦춰 애니메이션이 더 끊긴다.
   */
  const angleRef = useRef(0);
  /** 부유 위상. 궤도와 주기가 달라야 움직임이 기계적으로 보이지 않는다. */
  const bobPhaseRef = useRef(0);

  // 구체별 위상 오프셋. 같은 수식을 쓰면서도 서로 어긋나 보이게 하는 유일한 장치다.
  const phaseOffsets = useMemo(
    () =>
      Array.from(
        { length: ORB_COUNT },
        (_, index) => (index / ORB_COUNT) * Math.PI * 2,
      ),
    [],
  );

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const core = coreRef.current;
    if (!group || !core) return;

    // 탭 복귀 시의 거대한 delta를 막는다. 정규화 방식에만 의미가 있다.
    const delta = Math.min(rawDelta, MAX_DELTA);

    if (normalized) {
      // delta(초)를 곱하므로 각속도는 "초당 라디안"이다. 프레임률과 무관하다.
      angleRef.current += ORBIT_SPEED * delta;
      bobPhaseRef.current += BOB_SPEED * delta;
    } else {
      // 프레임마다 고정량. 60fps에서 ORBIT_SPEED와 같아 보이도록 맞춘 값이라,
      // 30fps에서는 절반 속도, 120Hz에서는 두 배 속도가 된다.
      angleRef.current += ORBIT_SPEED / 60;
      bobPhaseRef.current += BOB_SPEED / 60;
    }

    group.rotation.y = angleRef.current;

    // 코어 스케일은 목표값을 향한 지수 감쇠로 붙인다.
    // 정규화 리그만 delta를 쓰므로, 저프레임에서 수렴 속도 차이도 함께 드러난다.
    const targetScale = 1 + easeInOutCubic(pingPong(pulseProgress(bobPhaseRef.current))) * 0.12;
    const factor = normalized ? dampFactor(DAMP_RATE, delta) : DAMP_RATE / 60;
    core.scale.setScalar(core.scale.x + (targetScale - core.scale.x) * factor);
  });

  return (
    <group position={[positionX, 0, 0]}>
      {/* 라벨은 회전 그룹 밖에 둬야 함께 돌지 않는다. */}
      <SceneLabel position={[0, 1.35, 0]} fontSize={0.19} color={LABEL_COLOR} outlineWidth={0.008}>
        {label}
      </SceneLabel>

      <mesh ref={coreRef} castShadow receiveShadow>
        <icosahedronGeometry args={[CORE_RADIUS, 1]} />
        <meshStandardMaterial color={CORE_COLOR} roughness={0.55} metalness={0.35} />
      </mesh>

      {/* 이 그룹만 회전시키면 자식 구체 전부가 궤도를 돈다 — 개별 좌표 계산이 필요 없다. */}
      <group ref={groupRef}>
        {phaseOffsets.map((offset, index) => (
          <OrbitingOrb
            key={index}
            phaseOffset={offset}
            normalized={normalized}
            color={color}
          />
        ))}
      </group>
    </group>
  );
}

interface OrbitingOrbProps {
  phaseOffset: number;
  normalized: boolean;
  color: string;
}

/**
 * 궤도 위의 구체 하나.
 *
 * 수평 배치는 부모 그룹의 회전이 담당하고, 이 컴포넌트는 부유(y)만 맡는다.
 * 부유는 절대 시간 기반 사인이라 누적 오차가 없다.
 */
function OrbitingOrb({ phaseOffset, normalized, color }: OrbitingOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  /** 프레임 의존 리그가 쓰는 누적 위상. 절대 시간을 쓰지 않는다는 점이 차이다. */
  const framePhaseRef = useRef(phaseOffset);

  // 궤도 위 고정 좌표. 회전은 부모가 하므로 여기서는 반지름 배치만 한다.
  const basePosition = useMemo<[number, number, number]>(() => {
    return [
      Math.cos(phaseOffset) * ORBIT_RADIUS,
      0,
      Math.sin(phaseOffset) * ORBIT_RADIUS,
    ];
  }, [phaseOffset]);

  // 두 방식 모두 delta를 쓰지 않는다. 절대 시간 사인은 delta가 필요 없고,
  // 프레임 의존 방식은 delta를 "쓰지 않는 것"이 곧 그 방식의 정의다.
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (normalized) {
      /**
       * 절대 시간 기반. getElapsedTime()은 캔버스 시작 이후 경과 초다.
       * 사인처럼 "시각 t의 함수"로 정의되는 움직임은 이쪽이 옳다 —
       * 프레임을 몇 개 건너뛰어도 위상이 제자리를 찾는다.
       */
      const time = state.clock.getElapsedTime();
      mesh.position.y = Math.sin(time * BOB_SPEED + phaseOffset) * BOB_AMPLITUDE;
    } else {
      // 프레임마다 고정량을 누적한다. 프레임이 밀리면 위상도 함께 밀린다.
      framePhaseRef.current += BOB_SPEED / 60;
      mesh.position.y = Math.sin(framePhaseRef.current) * BOB_AMPLITUDE;
    }
  });

  return (
    <mesh ref={meshRef} position={basePosition} castShadow receiveShadow>
      <sphereGeometry args={[ORB_RADIUS, 24, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
}

/**
 * 인위적으로 프레임을 떨어뜨린다.
 *
 * Acceptance Criteria의 "저프레임 환경 시뮬레이션"을 눈으로 확인하기 위한 장치다.
 * 일정 간격마다 메인 스레드를 바쁜 루프로 막아 프레임 간격을 늘린다.
 *
 * priority를 주지 않았으므로(기본 0) R3F의 자동 렌더링은 그대로 유지된다.
 * 등록 순서가 아니라 priority 오름차순으로 실행되며, 같은 priority 안에서는
 * 등록 순서다. 이 콜백은 다른 콜백보다 먼저 돌든 나중에 돌든 결과가 같다.
 */
function FrameStaller() {
  const accumulatorRef = useRef(0);

  useFrame((_, delta) => {
    accumulatorRef.current += Math.min(delta, MAX_DELTA);
    if (accumulatorRef.current < STALL_INTERVAL) return;

    accumulatorRef.current = 0;

    // 의도적인 블로킹. 실제 코드에서는 절대 하지 않는다.
    const until = performance.now() + STALL_MS;
    while (performance.now() < until) {
      // 메인 스레드를 붙잡아 다음 프레임을 늦춘다.
    }
  });

  return null;
}

export function Scene() {
  return (
    <>
      {/*
        두 리그(폭 약 6.2유닛)와 상단 라벨을 함께 담아야 한다.
        상세 페이지의 캔버스는 정사각형에 가까워 가로가 곧 제약이므로,
        기본 카메라(z=5, fov 75)보다 좁은 화각으로 충분히 물러나 잡는다.
        y를 약간 올려 두 리그를 내려다보면 궤도의 원이 타원으로 보여
        회전 속도 차이를 읽기 쉽다.
        far/near = 40/0.5 = 80 으로 depth 정밀도는 여유롭다.
      */}
      <PerspectiveCamera makeDefault fov={40} near={0.5} far={40} position={[0, 2.1, 9.2]} />

      <Environment resolution={256} environmentIntensity={0.5}>
        <Lightformer
          form="rect"
          intensity={4}
          scale={[10, 5]}
          position={[0, 6, -4]}
          color="#dce8ff"
        />
      </Environment>

      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 4]} intensity={2.1} castShadow />

      {/* 바닥. 부유 높이를 눈으로 가늠할 기준면이다. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#161a21" roughness={0.95} />
      </mesh>

      {/*
        같은 컴포넌트를 normalized만 바꿔 두 번 쓴다.
        FrameStaller가 프레임을 떨어뜨리면 왼쪽만 느려진다.
      */}
      <OrbitRig
        positionX={-RIG_OFFSET_X}
        normalized={false}
        color={FRAME_DEPENDENT_COLOR}
        label="프레임 의존 (+= 고정량)"
      />
      <OrbitRig
        positionX={RIG_OFFSET_X}
        normalized
        color={DELTA_NORMALIZED_COLOR}
        label="delta 정규화 (× delta)"
      />

      <FrameStaller />
    </>
  );
}
