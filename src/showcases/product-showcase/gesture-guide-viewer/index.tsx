"use client";

export { meta } from "./meta";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Html, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** 입력 방식. 첫 포인터 이벤트로 확정. 초기값은 중립 문구를 쓰므로 무관하나
 *  마우스가 데스크톱 다수라 "mouse"로 둔다. */
type InputKind = "mouse" | "touch";

/** 제품 색. 결정적 상수 (Math.random 금지, 계약 6). */
const BODY_COLOR = "#c9d4e6";
const ACCENT_COLOR = "#6ee7b7";

/**
 * 회전을 눈으로 확인하기 위한 제품 — 비대칭 형태라 어느 방향을 보는지 알 수 있다.
 * 본체 박스 + 한쪽에 액센트 블록 + 상단 손잡이.
 */
function Product({
  onFirstPointer,
}: {
  onFirstPointer: (kind: InputKind) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  // 조작이 없을 때 아주 느리게 자전 — "정지 화면"이 아님을 보이고, 관성과
  // 겹치지 않도록 느리게. reduced-motion이면 자전도 멈춘다.
  useFrame((_, delta) => {
    if (reducedMotion) return;
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.15;
  });

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // ThreeEvent는 네이티브 PointerEvent를 nativeEvent로 감싼다.
      const type = event.nativeEvent.pointerType;
      if (type === "touch" || type === "pen") onFirstPointer("touch");
      else onFirstPointer("mouse");
    },
    [onFirstPointer],
  );

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* 본체 */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 1, 0.9]} />
        <meshStandardMaterial color={BODY_COLOR} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* 액센트 블록 — 앞면 오른쪽에 붙여 방향을 드러낸다 */}
      <mesh castShadow position={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[0.3, 0.6, 0.12]} />
        <meshStandardMaterial color={ACCENT_COLOR} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* 상단 손잡이 */}
      <mesh castShadow position={[0, 1.1, 0]}>
        <torusGeometry args={[0.28, 0.05, 12, 32]} />
        <meshStandardMaterial color={BODY_COLOR} metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** 조작 안내 HUD. 입력 방식에 따라 문구가 바뀐다. */
function GestureHint({ input }: { input: InputKind }) {
  const style = useMemo<CSSProperties>(
    () => ({
      padding: "8px 12px",
      borderRadius: 8,
      background: "rgba(9, 12, 18, 0.82)",
      border: "1px solid rgba(138, 180, 255, 0.35)",
      color: "#e8edf5",
      fontSize: 12,
      lineHeight: 1.5,
      whiteSpace: "nowrap",
      pointerEvents: "none",
      userSelect: "none",
    }),
    [],
  );

  const lines =
    input === "touch"
      ? ["두 손가락으로 회전 · 벌려서 줌", "한 손가락으로는 페이지 스크롤"]
      : ["드래그하여 회전 · 휠로 줌", "놓으면 관성으로 잠시 더 돕니다"];

  return (
    <Html position={[0, -1.15, 0]} center distanceFactor={9} zIndexRange={[120, 0]}>
      <div style={style}>
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </Html>
  );
}

export function Scene() {
  const [input, setInput] = useState<InputKind>("mouse");

  // 첫 입력에서만 확정 — 이후 입력 방식이 바뀌면 그때 갱신 (하이브리드 기기).
  const handleFirstPointer = useCallback((kind: InputKind) => {
    setInput((current) => (current === kind ? current : kind));
  }, []);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={40}
        near={0.5}
        far={40}
        position={[2.6, 2, 4.2]}
      />

      <Environment resolution={256} environmentIntensity={0.5}>
        <Lightformer
          form="rect"
          intensity={3}
          scale={[8, 4]}
          position={[0, 5, -3]}
          color="#dce9ff"
        />
      </Environment>

      {/* standard-scene-setup: key + fill + rim */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 3]} intensity={2.2} castShadow />
      <directionalLight position={[-4, 2, -2]} intensity={0.5} color="#8fb4ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#14171f" roughness={0.95} />
      </mesh>

      <Product onFirstPointer={handleFirstPointer} />
      <GestureHint input={input} />
    </>
  );
}
