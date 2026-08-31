"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "발광 랜턴 블룸",
  category: "transition-effect",
  usedSkills: ["standard-scene-setup", "camera-rig", "bloom-postprocessing"],
  description:
    "EffectComposer + Bloom으로 밝은 영역만 번지게 한다. 왼쪽 세 구는 임계값을 넘는 HDR 색이라 빛이 새어나오고, 오른쪽 세 구는 같은 색이지만 밝기가 1 이하라 선명하게 남는다. 블룸이 걸리는 기준이 '색'이 아니라 '밝기'임을 한 화면에서 대조한다.",
};

/** 블룸이 걸리는 밝기 임계값. 이 값을 넘는 픽셀만 번진다. */
const LUMINANCE_THRESHOLD = 1;
/** 임계값 경계의 부드러움. 0이면 딱 잘려 계단이 보인다. */
const LUMINANCE_SMOOTHING = 0.2;
/** 블룸 강도. 1.5를 넘으면 하이라이트가 흰 덩어리로 뭉친다. */
const BLOOM_INTENSITY = 1.15;
/** mipmap 블러의 확산 반경. 0.4~0.9 밖은 티가 안 나거나 화면이 흐려진다. */
const BLOOM_RADIUS = 0.75;

/** 발광 구의 기본 색조. 곱셈 계수로 1.0을 넘겨 HDR 영역으로 밀어 올린다. */
const EMISSIVE_HUES = ["#ff5d3b", "#3bd7ff", "#b46bff"] as const;
/** 발광 구가 임계값을 넘도록 색에 곱하는 계수. 1 이하면 블룸이 전혀 걸리지 않는다. */
const HDR_GAIN = 3.4;

/** 대조군(비발광) 구의 재질 색. 발광군과 같은 색조지만 밝기는 1 이하다. */
const MATTE_HUES = ["#ff5d3b", "#3bd7ff", "#b46bff"] as const;

/** 구 한 쌍의 z 간격. 발광군(-)과 대조군(+)을 좌우로 갈라 놓는다. */
const COLUMN_X = 1.9;
/** 구 사이 세로 간격 */
const ROW_GAP = 1.35;
/** 구 반지름 */
const SPHERE_RADIUS = 0.42;

/** 부유 애니메이션의 진폭과 속도. 블룸이 움직이는 대상에도 붙는지 보여준다. */
const FLOAT_AMPLITUDE = 0.16;
const FLOAT_SPEED = 1.1;

/**
 * 색 문자열에 계수를 곱해 1.0을 넘는 HDR 색을 만든다.
 *
 * `<meshBasicMaterial color="#ff5d3b">`는 아무리 밝아 보여도 채널 최대값이
 * 1.0이라 luminanceThreshold=1을 넘지 못한다. 블룸을 걸려면 채널 값 자체를
 * 1 위로 올려야 한다 — 이 함수가 그 곱셈을 담당한다.
 */
function toHdrColor(hex: string, gain: number): THREE.Color {
  return new THREE.Color(hex).multiplyScalar(gain);
}

interface FloatingSphereProps {
  position: [number, number, number];
  /** 부유 위상. 구마다 달라야 나란히 오르내리지 않는다. */
  phase: number;
  children: React.ReactNode;
}

/**
 * 위아래로 천천히 부유하는 구 하나.
 *
 * 머티리얼은 children으로 받는다. 발광군과 대조군이 위치·움직임은 같고
 * 재질만 다르므로, 그 차이만 호출부에 남기는 편이 대조를 읽기 쉽다.
 */
function FloatingSphere({ position, phase, children }: FloatingSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = state.clock.elapsedTime;
    mesh.position.y =
      position[1] + Math.sin(elapsed * FLOAT_SPEED + phase) * FLOAT_AMPLITUDE;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[SPHERE_RADIUS, 48, 32]} />
      {children}
    </mesh>
  );
}

/**
 * 왼쪽 열 — 블룸이 걸리는 발광 구.
 *
 * `meshBasicMaterial`은 조명을 받지 않고 지정한 색을 그대로 낸다. 여기에
 * 1을 넘는 색을 주면 화면 밝기 자체가 임계값을 넘어 블룸의 대상이 된다.
 * 밝기를 1 위로 올리는 것이 블룸의 유일한 전제 조건이다 — 색이 아무리
 * 선명해도 채널 최대값이 1이면 임계값을 넘지 못한다.
 */
function EmissiveColumn() {
  // THREE.Color 인스턴스는 렌더마다 새로 만들 필요가 없다.
  const hdrColors = useMemo(
    () => EMISSIVE_HUES.map((hue) => toHdrColor(hue, HDR_GAIN)),
    [],
  );

  return (
    <>
      {hdrColors.map((color, index) => (
        <FloatingSphere
          key={EMISSIVE_HUES[index]}
          position={[-COLUMN_X, (1 - index) * ROW_GAP, 0]}
          phase={index * 1.7}
        >
          {/*
            toneMapped={false}는 이 머티리얼만 ACESFilmic 톤매핑을 건너뛰게 한다.

            실측 주의: 이 씬에서는 이 prop을 빼도 결과가 거의 같다.
            <EffectComposer>가 마운트되면서 gl.toneMapping을 NoToneMapping으로
            강제하기 때문에(EffectComposer.tsx의 toneMappingGuard), 렌더러
            레벨 톤매핑이 이미 꺼져 있어서다.

            그래도 명시적으로 남긴다. 컴포저를 잠시 걷어내거나 <ToneMapping>
            효과를 체인에 넣는 순간 이 prop의 유무가 결과를 가르고, 그때
            "왜 갑자기 안 빛나지"를 다시 추적하게 되기 때문이다.
          */}
          <meshBasicMaterial color={color} toneMapped={false} />
        </FloatingSphere>
      ))}
    </>
  );
}

/**
 * 오른쪽 열 — 블룸이 걸리지 않는 대조 구.
 *
 * 색조는 왼쪽과 같지만 PBR 표면이라 조명을 받아도 반사 밝기가 1을 넘지
 * 않는다. 같은 EffectComposer 아래 있는데 번지지 않는다는 사실이
 * "블룸의 기준은 색이 아니라 밝기"를 증명한다.
 */
function MatteColumn() {
  return (
    <>
      {MATTE_HUES.map((hue, index) => (
        <FloatingSphere
          key={`matte-${hue}`}
          position={[COLUMN_X, (1 - index) * ROW_GAP, 0]}
          phase={index * 1.7 + 0.85}
        >
          <meshStandardMaterial color={hue} roughness={0.45} metalness={0.15} />
        </FloatingSphere>
      ))}
    </>
  );
}

export function Scene() {
  return (
    <>
      {/*
        두 열(폭 약 4.2유닛)과 세 행(높이 약 3유닛)을 한 화면에 담는 구도.
        far/near = 40/0.5 = 80 이라 depth 정밀도는 여유롭다.
      */}
      <PerspectiveCamera
        makeDefault
        fov={42}
        near={0.5}
        far={40}
        position={[0, 0.4, 7.4]}
      />

      {/*
        발광군은 조명을 안 받지만(meshBasicMaterial) 대조군은 받는다.
        대조군이 어두우면 "블룸이 안 걸린 것"인지 "그냥 어두운 것"인지
        구분되지 않으므로, 대조군은 충분히 밝되 1을 넘지 않게 조명한다.
      */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#8fb4ff" />

      {/* 어두운 배경이라야 번짐이 눈에 보인다. 밝은 배경에서는 블룸이 묻힌다. */}
      <color attach="background" args={["#07080d"]} />

      <EmissiveColumn />
      <MatteColumn />

      {/*
        EffectComposer는 씬 렌더를 가로채 후처리 체인으로 바꾼다.
        Scene이 반환하는 캔버스 자식이므로 여기서 렌더해도 계약 위반이 아니다
        (<Canvas>를 만들지 않는다).

        multisampling={0}: 이 씬에는 대비가 강한 사선 에지가 없고,
        MSAA는 후처리 체인에서 비용이 크다. 계단이 거슬리면 4로 올린다.
      */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={BLOOM_INTENSITY}
          luminanceThreshold={LUMINANCE_THRESHOLD}
          luminanceSmoothing={LUMINANCE_SMOOTHING}
          mipmapBlur
          radius={BLOOM_RADIUS}
        />
      </EffectComposer>
    </>
  );
}
