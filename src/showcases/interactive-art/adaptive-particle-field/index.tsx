"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Points } from "three";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const meta: ShowcaseMeta = {
  title: "적응형 파티클 필드",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "responsive-canvas"],
  description:
    "화면 폭에 따라 파티클 개수를 낮춘다. 좁은 화면에서는 1/4로 줄어 저사양 기기의 프레임을 지킨다.",
};

/** 좁은 화면 기준선. Tailwind md 브레이크포인트와 맞춘다. */
const NARROW_BREAKPOINT = 768;
const PARTICLE_COUNT_WIDE = 8_000;
const PARTICLE_COUNT_NARROW = 2_000;
const FIELD_SIZE = 9;
const ROTATION_SPEED = 0.06;

/**
 * 파티클 위치 버퍼를 만든다.
 *
 * 렌더 함수 밖(모듈 스코프)에 두어 `Math.random()`이 렌더 중 호출로 잡히지
 * 않게 한다 (react-hooks/purity). `useMemo`가 count 변화 시에만 호출한다.
 */
function createPositions(count: number): Float32Array {
  const array = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    array[i * 3] = (Math.random() - 0.5) * FIELD_SIZE;
    array[i * 3 + 1] = (Math.random() - 0.5) * FIELD_SIZE;
    array[i * 3 + 2] = (Math.random() - 0.5) * FIELD_SIZE;
  }
  return array;
}

export function Scene() {
  const pointsRef = useRef<Points>(null);
  const reducedMotion = useReducedMotion();

  // 필요한 필드만 구독한다. size 객체 전체를 구독하면 height 변화에도 리렌더된다.
  const width = useThree((state) => state.size.width);

  // 브레이크포인트를 넘을 때만 값이 바뀌므로 배열 재생성도 그때만 일어난다.
  const count = useMemo(
    () => (width < NARROW_BREAKPOINT ? PARTICLE_COUNT_NARROW : PARTICLE_COUNT_WIDE),
    [width],
  );

  const positions = useMemo(() => createPositions(count), [count]);

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y += delta * ROTATION_SPEED;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      {/*
        key에 count를 넣어 개수가 바뀔 때 지오메트리를 새로 만든다.
        bufferAttribute의 args는 초기 생성에만 쓰이므로 이 처리가 필요하다.
      */}
      <points ref={pointsRef} key={count}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#8fb8ff"
          sizeAttenuation
          transparent
          opacity={0.9}
        />
      </points>
    </>
  );
}
