"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  CuboidCollider,
  Physics,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneLabel, SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "물리 블록 타워",
  category: "interactive-art",
  usedSkills: [
    "standard-scene-setup",
    "pointer-raycast-hover",
    "physics-rigidbody",
  ],
  description:
    "rapier(Rust→wasm) 강체 물리로 A·B·C 세 시나리오를 한 씬에서 보여준다 — 15개 블록이 중력으로 쌓여 안착하고(A), 캔버스를 클릭하면 그 방향으로 공이 applyImpulse로 발사되며(B), 공이 부딪히면 탑이 회전하며 무너진다(C). 리셋은 블록 컨테이너 key를 올려 remount. 계기판은 useRapier().world에서 활성/sleeping 강체 수를 읽는다. prefers-reduced-motion이면 <Physics paused>로 정지.",
};

/** 블록 탑 — 5층 × 3×2 격자. 초기 위치는 결정적 함수(Math.random 금지). */
const BLOCK_ROWS = 5;
const BLOCK_COLS = 3;
const BLOCK_DEPTH = 2;
const BLOCK_SIZE = 0.5;
/** 블록 사이 아주 작은 틈 — 스폰 시 콜라이더가 겹치지 않게 한다. */
const BLOCK_GAP = 0.01;

/** 바닥 반경(half-extent). */
const FLOOR_HALF = 12;
/** 던진 공 개수 상한. 초과 시 가장 오래된 것을 언마운트. */
const MAX_BALLS = 8;
/** 공 반지름. */
const BALL_RADIUS = 0.28;
/** 던지기 임펄스 세기. 과하면 폭발한다. */
const THROW_IMPULSE = 9;
/** 공 스폰 지점 — 카메라 앞쪽, 탑과 떨어뜨려 겹침 스폰을 피한다. */
const BALL_SPAWN: [number, number, number] = [0, 1.6, 6.5];


/** 블록 하나의 배치 정보. */
interface BlockPlacement {
  position: [number, number, number];
  /** 맨 아래 두 층은 짙게 칠해 층 구분을 보여준다. */
  base: boolean;
}

/** 결정적 블록 배치. 3×2 격자를 5층으로 반듯하게 쌓는다. */
function buildTower(): BlockPlacement[] {
  const out: BlockPlacement[] = [];
  const pitch = BLOCK_SIZE + BLOCK_GAP;
  for (let row = 0; row < BLOCK_ROWS; row += 1) {
    for (let col = 0; col < BLOCK_COLS; col += 1) {
      for (let depth = 0; depth < BLOCK_DEPTH; depth += 1) {
        out.push({
          position: [
            (col - (BLOCK_COLS - 1) / 2) * pitch,
            BLOCK_SIZE / 2 + row * pitch,
            (depth - (BLOCK_DEPTH - 1) / 2) * pitch,
          ],
          base: row < 2,
        });
      }
    }
  }
  return out;
}

/** 던진 공 한 개. 스폰 직후 한 번 임펄스를 받는다. */
function ThrownBall({ direction }: { direction: THREE.Vector3 }) {
  const bodyRef = useRef<RapierRigidBody>(null);

  // applyImpulse는 렌더 중이 아니라 effect에서. 방향은 스폰 시 확정.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const impulse = direction.clone().normalize().multiplyScalar(THROW_IMPULSE);
    body.applyImpulse(impulse, true);
  }, [direction]);

  return (
    <RigidBody
      ref={bodyRef}
      position={BALL_SPAWN}
      colliders="ball"
      restitution={0.5}
      friction={0.6}
      // 빠르고 작은 물체 — 얇은 블록을 뚫지 않게 CCD를 켠다.
      ccd
    >
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 24, 12]} />
        <meshStandardMaterial color="#7bd88f" roughness={0.4} />
      </mesh>
    </RigidBody>
  );
}

/** 블록 탑 — key 변경으로 통째로 remount 하면 초기 위치로 재생성된다. */
function BlockTower({ blocks }: { blocks: BlockPlacement[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <RigidBody
          key={index}
          position={block.position}
          colliders="cuboid"
          restitution={0.1}
          friction={0.9}
          // 쌓인 블록의 제자리 미세 떨림을 억제한다.
          linearDamping={0.5}
          angularDamping={0.5}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
            <meshStandardMaterial
              color={block.base ? "#8b93a3" : "#c2c7d0"}
              roughness={0.8}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

/** 클릭으로 물리를 리셋하는 3D 버튼. */
function ResetButton({ onReset }: { onReset: () => void }) {
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onReset();
    },
    [onReset],
  );

  return (
    // 클릭 캐처(z=3)보다 카메라 쪽에 둬 RESET 클릭이 캐처에 가로채이지 않게 한다.
    <group position={[0, 0.02, 4.2]}>
      <mesh onClick={handleClick} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.5, 0.9]} />
        <meshStandardMaterial color="#e0574a" roughness={0.5} />
      </mesh>
      <SceneLabel
        position={[0, 0.32, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color="#0b0e14"
        anchorY="middle"
        outlineWidth={0}
      >
        RESET
      </SceneLabel>
    </group>
  );
}

/** useRapier().world에서 강체 통계를 읽는 계기판. */
function PhysicsStats({
  ballCount,
  paused,
}: {
  ballCount: number;
  paused: boolean;
}) {
  const { world } = useRapier();

  const getText = useCallback(() => {
    let sleeping = 0;
    world.bodies.forEach((body) => {
      if (body.isSleeping()) sleeping += 1;
    });
    return (
      `${paused ? "[ PAUSED ]  " : ""}강체 ${world.bodies.len()}  ·  ` +
      `sleeping ${sleeping}\n` +
      `던진 공 ${ballCount} / ${MAX_BALLS}`
    );
  }, [world, paused, ballCount]);

  return (
    <SceneReadout
      getText={getText}
      interval={0.25}
      backdrop={[5.8, 1.4]}
      position={[0, 3.3, -1]}
      fontSize={0.32}
      color="#cdd6f4"
      textAlign="center"
      lineHeight={1.45}
    />
  );
}

interface Ball {
  id: number;
  direction: THREE.Vector3;
}

/**
 * 물리 월드 내용.
 *
 * <Physics> 안에서만 useRapier가 유효하므로 통계·바닥·탑·공을 이 컴포넌트로 묶는다.
 */
function PhysicsWorld({
  paused,
  reducedMotion,
}: {
  paused: boolean;
  reducedMotion: boolean;
}) {
  const camera = useThree((state) => state.camera);

  // 던진 공 목록. 상한 초과 시 가장 오래된 것을 shift 한다.
  const [balls, setBalls] = useState<Ball[]>([]);
  const nextId = useRef(0);
  // 리셋 시 블록 컨테이너를 remount 하기 위한 key.
  const [towerKey, setTowerKey] = useState(0);

  const blocks = useMemo(() => buildTower(), []);

  const spawnBall = useCallback(
    (point: THREE.Vector3) => {
      if (reducedMotion) return;
      const direction = point.clone().sub(camera.position).normalize();
      setBalls((current) => {
        const id = nextId.current;
        nextId.current += 1;
        const next = [...current, { id, direction }];
        return next.length > MAX_BALLS ? next.slice(next.length - MAX_BALLS) : next;
      });
    },
    [camera, reducedMotion],
  );

  const handleReset = useCallback(() => {
    setBalls([]);
    setTowerKey((key) => key + 1);
  }, []);

  return (
    <Physics gravity={[0, -9.81, 0]} paused={paused}>
      {/*
        클릭 캐처 — 탑을 넉넉히 덮는 큰 투명 벽을 카메라와 탑 사이에 세운다.
        캔버스 어디를 클릭하든 이 벽이 먼저 광선을 받고, 그 교차점 방향으로
        공을 던진다. 탑 블록 30개에 핸들러를 다는 것보다 가볍고 빈 공간
        클릭도 잡힌다. 완전 투명 재질이라 화면엔 안 보이지만 raycast는 된다.
      */}
      <mesh
        position={[0, 2.5, 3]}
        onClick={(event) => {
          event.stopPropagation();
          spawnBall(event.point);
        }}
      >
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 바닥 — 안 움직인다. */}
      <RigidBody type="fixed" colliders={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[FLOOR_HALF * 2, FLOOR_HALF * 2]} />
          <meshStandardMaterial color="#2c2f38" roughness={0.95} />
        </mesh>
        {/* planeGeometry 자동 콜라이더는 두께 0이라 명시한다. */}
        <CuboidCollider args={[FLOOR_HALF, 0.1, FLOOR_HALF]} position={[0, -0.1, 0]} />
      </RigidBody>

      <BlockTower key={towerKey} blocks={blocks} />

      {balls.map((ball) => (
        <ThrownBall key={ball.id} direction={ball.direction} />
      ))}

      <ResetButton onReset={handleReset} />
      <PhysicsStats ballCount={balls.length} paused={paused} />
    </Physics>
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 2.8, 9]}
        fov={46}
        near={0.1}
        far={100}
      />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} color="#8fb4ff" />

      <PhysicsWorld paused={reducedMotion} reducedMotion={reducedMotion} />
    </>
  );
}
