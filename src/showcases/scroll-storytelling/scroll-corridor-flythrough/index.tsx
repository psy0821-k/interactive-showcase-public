"use client";

export { meta } from "./meta";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll } from "@react-three/drei";

/**
 * 스크롤 컨테이너의 길이. 캔버스 높이의 배수다.
 * 3이면 "캔버스 3화면 분량"을 굴려야 경로 끝에 닿는다.
 */
const SCROLL_PAGES = 3;

/** drei ScrollControls 자체의 스크롤 감쇠. 값이 클수록 관성이 길다. */
const SCROLL_DAMPING = 0.25;

/**
 * 카메라가 목표 상태를 따라가는 지수 감쇠 계수.
 * 낮으면 늘어지고, 높으면 스크롤 값이 그대로 들어가 뚝뚝 끊긴다.
 */
const CAMERA_DAMP_RATE = 6;

/** 시선 타깃이 카메라보다 경로상 얼마나 앞서는가(0~1 진행률 단위). */
const LOOK_AHEAD = 0.06;

/**
 * 통로의 안개 색이자 배경색.
 *
 * fog의 1번 규칙 — `<fog>` 색과 `<color attach="background">` 색이 같아야
 * 통로 끝 기둥이 "다른 색 실루엣"이 아니라 배경으로 매끄럽게 사라진다.
 * 같은 상수를 둘이 공유한다. (fog-and-atmosphere 참조)
 */
const FOG_COLOR = "#0b0f18";

/** 안개가 시작/완료되는 카메라 거리. far(34)는 카메라 far clip보다 작다. */
const FOG_NEAR = 6;
const FOG_FAR = 34;

/** 통로를 이루는 기둥 쌍의 개수. 이동이 눈에 보이게 하는 랜드마크다. */
const PILLAR_PAIR_COUNT = 9;

/** 기둥 쌍의 좌우 간격(월드 유닛) */
const PILLAR_SPREAD = 3.4;

/**
 * 기둥을 배치할 경로 구간의 끝(진행률).
 * 1.0으로 두면 경로 끝에서 카메라가 마지막 기둥을 지나쳐 빈 화면을 본다.
 * 마지막 구간을 비워 두고 그 자리에 도착 지점 오브젝트를 놓는다.
 */
const PILLAR_RANGE_END = 0.82;

/**
 * 카메라가 따라갈 경로의 제어점.
 *
 * 모듈 스코프에서 THREE 인스턴스를 만들면 갤러리 목록이 meta만 읽을 때도
 * 실행되므로(계약 7번), 좌표는 순수 배열로만 두고 곡선은 Scene 안에서 만든다.
 */
const PATH_POINTS: readonly [number, number, number][] = [
  [0, 1.6, 16],
  [-2.4, 1.9, 10],
  [1.8, 1.4, 4],
  [-1.6, 2.2, -2],
  [1.2, 1.6, -8],
  [0, 1.8, -14],
];

/** 경로 위 t 지점에 놓을 기둥 쌍의 위치를 만든다. */
function pillarPairPositions(
  curve: THREE.CatmullRomCurve3,
  index: number,
): { left: THREE.Vector3; right: THREE.Vector3 } {
  // 양 끝에 딱 붙지 않도록 안쪽으로 살짝 밀어넣고, 뒤쪽은 비워 둔다.
  const t = ((index + 0.5) / PILLAR_PAIR_COUNT) * PILLAR_RANGE_END;
  const center = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t);

  // 접선과 월드 up의 외적이 경로에 수직인 좌우 방향이 된다.
  const side = new THREE.Vector3()
    .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
    .normalize()
    .multiplyScalar(PILLAR_SPREAD / 2);

  return {
    left: center.clone().sub(side),
    right: center.clone().add(side),
  };
}

/**
 * 스크롤 진행률을 카메라 상태로 옮기는 본체.
 *
 * `<ScrollControls>` 자식이어야 `useScroll()`이 컨텍스트를 찾는다.
 */
function ScrollDrivenCamera({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const scroll = useScroll();
  const camera = useThree((state) => state.camera);

  // 매 프레임 재사용할 벡터. useFrame 안에서 new 하면 GC 압력이 생긴다.
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const smoothedLookAt = useRef(new THREE.Vector3());
  const tangent = useRef(new THREE.Vector3());

  // 외삽 거리를 월드 단위로 환산하는 데 쓴다. 곡선당 한 번만 계산한다.
  const curveLength = useMemo(() => curve.getLength(), [curve]);

  // 초기 프레임부터 경로 시작점에 있어야 한 프레임 튐이 없다.
  useEffect(() => {
    curve.getPointAt(0, targetPosition.current);
    camera.position.copy(targetPosition.current);
    curve.getPointAt(LOOK_AHEAD, smoothedLookAt.current);
    camera.lookAt(smoothedLookAt.current);
  }, [camera, curve]);

  useFrame((_, delta) => {
    // ScrollControls가 이미 감쇠한 0~1 값. 범위를 벗어나지 않게 한 번 더 잠근다.
    const progress = THREE.MathUtils.clamp(scroll.offset, 0, 1);

    // getPointAt은 호 길이로 재매개변수화된 값을 쓴다.
    // getPoint를 쓰면 제어점이 촘촘한 구간에서 카메라가 느려진다.
    curve.getPointAt(progress, targetPosition.current);

    // 시선 타깃은 카메라보다 조금 앞선 지점이다.
    // 경로 끝에서 clamp(…, 0, 1)로 잘라 버리면 타깃이 카메라 위치와 겹쳐
    // lookAt이 무의미해지고 시선이 홱 돌아간다. 끝을 넘어가는 만큼은
    // 접선 방향으로 외삽해 시선이 계속 진행 방향을 향하게 한다.
    const lookProgress = progress + LOOK_AHEAD;
    if (lookProgress <= 1) {
      curve.getPointAt(lookProgress, targetLookAt.current);
    } else {
      curve.getPointAt(1, targetLookAt.current);
      curve.getTangentAt(1, tangent.current);
      targetLookAt.current.addScaledVector(tangent.current, LOOK_AHEAD * curveLength);
    }

    // 프레임률과 무관한 지수 감쇠. delta를 지수에 넣어야 저프레임에서도 같다.
    const factor = 1 - Math.exp(-CAMERA_DAMP_RATE * delta);

    camera.position.lerp(targetPosition.current, factor);

    // 타깃도 같이 스무딩해야 회전이 튀지 않는다.
    // lookAt에 목표값을 바로 넣으면 위치만 부드럽고 시선은 계단처럼 꺾인다.
    smoothedLookAt.current.lerp(targetLookAt.current, factor);
    camera.lookAt(smoothedLookAt.current);
  });

  return null;
}

/** 경로 양옆에 세우는 랜드마크 기둥. 카메라 이동을 눈으로 드러낸다. */
function Pillars({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const pairs = useMemo(
    () =>
      Array.from({ length: PILLAR_PAIR_COUNT }, (_, index) => ({
        index,
        ...pillarPairPositions(curve, index),
      })),
    [curve],
  );

  return (
    <>
      {pairs.map(({ index, left, right }) => {
        // 앞뒤 기둥을 색으로 구분하면 어디까지 왔는지 즉시 읽힌다.
        const hue = index / PILLAR_PAIR_COUNT;
        const color = new THREE.Color().setHSL(0.55 - hue * 0.45, 0.6, 0.55);
        const height = 3 + (index % 3) * 0.9;

        return (
          <group key={index}>
            <mesh position={[left.x, height / 2, left.z]} castShadow>
              <boxGeometry args={[0.5, height, 0.5]} />
              <meshStandardMaterial
                color={color}
                roughness={0.5}
                metalness={0.15}
                emissive={color}
                emissiveIntensity={0.18}
              />
            </mesh>
            <mesh position={[right.x, height / 2, right.z]} castShadow>
              <boxGeometry args={[0.5, height, 0.5]} />
              <meshStandardMaterial
                color={color}
                roughness={0.5}
                metalness={0.15}
                emissive={color}
                emissiveIntensity={0.18}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/**
 * 경로 끝의 도착 지점 표식.
 *
 * 경로의 마지막 구간에는 기둥을 두지 않으므로, 여기에 아무것도 없으면
 * 다 스크롤했을 때 빈 화면만 남는다. 도착했다는 신호를 눈에 보이게 둔다.
 */
function ArrivalGate({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const position = useMemo(() => {
    // 경로 끝보다 조금 더 앞(진행 방향)에 놓아야 카메라가 정면으로 마주본다.
    const end = curve.getPointAt(1);
    const tangent = curve.getTangentAt(1);
    return end.addScaledVector(tangent, 9);
  }, [curve]);

  return (
    <mesh position={[position.x, 2.2, position.z]}>
      <torusGeometry args={[2.2, 0.22, 16, 48]} />
      <meshStandardMaterial
        color="#ffb347"
        emissive="#ffb347"
        emissiveIntensity={0.6}
        roughness={0.4}
      />
    </mesh>
  );
}

export function Scene() {
  /**
   * 카메라 경로. 제어점을 지나는 매끄러운 곡선이 되도록 catmullrom을 쓴다.
   * closed=false, curveType 'catmullrom' + tension 0.5 가 기본값이다.
   */
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        PATH_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      ),
    [],
  );

  return (
    /*
      캔버스 내부에 자체 스크롤 컨테이너를 만든다.
      이 갤러리의 상세 페이지는 캔버스를 고정 높이 박스(h-[60vh])에 넣고
      페이지 자체가 스크롤되므로, 페이지 스크롤에 카메라를 묶으면 캔버스가
      화면 밖으로 나간다. ScrollControls는 캔버스 부모에 자기 스크롤 div를
      붙이므로 셸을 고치지 않고도 성립한다.
    */
    <ScrollControls pages={SCROLL_PAGES} damping={SCROLL_DAMPING}>
      {/* 배경색을 fog 색과 같은 상수로 — 통로 끝이 배경으로 매끄럽게 사라진다. */}
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 12, 6]} intensity={1.8} castShadow />
      {/* 카메라가 앞으로 나아갈수록 어두워지지 않도록 경로 끝에도 광원을 둔다. */}
      <pointLight position={[0, 5, -12]} intensity={30} color="#8fd0ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#141a26" roughness={0.95} />
      </mesh>

      <Pillars curve={curve} />
      <ArrivalGate curve={curve} />
      <ScrollDrivenCamera curve={curve} />
    </ScrollControls>
  );
}
