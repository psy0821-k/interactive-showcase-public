"use client";

export { meta } from "./meta";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** 넓은 화면 기준 인스턴스 수. 이 값이 곧 args의 count가 되며 런타임에 늘릴 수 없다. */
const INSTANCE_COUNT_WIDE = 4_000;
/** 좁은 화면 기준 인스턴스 수. 저사양 기기의 프레임을 지킨다. */
const INSTANCE_COUNT_NARROW = 1_200;
/** 좁은 화면 기준선. Tailwind md 브레이크포인트와 맞춘다. */
const NARROW_BREAKPOINT = 768;

/** 큐브 한 변의 길이. 인스턴스가 많으므로 작게 둬야 군집으로 읽힌다. */
const CUBE_SIZE = 0.055;
/** 군집이 도는 궤도 반지름의 최소/최대. */
const ORBIT_RADIUS_MIN = 1.4;
const ORBIT_RADIUS_MAX = 3.6;
/** 군집의 상하 두께. */
const SWARM_HEIGHT = 2.2;
/** 궤도 각속도의 기준값. 반지름이 작을수록 빨라진다(케플러 느낌). */
const ORBIT_SPEED_BASE = 0.55;
/** 인스턴스 자체 자전 속도의 상한. */
const SPIN_SPEED_MAX = 1.8;
/** 상하 진동 진폭. */
const BOB_AMPLITUDE = 0.35;

/** 안쪽/바깥쪽 궤도의 색. 반지름 비율로 보간해 per-instance 색을 만든다. */
const INNER_COLOR = "#ff7a3d";
const OUTER_COLOR = "#4db2ff";

/** 인스턴스 하나의 고정 파라미터. 매 프레임 다시 계산하지 않는다. */
interface InstanceSeed {
  /** 궤도 반지름 */
  radius: number;
  /** 궤도 위 초기 각도 */
  angle: number;
  /** 궤도 각속도 (부호가 회전 방향) */
  orbitSpeed: number;
  /** 기준 높이 */
  baseHeight: number;
  /** 상하 진동 위상 */
  bobPhase: number;
  /** 자전 속도 */
  spinSpeed: number;
  /** 인스턴스별 크기 배율 */
  scale: number;
}

/**
 * 결정적 의사난수. 같은 인덱스에서 항상 같은 값을 돌려준다.
 *
 * Math.random()을 쓰면 리마운트마다 배치가 달라져 회귀를 눈으로 비교할 수 없다.
 * 인스턴싱은 "같은 입력에 같은 그림"이어야 디버깅이 가능하다.
 */
function pseudoRandom(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** 인스턴스 개수만큼 고정 파라미터를 만든다. count가 바뀔 때만 호출된다. */
function createSeeds(count: number): InstanceSeed[] {
  const seeds: InstanceSeed[] = [];

  for (let i = 0; i < count; i += 1) {
    // sqrt를 씌워야 반지름 방향으로 밀도가 균일해진다.
    // 그냥 균등 난수를 쓰면 안쪽에 몰려 보인다.
    const radiusRatio = Math.sqrt(pseudoRandom(i, 1));
    const radius = ORBIT_RADIUS_MIN + radiusRatio * (ORBIT_RADIUS_MAX - ORBIT_RADIUS_MIN);

    seeds.push({
      radius,
      angle: pseudoRandom(i, 2) * Math.PI * 2,
      // 안쪽일수록 빠르게 돌아 궤도가 감기며 나선 무늬가 생긴다.
      orbitSpeed: (ORBIT_SPEED_BASE / radius) * (pseudoRandom(i, 3) * 0.5 + 0.75),
      baseHeight: (pseudoRandom(i, 4) - 0.5) * SWARM_HEIGHT,
      bobPhase: pseudoRandom(i, 5) * Math.PI * 2,
      spinSpeed: (pseudoRandom(i, 6) - 0.5) * 2 * SPIN_SPEED_MAX,
      scale: 0.6 + pseudoRandom(i, 7) * 0.8,
    });
  }

  return seeds;
}

interface CubeSwarmProps {
  count: number;
  /** 모션 축소 시 자전·공전을 멈추고 정지된 배치만 보여준다. */
  paused: boolean;
}

/**
 * InstancedMesh 하나로 그리는 큐브 군집.
 *
 * 인스턴싱의 계약은 세 줄이다.
 * 1. 더미 Object3D에 위치/회전/스케일을 넣고 `updateMatrix()`를 부른다.
 * 2. 그 `matrix`를 `setMatrixAt(i, ...)`로 인스턴스에 쓴다.
 * 3. 루프가 끝난 뒤 `instanceMatrix.needsUpdate = true`를 세운다.
 *
 * 셋 중 하나라도 빠지면 아무것도 움직이지 않으며 에러도 나지 않는다.
 */
function CubeSwarm({ count, paused }: CubeSwarmProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 행렬 조립용 더미. 컴포넌트 스코프에 하나만 두고 4000번 재사용한다.
  // 루프 안에서 new THREE.Object3D()를 만들면 프레임당 수천 개가 버려져 GC가 튄다.
  // 모듈 스코프에 두면 Showcase Contract의 "부수효과 금지"와 부딪히므로 useMemo로 만든다.
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 고정 파라미터. count가 바뀌지 않으면 다시 만들지 않는다.
  const seeds = useMemo(() => createSeeds(count), [count]);

  // 색 보간용 임시 객체. 더미와 같은 이유로 재사용한다.
  const innerColor = useMemo(() => new THREE.Color(INNER_COLOR), []);
  const outerColor = useMemo(() => new THREE.Color(OUTER_COLOR), []);
  const scratchColor = useMemo(() => new THREE.Color(), []);

  /**
   * per-instance 색은 한 번만 쓰면 되므로 useFrame이 아니라 여기서 처리한다.
   *
   * useLayoutEffect인 이유: instanceColor 버퍼는 setColorAt이 처음 불릴 때
   * 비로소 생성된다(그 전에는 null). 첫 페인트 전에 채워야 색 없는 프레임이
   * 한 장 새지 않는다.
   */
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < count; i += 1) {
      const ratio =
        (seeds[i].radius - ORBIT_RADIUS_MIN) / (ORBIT_RADIUS_MAX - ORBIT_RADIUS_MIN);
      // 안쪽은 주황, 바깥쪽은 파랑. 반지름이 색으로 읽히면 궤도 구조가 눈에 보인다.
      scratchColor.copy(innerColor).lerp(outerColor, ratio);
      mesh.setColorAt(i, scratchColor);
    }

    // setColorAt이 버퍼를 만든 "뒤"에야 instanceColor가 non-null이 된다.
    // 루프 앞에서 접근하면 항상 null이라 옵셔널 체이닝이 조용히 아무 일도 안 한다.
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [count, seeds, innerColor, outerColor, scratchColor]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // 정지 상태에서도 최초 1회는 배치를 써야 한다.
    // 생성자가 모든 인스턴스를 단위행렬로 채워두므로, 쓰지 않으면 전부 원점에 겹친다.
    const time = paused ? 0 : state.clock.elapsedTime;

    for (let i = 0; i < count; i += 1) {
      const seed = seeds[i];
      const angle = seed.angle + time * seed.orbitSpeed;

      dummy.position.set(
        Math.cos(angle) * seed.radius,
        seed.baseHeight + Math.sin(time * 0.9 + seed.bobPhase) * BOB_AMPLITUDE,
        Math.sin(angle) * seed.radius,
      );
      dummy.rotation.set(time * seed.spinSpeed, angle, time * seed.spinSpeed * 0.6);
      dummy.scale.setScalar(seed.scale);

      // 이 한 줄이 빠지면 position/rotation/scale이 matrix에 반영되지 않는다.
      // 결과는 "전부 원점에 겹친 큐브 하나"이고 에러는 나지 않는다.
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    // 버퍼를 GPU로 올리라는 신호. 루프 안이 아니라 뒤에서 한 번만 세운다.
    // 빠뜨리면 첫 프레임 이후 아무 변화도 화면에 반영되지 않는다.
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    /*
      args의 세 번째 값이 인스턴스 수의 "상한"이다. 런타임에 늘릴 수 없고,
      count보다 큰 인덱스에 setMatrixAt을 하면 버퍼 밖이라 조용히 버려진다.
      count가 바뀌면 key로 인스턴스를 새로 만들어야 하는데,
      여기서는 부모가 key를 붙여 처리한다.

      frustumCulled를 끄는 이유: 인스턴스들은 메시 하나의 바운딩 구를 공유하고,
      그 구는 생성 시점의 단위행렬 기준(반지름 ≈ 큐브 크기)으로만 계산된다.
      매 프레임 setMatrixAt으로 흩뿌리는 이 씬에서는 실제 군집이 그 구를 훨씬
      벗어나므로, 컬링을 켜두면 카메라를 조금만 돌려도 군집 전체가 사라진다.
    */
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      {/*
        머티리얼은 인스턴스 전원이 공유한다. 색만 다르게 하려면 instanceColor를
        쓰고, 여기 color는 흰색으로 둔다. 둘은 곱해지므로 여기에 색을 주면
        per-instance 색 전체가 그 색조로 물든다.
      */}
      <meshStandardMaterial roughness={0.35} metalness={0.25} />
    </instancedMesh>
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();

  // 필요한 필드만 구독한다. size 객체 전체를 구독하면 height 변화에도 리렌더된다.
  const width = useThree((state) => state.size.width);

  const count = useMemo(
    () => (width < NARROW_BREAKPOINT ? INSTANCE_COUNT_NARROW : INSTANCE_COUNT_WIDE),
    [width],
  );

  return (
    <>
      {/*
        군집 지름이 약 7유닛이므로 기본 카메라(z=5)로는 잘린다.
        far/near = 40/0.5 = 80 으로 depth 정밀도는 여유롭다.
      */}
      <PerspectiveCamera makeDefault fov={45} near={0.5} far={40} position={[0, 2.6, 7.5]} />

      <color attach="background" args={["#0b0e16"]} />

      {/* 3점 조명. 인스턴스 표면의 굴곡이 보이려면 방향광이 필요하다. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 4]} intensity={2.4} />
      <directionalLight position={[-5, -2, -4]} intensity={0.6} color="#7aa2ff" />

      {/*
        count가 바뀌면 args의 상한도 바뀌어야 한다. R3F는 args가 변하면
        객체를 재생성하지만, key를 붙여 의도를 명시적으로 드러낸다.
      */}
      <CubeSwarm key={count} count={count} paused={reducedMotion} />
    </>
  );
}
