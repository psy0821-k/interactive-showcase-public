"use client";

export { meta } from "./meta";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Scroll, ScrollControls, useScroll } from "@react-three/drei";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** 섹션 수. <ScrollControls>의 pages와 같아야 한다(뷰포트 1개 높이 = 1섹션). */
const SECTION_COUNT = 4;

/** 스크롤 offset 자체의 감쇠. 클수록 관성이 길다. */
const SCROLL_DAMPING = 0.25;

/** 전환 보간 감쇠율. 낮으면 씬이 스크롤을 못 따라오고, 높으면 range 값이 그대로 튄다. */
const TRANSITION_RATE = 6;
/** 모션 축소 시 즉각 전환에 가깝게. */
const TRANSITION_RATE_REDUCED = 40;

/** 분해 시 링이 코어에서 밀려나는 최대 거리. */
const EXPLODE_DISTANCE = 1.35;

/** 코어를 둘러싼 링 개수. */
const RING_COUNT = 4;

const RING_BASE_COLOR = new THREE.Color("#3d6ff2");
const RING_HOT_COLOR = new THREE.Color("#ffd166");

/**
 * 스크롤에서 파생된 씬 상태. SectionDirector가 매 프레임 갱신하고,
 * 각 링/코어가 자기 useFrame에서 읽어간다. setState가 아니라 공유 ref다.
 */
interface AssemblyState {
  /** 0(조립) ~ 1(완전 분해) */
  explode: number;
  /** 회전 진행률 0~1 (× 2π) */
  spin: number;
  /** 현재 강조 중인 링 인덱스 */
  highlightIndex: number;
  /** 강조 강도 0~1 */
  highlightAmount: number;
}

function createAssemblyState(): AssemblyState {
  return { explode: 0, spin: 0, highlightIndex: 0, highlightAmount: 0 };
}

interface RingProps {
  index: number;
  assembly: React.RefObject<AssemblyState>;
}

/**
 * 코어를 둘러싼 링 하나.
 *
 * 공유 assembly ref를 자기 useFrame에서 읽어 위치·색을 직접 갱신한다.
 * 렌더 중에는 ref를 읽지 않으므로 react-hooks/refs 규칙에 걸리지 않는다.
 */
function Ring({ index, assembly }: RingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const scratchColor = useMemo(() => new THREE.Color(), []);

  // 링마다 다른 축으로 기울여 입체적으로 보이게 한다. (정적)
  const tilt = (index / RING_COUNT) * Math.PI;
  const radius = 0.9 + index * 0.22;

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const { explode, highlightIndex, highlightAmount } = assembly.current;

    // 분해되면 링이 z축으로 밀려난다(앞뒤로 펼쳐짐).
    const offsetZ = (index - (RING_COUNT - 1) / 2) * EXPLODE_DISTANCE * explode;
    mesh.position.z = offsetZ;

    // 강조 대상인 링만 뜨거운 색으로 물든다.
    const heat = highlightIndex === index ? highlightAmount : 0;
    scratchColor.copy(RING_BASE_COLOR).lerp(RING_HOT_COLOR, heat);
    material.color.copy(scratchColor);
    material.emissive.copy(scratchColor).multiplyScalar(heat * 0.6);
  });

  return (
    <mesh ref={meshRef} rotation={[tilt, tilt * 0.5, 0]} castShadow>
      <torusGeometry args={[radius, 0.06, 16, 64]} />
      <meshStandardMaterial ref={materialRef} color={RING_BASE_COLOR} roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

/** 링 안쪽에서 도는 코어. */
function Core() {
  return (
    <mesh castShadow>
      <icosahedronGeometry args={[0.55, 1]} />
      <meshStandardMaterial
        color="#c9d4e6"
        roughness={0.3}
        metalness={0.5}
        emissive="#25406b"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

/**
 * 리액터 조립체 전체 — 스크롤을 씬 상태로 옮기고, 코어·링을 렌더한다.
 *
 * 공유 상태(assemblyRef)를 **이 컴포넌트가 소유하고 이 컴포넌트의 useFrame에서만
 * 변형**한다. 자식 링은 그 ref를 prop으로 받아 읽기만 하므로 React Compiler의
 * immutability 규칙(prop 변형 금지)에 걸리지 않는다.
 *
 * <ScrollControls>의 직계 자식(= <Scroll> 밖)이라 화면에 고정되고,
 * useScroll()로 진행률만 받는다.
 */
function ReactorAssembly() {
  const scroll = useScroll();
  const camera = useThree((state) => state.camera);
  const reducedMotion = useReducedMotion();

  const groupRef = useRef<THREE.Group>(null);
  const assemblyRef = useRef<AssemblyState>(createAssemblyState());
  const targetPos = useRef(new THREE.Vector3());

  // 초기 상태 — 스크롤 0 지점의 씬을 미리 잡아 첫 프레임 튐을 막는다.
  useEffect(() => {
    camera.position.set(0, 0.6, 6.2);
    camera.lookAt(0, 0, 0);
    if (groupRef.current) groupRef.current.rotation.y = 0;
    Object.assign(assemblyRef.current, createAssemblyState());
  }, [camera]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // 섹션 0(0.00~0.25): 조립 상태 소개
    // 섹션 1(0.25~0.50): 분해
    // 섹션 2(0.50~0.75): 한 바퀴 회전
    // 섹션 3(0.75~1.00): 링 순차 강조
    const explodeTarget = scroll.range(0.25, 0.25);
    const spinTarget = scroll.range(0.5, 0.25);
    // curve: 섹션 3 구간에서 0→1→0. 강조가 떠올랐다 가라앉는다.
    const highlightTarget = scroll.curve(0.75, 0.25);

    // range 값은 구간 경계에서 딱 잘리므로 지수 감쇠를 한 겹 더 씌운다.
    const rate = reducedMotion ? TRANSITION_RATE_REDUCED : TRANSITION_RATE;
    const factor = 1 - Math.exp(-rate * delta);

    const state = assemblyRef.current;
    state.explode += (explodeTarget - state.explode) * factor;
    state.spin += (spinTarget - state.spin) * factor;
    state.highlightAmount += (highlightTarget - state.highlightAmount) * factor;

    // 강조 대상 링은 섹션 3 안에서 순서대로 옮겨간다.
    const withinSection3 = THREE.MathUtils.clamp((scroll.offset - 0.75) / 0.25, 0, 1);
    state.highlightIndex = Math.min(
      RING_COUNT - 1,
      Math.floor(withinSection3 * RING_COUNT),
    );

    // 회전 — 목표 각도로 감쇠
    const targetRotation = state.spin * Math.PI * 2;
    group.rotation.y += (targetRotation - group.rotation.y) * factor;

    // 카메라 — 분해되면 살짝 물러나고, 강조 섹션에서 약간 위로.
    targetPos.current.set(0, 0.6 + state.highlightAmount * 0.5, 6.2 + state.explode * 1.4);
    camera.position.lerp(targetPos.current, factor);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <Core />
      {Array.from({ length: RING_COUNT }, (_, index) => (
        <Ring key={index} index={index} assembly={assemblyRef} />
      ))}
    </group>
  );
}

/** 섹션 카피. 순수 데이터라 모듈 스코프에 둔다. */
const SECTIONS = [
  { title: "01 · 코어 모듈", body: "리액터 코어와 4중 차폐 링. 스크롤해 구조를 분해합니다." },
  { title: "02 · 분해 뷰", body: "차폐 링이 축을 따라 펼쳐지며 코어가 드러납니다." },
  { title: "03 · 회전 점검", body: "조립체를 한 바퀴 돌려 각 링의 정렬을 확인합니다." },
  { title: "04 · 링 진단", body: "스크롤 위치에 따라 각 링이 순서대로 가열 시험을 거칩니다." },
] as const;

/** <Scroll html>에 들어갈 섹션 카피. 스크롤 컨테이너에 포털되어 각 페이지가 쌓인다. */
function SectionCopy() {
  return (
    <>
      {SECTIONS.map((section, index) => (
        <section
          key={section.title}
          style={{
            position: "absolute",
            top: `${index * 100}vh`,
            // 좌우 번갈아 배치해 3D 오브젝트(중앙)와 겹치지 않게 한다.
            left: index % 2 === 0 ? "7%" : "auto",
            right: index % 2 === 0 ? "auto" : "7%",
            width: "min(340px, 38%)",
            transform: "translateY(38vh)",
            color: "#e8edf5",
            // 카피는 표시 전용 — 포인터를 통과시켜 스크롤을 막지 않는다.
            pointerEvents: "none",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 22, letterSpacing: "0.02em" }}>
            {section.title}
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#9fb2cc" }}>
            {section.body}
          </p>
        </section>
      ))}
    </>
  );
}

export function Scene() {
  return (
    <ScrollControls pages={SECTION_COUNT} damping={SCROLL_DAMPING}>
      <PerspectiveCamera makeDefault fov={44} near={0.5} far={40} position={[0, 0.6, 6.2]} />
      <color attach="background" args={["#080b12"]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={2.1} castShadow />
      <directionalLight position={[-5, 2, -3]} intensity={0.55} color="#8fb4ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#12151d" roughness={0.95} />
      </mesh>

      {/* <Scroll> 밖 — 화면 중앙에 고정. 스크롤을 씬 상태로 옮기고 코어·링을 렌더한다. */}
      <ReactorAssembly />

      {/* <Scroll html> — DOM 섹션이 스크롤 컨테이너에 포털되어 함께 흐른다. */}
      <Scroll html>
        <SectionCopy />
      </Scroll>
    </ScrollControls>
  );
}
