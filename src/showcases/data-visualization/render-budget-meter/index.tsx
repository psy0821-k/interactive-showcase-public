'use client';

export { meta } from './meta';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';

/** 계측 막대 개수. 최근 N초의 초당 렌더 수를 좌→우로 흘려보낸다. */
const HISTORY_LENGTH = 24;
/** 막대 하나의 폭 */
const BAR_WIDTH = 0.16;
/** 막대 간격 */
const BAR_GAP = 0.05;
/** 막대가 표현할 수 있는 최대 FPS. 이 값에서 막대가 천장에 닿는다. */
const FPS_CEILING = 60;
/** 막대 최대 높이(월드 단위) */
const BAR_MAX_HEIGHT = 1.1;
/** 히스토리를 한 칸 미는 주기(초) */
const SAMPLE_INTERVAL = 1;

/** 조작 대상 타일의 한 변 개수 */
const TILE_COLUMNS = 3;
/** 타일 한 변의 길이 */
const TILE_SIZE = 0.7;
/** 타일 간격 */
const TILE_GAP = 0.85;

/** 꺼진 타일 / 켜진 타일 색 */
const TILE_OFF_COLOR = '#3b4252';
const TILE_ON_COLOR = '#7bd88f';
/** 켜진 타일이 올라가는 높이 */
const TILE_LIFT = 0.28;

/** 막대 색 — 낮은 FPS(=적게 렌더됨, 아낀 상태)와 높은 FPS(=계속 렌더 중) */
const BAR_IDLE_COLOR = '#2f3b52';
const BAR_BUSY_COLOR = '#ff8f5e';

/** 렌더 예산을 소진 중임을 알리는 기준 FPS. 이 위로는 막대가 경고색이 된다. */
const BUSY_FPS_THRESHOLD = 5;

/**
 * 초당 렌더 수를 0~1로 정규화한다.
 * FPS_CEILING을 넘어도 막대가 천장을 뚫지 않도록 자른다.
 */
function normalizeFps(fps: number): number {
  return Math.min(fps / FPS_CEILING, 1);
}

/** 히스토리 인덱스에서 막대의 x 좌표를 만든다. */
function barPositionX(index: number): number {
  const pitch = BAR_WIDTH + BAR_GAP;
  return (index - (HISTORY_LENGTH - 1) / 2) * pitch;
}

/** 타일 인덱스에서 격자 위치를 만든다. */
function tilePosition(index: number): [number, number, number] {
  const column = index % TILE_COLUMNS;
  const row = Math.floor(index / TILE_COLUMNS);
  const offset = ((TILE_COLUMNS - 1) * TILE_GAP) / 2;
  return [column * TILE_GAP - offset, 0, row * TILE_GAP - offset];
}

interface RenderMeterProps {
  /** 막대 묶음이 놓일 위치 */
  position: [number, number, number];
}

/**
 * 렌더 계측 막대.
 *
 * demand 모드에서 `useFrame`은 "렌더가 일어나는 프레임"에만 돌기 때문에,
 * 여기서 프레임을 세는 것이 곧 렌더 횟수를 세는 것이다. 즉 이 막대는
 * frameloop 설정을 화면에서 직접 읽어내는 계측기 역할을 한다.
 *
 * - always 모드: 모든 막대가 60 근처에서 계속 차 있다.
 * - demand 모드: 조작을 멈추면 막대가 좌측으로 흘러가며 0으로 떨어진다.
 *
 * 주의: 이 컴포넌트는 스스로 invalidate를 부르지 않는다. 부르면 계측기가
 * 렌더를 유발해 자기가 재는 값을 오염시키고, demand 모드가 영원히 멈추지
 * 못한다. 계측은 "일어난 렌더를 관찰"할 뿐이어야 한다.
 */
function RenderMeter({ position }: RenderMeterProps) {
  // 막대 높이는 매 프레임 바뀌므로 state가 아니라 InstancedMesh 행렬로 만진다.
  // state로 두면 계측 자체가 리렌더를 유발해 값이 왜곡된다.
  const barsRef = useRef<THREE.InstancedMesh>(null);

  // 최근 HISTORY_LENGTH초의 초당 렌더 수. 인덱스가 클수록 최신이다.
  const history = useRef<number[]>(new Array(HISTORY_LENGTH).fill(0));
  /** 현재 구간에서 지금까지 센 프레임 수 */
  const framesInBucket = useRef(0);
  /** 현재 구간의 누적 시간(초) */
  const bucketElapsed = useRef(0);

  // 행렬·색 계산용 임시 객체. 매 프레임 new 하면 GC가 돈다.
  const scratchObject = useMemo(() => new THREE.Object3D(), []);
  const scratchColor = useMemo(() => new THREE.Color(), []);
  const idleColor = useMemo(() => new THREE.Color(BAR_IDLE_COLOR), []);
  const busyColor = useMemo(() => new THREE.Color(BAR_BUSY_COLOR), []);

  useFrame((_, delta) => {
    const bars = barsRef.current;
    if (!bars) return;

    framesInBucket.current += 1;
    bucketElapsed.current += delta;

    // 한 구간이 끝나면 히스토리를 한 칸 밀고 새 표본을 넣는다.
    if (bucketElapsed.current >= SAMPLE_INTERVAL) {
      const fps = framesInBucket.current / bucketElapsed.current;
      history.current.shift();
      history.current.push(fps);
      framesInBucket.current = 0;
      bucketElapsed.current = 0;
    }

    for (let index = 0; index < HISTORY_LENGTH; index += 1) {
      const fps = history.current[index];
      const ratio = normalizeFps(fps);
      // 0이어도 바닥선이 보이도록 최소 높이를 남긴다.
      const height = Math.max(ratio * BAR_MAX_HEIGHT, 0.02);

      scratchObject.position.set(barPositionX(index), height / 2, 0);
      scratchObject.scale.set(1, height, 1);
      scratchObject.updateMatrix();
      bars.setMatrixAt(index, scratchObject.matrix);

      // 렌더가 실제로 돌고 있는 구간만 경고색으로 물든다.
      scratchColor
        .copy(idleColor)
        .lerp(busyColor, fps > BUSY_FPS_THRESHOLD ? ratio : 0);
      bars.setColorAt(index, scratchColor);
    }

    bars.instanceMatrix.needsUpdate = true;
    if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
  });

  return (
    <group position={position}>
      {/*
        막대는 개수가 고정이고 머티리얼이 같으므로 InstancedMesh 하나로 그린다.
        높이 1인 박스를 scale.y로 늘이는 방식이라 지오메트리를 다시 만들지 않는다.
      */}
      <instancedMesh
        ref={barsRef}
        args={[undefined, undefined, HISTORY_LENGTH]}
        castShadow
      >
        <boxGeometry args={[BAR_WIDTH, 1, BAR_WIDTH]} />
        <meshStandardMaterial roughness={0.6} metalness={0.05} />
      </instancedMesh>

      {/* 막대 바닥의 기준선. 막대가 0일 때도 계측기가 어디 있는지 보인다. */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry
          args={[HISTORY_LENGTH * (BAR_WIDTH + BAR_GAP), 0.03, BAR_WIDTH * 1.6]}
        />
        <meshStandardMaterial color="#1b2130" roughness={0.9} />
      </mesh>
    </group>
  );
}

interface ToggleTileProps {
  index: number;
  active: boolean;
  onToggle: (index: number) => void;
}

/**
 * 클릭으로 켜고 끄는 타일 하나.
 *
 * 이 타일은 `useFrame`을 쓰지 않는다. 위치와 색이 전부 `active`에서 파생되고,
 * prop 변경은 R3F가 알아서 invalidate 한다(내부 `invalidateInstance`).
 * 그래서 demand 모드에서도 클릭 즉시 한 프레임이 그려진 뒤 다시 멈춘다 —
 * "상호작용할 때만 렌더한다"는 목표가 애니메이션 없이 성립하는 형태다.
 */
function ToggleTile({ index, active, onToggle }: ToggleTileProps) {
  const [x, , z] = tilePosition(index);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      // 뒤에 겹친 타일이나 바닥까지 같이 반응하지 않도록 광선을 여기서 끊는다.
      event.stopPropagation();
      onToggle(index);
    },
    [index, onToggle],
  );

  return (
    <mesh
      position={[x, active ? TILE_LIFT : 0, z]}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[TILE_SIZE, TILE_SIZE * 0.35, TILE_SIZE]} />
      <meshStandardMaterial
        color={active ? TILE_ON_COLOR : TILE_OFF_COLOR}
        emissive={TILE_ON_COLOR}
        emissiveIntensity={active ? 0.45 : 0}
        roughness={0.5}
        metalness={0.1}
      />
    </mesh>
  );
}

/** 타일 총 개수 */
const TILE_COUNT = TILE_COLUMNS * TILE_COLUMNS;

/** 파문이 지속되는 시간(초). 짧아야 렌더 루프가 금방 잠든다. */
const SETTLE_DURATION = 0.6;

interface SettleAnimationProps {
  /** 이 값이 늘어날 때마다 파문을 처음부터 다시 돌린다. */
  trigger: number;
}

/**
 * 잠깐만 돌고 멈추는 애니메이션.
 *
 * demand 모드에서 시간 기반 움직임을 쓰려면 매 프레임 스스로 다음 프레임을
 * 요청해야 한다. 여기서는 남은 시간이 있는 동안에만 invalidate를 이어 부르고,
 * 0에 닿으면 부르기를 멈춰 렌더 루프가 자연히 잠든다.
 *
 * 이것이 "애니메이션이 있는 씬에 demand를 쓰는" 유일하게 안전한 형태다.
 * 상시 애니메이션이라면 이 조건이 영원히 참이 되어 demand가 always와 같아진다.
 *
 * 종료를 state로 알리지 않는 것도 의도다. setState는 리렌더를 유발하고
 * 리렌더는 다시 invalidate를 부르므로, 애니메이션을 끄는 신호가 오히려
 * 프레임을 하나 더 만들어낸다.
 */
function SettleAnimation({ trigger }: SettleAnimationProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const invalidate = useThree((state) => state.invalidate);
  /** 남은 애니메이션 시간(초) */
  const remaining = useRef(0);

  // trigger가 바뀌면 파문 시간을 다시 채우고 첫 프레임을 요청한다.
  // 렌더 도중에 ref를 만지면 StrictMode 이중 렌더에서 두 번 채워지므로
  // 반드시 이펙트에서 한다.
  useEffect(() => {
    if (trigger === 0) return;
    remaining.current = SETTLE_DURATION;
    // 클릭으로 인한 리렌더가 이미 한 프레임을 예약하지만, 이 요청이 있어야
    // 파문의 첫 프레임이 확실히 그려진다.
    invalidate();
  }, [trigger, invalidate]);

  useFrame((_, delta) => {
    const ring = ringRef.current;
    const material = ringMaterialRef.current;
    if (!ring || !material) return;
    if (remaining.current <= 0) return;

    remaining.current -= delta;

    const progress = 1 - Math.max(remaining.current, 0) / SETTLE_DURATION;
    // 0 -> 1로 커지며 사라지는 파문.
    const scale = 0.4 + progress * 1.6;
    ring.scale.setScalar(scale);
    ring.visible = true;

    material.opacity = (1 - progress) * 0.5;

    if (remaining.current > 0) {
      // 아직 움직일 것이 남았다 -> 다음 프레임을 직접 요청한다.
      // 이 호출이 없으면 demand 모드에서 첫 프레임만 그려지고 멈춘다.
      invalidate();
      return;
    }

    // 다 돌았으면 요청을 멈춘다. 여기서 루프가 잠든다.
    remaining.current = 0;
    ring.visible = false;
  });

  return (
    <mesh
      ref={ringRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      visible={false}
    >
      <ringGeometry args={[0.9, 1.05, 48]} />
      <meshBasicMaterial
        ref={ringMaterialRef}
        color={TILE_ON_COLOR}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Scene() {
  // 어느 타일이 켜져 있는지. 상태 변경 -> prop 변경 -> R3F 자동 invalidate.
  const [activeTiles, setActiveTiles] = useState<boolean[]>(() =>
    new Array(TILE_COUNT).fill(false),
  );
  // 클릭할 때마다 증가하는 카운터. 파문을 다시 시작하는 신호로만 쓴다.
  // boolean이면 같은 타일을 연속으로 눌렀을 때 값이 안 바뀌어 파문이 안 돈다.
  const [settleTrigger, setSettleTrigger] = useState(0);

  const handleToggle = useCallback((index: number) => {
    setActiveTiles((previous) =>
      previous.map((value, current) => (current === index ? !value : value)),
    );
    setSettleTrigger((previous) => previous + 1);
  }, []);

  return (
    <>
      {/* 초기 구도: 계측 막대와 타일 격자가 한 화면에 들어오는 높이. */}
      <PerspectiveCamera
        makeDefault
        position={[0, 3.6, 6.6]}
        fov={44}
        near={0.1}
        far={50}
      />

      {/* 3점 조명. 어느 것도 애니메이션하지 않으므로 렌더를 유발하지 않는다. */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-5, 2, -3]}
        intensity={0.5}
        color="#8fb4ff"
      />

      {/* 바닥 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.13, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#151a25" roughness={0.95} />
      </mesh>

      {/* 조작 대상 — 클릭할 때만 상태가 바뀐다. */}
      <group position={[0, 0, 0.6]}>
        {activeTiles.map((active, index) => (
          <ToggleTile
            key={index}
            index={index}
            active={active}
            onToggle={handleToggle}
          />
        ))}
        <SettleAnimation trigger={settleTrigger} />
      </group>

      {/* 계측기 — 실제로 몇 번 렌더됐는지를 막대로 그린다. */}
      <RenderMeter position={[0, 0.1, -2.4]} />
    </>
  );
}
