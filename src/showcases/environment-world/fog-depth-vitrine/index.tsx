'use client';

export { meta } from './meta';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { SceneLabel, SceneReadout } from '@/components/scene-label';

/**
 * fog 색이자 배경색. **같은 상수를 <color attach="background">와 <fog>가 공유한다.**
 * 이 일치가 fog의 1번 규칙 — 다르면 원경이 다른 색 실루엣으로 남는다.
 */
const FOG_COLOR = '#9fb0c4';

/** THREE.Fog(선형)의 near / far. 카메라 far clip(60)보다 작아야 "절벽"이 안 된다. */
const FOG_NEAR = 9;
const FOG_FAR = 46;

/** THREE.FogExp2(지수)의 density. 35유닛쯤에서 절반 흐림 (2.3 / 35 ≈ 0.065). */
const FOG_DENSITY = 0.04;

/** 아치 개수와 z 간격. 뒤로 갈수록 fog에 묻힌다. */
const ARCH_COUNT = 12;
const ARCH_SPACING = 3.4;
/** 첫 아치의 z (카메라 앞). 이후 -z 방향으로 후퇴한다. */
const ARCH_START_Z = 2;

type FogMode = 'fog' | 'fogExp2';

/** 아치 하나의 위치. z가 작을수록(음수로 갈수록) 카메라에서 멀다. */
function archPosition(index: number): [number, number, number] {
  return [0, 0, ARCH_START_Z - index * ARCH_SPACING];
}

/** 원근으로 늘어선 아치 열. 뒤로 갈수록 fog 색으로 사라진다. */
function RecedingArchRow() {
  // 아치는 전부 같은 형태. 색만 앞뒤로 살짝 달리해 깊이를 읽기 쉽게.
  const arches = useMemo(
    () =>
      Array.from({ length: ARCH_COUNT }, (_, index) => {
        const depth = index / (ARCH_COUNT - 1);
        const color = new THREE.Color().setHSL(0.58, 0.25, 0.55 - depth * 0.1);
        return { index, position: archPosition(index), color };
      }),
    [],
  );

  return (
    <>
      {arches.map(({ index, position, color }) => (
        <group key={index} position={position}>
          {/* 좌 기둥 */}
          <mesh position={[-1.6, 1.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 2.8, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {/* 우 기둥 */}
          <mesh position={[1.6, 1.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 2.8, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {/* 상단 보 */}
          <mesh position={[0, 2.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 0.4, 0.4]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </>
  );
}

interface FogModeToggleProps {
  mode: FogMode;
  onToggle: () => void;
}

/**
 * 씬 안 3D 버튼 — 클릭하면 fog 모드를 토글한다.
 *
 * 셸은 <Canvas> 안 3D 노드만 렌더하므로 HTML 버튼을 못 쓴다. plane + troika
 * Text로 만들고 onClick으로 상태를 바꾼다. 커서 변경은 useEffect + cleanup으로
 * (onPointerOut에 맡기면 호버한 채 벗어났을 때 커서가 안 돌아온다).
 */
function FogModeToggle({ mode, onToggle }: FogModeToggleProps) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  return (
    // 카메라(z=10, y=2.2) 앞. 아치 열보다 앞이고 fog에 안 묻히는 거리.
    <group position={[0, 0.6, 5.5]}>
      <mesh
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[2.4, 0.5]} />
        <meshBasicMaterial
          color={hovered ? '#1c2740' : '#111a2e'}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
      <SceneLabel
        position={[0, 0, 0.01]}
        fontSize={0.16}
        color="#cdd6f4"
        anchorY="middle"
        outlineWidth={0}
      >
        {mode === 'fog' ? 'THREE.Fog  ⇄  FogExp2' : 'FogExp2  ⇄  THREE.Fog'}
      </SceneLabel>
    </group>
  );
}

interface FogReadoutProps {
  mode: FogMode;
}

/** 현재 fog 모드와 활성 파라미터를 표시하는 계기판 (ref 갱신, setState 아님). */
function FogReadout({ mode }: FogReadoutProps) {
  const getText = useCallback(
    () =>
      mode === 'fog'
        ? `THREE.Fog (선형)   near ${FOG_NEAR} · far ${FOG_FAR}\n` +
          `near까지 선명, far에서 완전히 안개 색`
        : `THREE.FogExp2 (지수)   density ${FOG_DENSITY}\n` +
          `카메라 근처도 살짝, 멀수록 급격히`,
    [mode],
  );

  return (
    // 카메라 앞 위쪽. fog에 안 묻히게 near clip 근처, 아치 열보다 앞.
    <SceneReadout
      getText={getText}
      backdrop={[4.6, 0.72]}
      position={[0, 3.4, 5.5]}
      fontSize={0.13}
      color="#cdd6f4"
      textAlign="center"
      lineHeight={1.5}
    />
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<FogMode>('fog');
  const rigRef = useRef<THREE.Group>(null);

  const toggleMode = useCallback(() => {
    // fog 종류 변경은 셰이더 재컴파일이라 한 프레임 끊긴다 — 사용자 액션에만.
    setMode((current) => (current === 'fog' ? 'fogExp2' : 'fog'));
  }, []);

  useFrame((state) => {
    const rig = rigRef.current;
    if (!rig || reducedMotion) return;
    // 좌우로 아주 느리게 스윙 — 아치 열을 여러 각도에서 보여준다.
    // 절대 시간 기반이라 프레임률과 무관하다.
    rig.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.28;
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 2.2, 10]}
        fov={50}
        near={0.5}
        far={60}
      />

      {/*
        fog의 1번 규칙 — 배경색과 fog 색이 같아야 원경이 배경으로 사라진다.
        같은 상수 FOG_COLOR를 공유한다.
      */}
      <color attach="background" args={[FOG_COLOR]} />
      {mode === 'fog' ? (
        <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
      ) : (
        <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
      )}

      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 14, 6]} intensity={1.4} castShadow />
      <directionalLight
        position={[-6, 4, -4]}
        intensity={0.35}
        color="#c8d6ff"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -18]}
        receiveShadow
      >
        <planeGeometry args={[60, 80]} />
        <meshStandardMaterial color="#6b7686" roughness={0.95} />
      </mesh>

      <group ref={rigRef}>
        <RecedingArchRow />
      </group>

      <FogModeToggle mode={mode} onToggle={toggleMode} />
      <FogReadout mode={mode} />
    </>
  );
}
