"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  extend,
  useFrame,
  useThree,
  type ThreeElement,
} from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const meta: ShowcaseMeta = {
  title: "표류하는 별먼지 필드",
  category: "immersive-background",
  usedSkills: [
    "standard-scene-setup",
    "fullscreen-shader-plane",
    "points-particle-field",
  ],
  description:
    "포인트 셰이더로 그린 12,000개의 별먼지. 깊이 방향으로 길게 뻗어 있어 카메라를 앞뒤로 움직이면 sizeAttenuation에 따라 가까운 입자는 커지고 먼 입자는 작아진다.",
};

/** 파티클 개수. 점 하나당 정점 하나뿐이라 이 정도는 드로우콜 1개로 감당된다. */
const PARTICLE_COUNT = 12_000;

/** 필드의 가로·세로 반경. 화면을 넓게 덮어야 배경처럼 보인다. */
const FIELD_RADIUS_XY = 9;
/**
 * 깊이 방향 범위. 크기 감쇠는 `scale / -mvPosition.z` 이므로
 * z가 넓게 퍼져 있어야 원근에 따른 크기 차이가 눈에 보인다.
 */
const FIELD_NEAR_Z = -2;
const FIELD_FAR_Z = -46;

/**
 * 기본 포인트 크기. **월드 단위 반경**이지 픽셀이 아니다.
 *
 * 셰이더에서 `uSize * (uScale / -mvPosition.z)` 로 픽셀로 환산되고
 * `uScale`이 이미 드로잉 버퍼 높이의 절반(수백 px)이므로, 이 값은 0.01~0.05
 * 수준이어야 한다. three `pointsMaterial`의 `size` prop과 같은 단위다.
 * 여기에 픽셀 값(9 같은)을 넣으면 점 하나가 화면을 덮어 흰 화면이 된다.
 */
const BASE_POINT_SIZE = 0.055;
/** 개별 파티클의 크기 편차 배율 범위. */
const SIZE_JITTER_MIN = 0.45;
const SIZE_JITTER_MAX = 1.6;

/** 표류 속도. 배경은 느릴수록 좋다. */
const DRIFT_SPEED = 0.35;
/** 감속 모드 배속. 완전히 멈추면 정적인 점 무리로만 보인다. */
const REDUCED_MOTION_SPEED = 0.03;

/** 별 색 팔레트. 차가운 흰빛과 따뜻한 호박빛을 섞어 단조로움을 피한다. */
const COOL_COLOR = new THREE.Color("#9fd0ff");
const WARM_COLOR = new THREE.Color("#ffd9a3");

/**
 * 포인트 전용 셰이더 머티리얼.
 *
 * 클래스 이름은 slug 기준으로 유일해야 한다. 다른 쇼케이스와 겹치면
 * 나중에 등록된 것이 앞의 것을 덮어써 A를 열었는데 B가 나온다.
 */
const StarfieldPointDriftMaterial = shaderMaterial(
  {
    uTime: 0,
    /**
     * 드로잉 버퍼 높이의 절반. three의 내장 points 셰이더가 쓰는
     * `scale` uniform과 같은 값이며, 이 값을 곱해야 화면 해상도가
     * 바뀌어도 점의 겉보기 크기가 유지된다.
     */
    uScale: 300,
    uSize: BASE_POINT_SIZE,
  },
  /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform float uScale;
    uniform float uSize;

    // per-particle 어트리뷰트. attach="attributes-xxx" 로 붙인 이름과 같아야 한다.
    attribute float aSize;
    attribute float aPhase;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vFade;

    void main() {
      vColor = aColor;

      // 위치 애니메이션을 GPU에서 한다.
      // CPU에서 Float32Array를 갱신하면 매 프레임 12,000개 * 3 float을
      // 다시 업로드해야 하지만, 여기서는 uTime uniform 하나만 바뀐다.
      vec3 animated = position;
      animated.x += sin(uTime * 0.6 + aPhase) * 0.35;
      animated.y += cos(uTime * 0.4 + aPhase * 1.7) * 0.28;

      vec4 mvPosition = modelViewMatrix * vec4(animated, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // 크기 감쇠(sizeAttenuation)의 정체.
      // 원근 투영에서 화면상 크기는 카메라 거리에 반비례하므로
      // 뷰 공간 깊이(-mvPosition.z)로 나눈다. 이 줄을 빼면
      // 모든 점이 거리와 무관하게 같은 픽셀 크기로 그려진다.
      //
      // clamp의 상한은 기기별 gl_PointSize 상한(낮은 기기는 64 근처) 대비이자,
      // 카메라를 파티클 안으로 밀어넣었을 때 점 하나가 화면을 덮어
      // 가산 합성이 순백으로 포화되는 것을 막는 안전장치다.
      // 하한 1.0은 1px 미만에서 점이 깜빡이며 사라지는 것을 막는다.
      gl_PointSize = clamp(
        uSize * aSize * (uScale / -mvPosition.z),
        1.0,
        48.0
      );

      // 아주 먼 입자는 옅게 만들어 깊이감을 강조한다.
      vFade = smoothstep(50.0, 6.0, -mvPosition.z);
    }
  `,
  /* glsl */ `
    precision highp float;

    varying vec3 vColor;
    varying float vFade;

    void main() {
      // gl_PointCoord는 점 내부의 0~1 좌표다.
      // 이 처리를 하지 않으면 점이 사각형 스프라이트 그대로 보인다.
      vec2 centered = gl_PointCoord - 0.5;
      float dist = length(centered);

      // 중심에서 가장자리로 갈수록 부드럽게 사라지는 원형 마스크.
      float mask = smoothstep(0.5, 0.08, dist);
      if (mask <= 0.001) discard;

      gl_FragColor = vec4(vColor, mask * vFade);
    }
  `,
);

// JSX 카탈로그 등록. 파일당 한 번만 호출한다.
extend({ StarfieldPointDriftMaterial });

// R3F v9 타입 선언. 구버전 JSX.IntrinsicElements 방식은 폐기됐다.
declare module "@react-three/fiber" {
  interface ThreeElements {
    starfieldPointDriftMaterial: ThreeElement<
      typeof StarfieldPointDriftMaterial
    >;
  }
}

/** 파티클 어트리뷰트 4종을 한 번에 만든다. */
interface ParticleBuffers {
  positions: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  colors: Float32Array;
}

/**
 * 파티클 버퍼를 생성한다.
 *
 * 순수 함수로 빼두면 Scene 본문이 배치 로직에 가려지지 않고,
 * 개수를 바꿔가며 성능을 재기도 쉽다.
 */
function createParticleBuffers(count: number): ParticleBuffers {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    // 원판 형태로 흩뿌린다. sqrt를 취해야 중심에 몰리지 않고 고르게 퍼진다.
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * FIELD_RADIUS_XY;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius * 0.7;
    // 깊이는 균등 분포로 길게 늘여 원근 감쇠가 드러나게 한다.
    positions[i * 3 + 2] =
      FIELD_NEAR_Z + Math.random() * (FIELD_FAR_Z - FIELD_NEAR_Z);

    sizes[i] = SIZE_JITTER_MIN + Math.random() * (SIZE_JITTER_MAX - SIZE_JITTER_MIN);
    phases[i] = Math.random() * Math.PI * 2;

    color.copy(COOL_COLOR).lerp(WARM_COLOR, Math.random() ** 2);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return { positions, sizes, phases, colors };
}

export function Scene() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const reducedMotion = useReducedMotion();

  // 드로잉 버퍼 높이를 알아야 해상도와 무관한 점 크기를 낼 수 있다.
  const height = useThree((state) => state.size.height);
  const dpr = useThree((state) => state.viewport.dpr);

  // 버퍼 생성은 12,000회 루프다. 매 렌더 돌면 안 되므로 한 번만 만든다.
  const buffers = useMemo(() => createParticleBuffers(PARTICLE_COUNT), []);

  useFrame((_, delta) => {
    const material = materialRef.current;
    // 첫 프레임에는 ref가 비어 있을 수 있다.
    if (!material) return;

    elapsed.current +=
      delta * (reducedMotion ? REDUCED_MOTION_SPEED : DRIFT_SPEED);
    material.uniforms.uTime.value = elapsed.current;

    // three 내장 points 셰이더와 같은 정의(드로잉 버퍼 높이의 절반).
    material.uniforms.uScale.value = (height * dpr) / 2;
  });

  return (
    <>
      {/* 별먼지는 스스로 빛나므로 조명이 필요 없다. 배경만 어둡게 깐다. */}
      <color attach="background" args={["#05060d"]} />

      <points
        // 파티클이 매 프레임 셰이더에서 움직여 CPU 쪽 바운딩이 실제와 어긋난다.
        // 컬링을 끄지 않으면 카메라를 돌릴 때 군집이 통째로 사라질 수 있다.
        frustumCulled={false}
        // 배경이므로 레이캐스트에서 제외해 앞쪽 오브젝트의 이벤트를 가로채지 않는다.
        raycast={() => null}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[buffers.positions, 3]}
          />
          <bufferAttribute attach="attributes-aSize" args={[buffers.sizes, 1]} />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[buffers.phases, 1]}
          />
          <bufferAttribute attach="attributes-aColor" args={[buffers.colors, 3]} />
        </bufferGeometry>

        <starfieldPointDriftMaterial
          key={StarfieldPointDriftMaterial.key}
          ref={materialRef}
          // 알파 마스크를 쓰므로 반드시 투명 머티리얼이어야 한다.
          transparent
          // 깊이 버퍼에 쓰면 뒤쪽 파티클이 앞쪽 파티클의 투명 영역에 가려
          // 검은 사각형처럼 잘려 보인다. 파티클 필드에서는 거의 항상 끈다.
          depthWrite={false}
          // 겹칠수록 밝아지는 가산 합성. 별·불티 같은 발광 룩을 만든다.
          blending={THREE.AdditiveBlending}
          // 셰이더가 낸 색을 그대로 보여준다. ACESFilmic 톤매핑을 여기서만 끈다.
          toneMapped={false}
        />
      </points>
    </>
  );
}
