"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  createPortal,
  extend,
  useFrame,
  useThree,
  type ThreeElement,
} from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export const meta: ShowcaseMeta = {
  title: "GPGPU 유동 군집",
  category: "interactive-art",
  usedSkills: [
    "standard-scene-setup",
    "points-particle-field",
    "gpgpu-simulation",
  ],
  description:
    "65,536개 파티클의 위치와 속도를 부동소수 텍스처에 담고, FBO 핑퐁으로 매 프레임 GPU에서 물리를 갱신한다. 포인터를 따라 끌려오며 흐르지만 CPU는 uniform 몇 개만 쓴다.",
};

/**
 * 시뮬레이션 텍스처 한 변의 크기.
 *
 * 파티클 N개 = 텍스처 SIM_SIZE x SIM_SIZE 픽셀이므로 N은 항상 제곱수다.
 * 256이면 65,536개. 이 값을 키우면 파티클이 제곱으로 늘어난다.
 */
const SIM_SIZE = 256;

/** 초기 배치 구름의 반경. */
const SPAWN_RADIUS = 5.5;

/** 포인터가 놓이는 z 평면. 파티클 구름의 중심과 맞춘다. */
const POINTER_PLANE_Z = 0;

/** 포인터 인력의 세기(가까울수록 강함). */
const ATTRACTION_STRENGTH = 9;
/** 너무 가까우면 밀어내는 척력의 반경. 이게 없으면 한 점으로 뭉친다. */
const REPULSION_RADIUS = 1.1;
/** 원래 자리로 되돌리는 복원력. 군집이 무한히 흩어지지 않게 한다. */
const HOME_STRENGTH = 0.55;
/** 속도 감쇠 계수(초당). 1에 가까울수록 오래 미끄러진다. */
const DAMPING = 1.6;

/** delta 상한. 탭 복귀 시 수 초짜리 delta가 들어오면 시뮬레이션이 폭발한다. */
const MAX_DELTA = 1 / 30;

/** 감속 모드 배속. 완전히 멈추면 GPGPU라는 사실이 보이지 않는다. */
const REDUCED_MOTION_SCALE = 0.15;

/**
 * 포인트 크기. **월드 단위 반경**이지 픽셀이 아니다.
 *
 * 셰이더에서 `uSize * (uScale / -mvPosition.z)` 로 픽셀로 환산되고
 * `uScale`이 드로잉 버퍼 높이의 절반(수백 px)이므로 0.01~0.05 수준이어야 한다.
 * 여기에 픽셀 값을 넣으면 점 하나가 화면을 덮어 흰 화면이 된다.
 */
const BASE_POINT_SIZE = 0.02;
const SLOW_COLOR = new THREE.Color("#2b6cff");
const FAST_COLOR = new THREE.Color("#ffd28a");

/**
 * 시뮬레이션 패스가 그리는 전용 카메라.
 *
 * 화면이 아니라 렌더 타깃 전체(가로세로 -1~1)를 정확히 덮는 정사영 카메라다.
 * 시뮬레이션은 "픽셀 하나 = 파티클 하나"의 1:1 대응이 깨지면 안 되므로
 * 원근 투영을 쓰지 않는다.
 */
const SIM_CAMERA = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/**
 * 위치 갱신 패스.
 *
 * 이전 위치 텍스처와 이전 속도 텍스처를 읽어 다음 위치를 낸다.
 * 결과는 화면이 아니라 렌더 타깃에 RGBA 부동소수로 기록된다.
 */
const GpgpuFlowPositionMaterial = shaderMaterial(
  {
    uPositions: null,
    uVelocities: null,
    uDelta: 0,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    precision highp float;

    uniform sampler2D uPositions;
    uniform sampler2D uVelocities;
    uniform float uDelta;

    varying vec2 vUv;

    void main() {
      // 이 프래그먼트의 UV가 곧 "몇 번 파티클인가"다.
      vec4 position = texture2D(uPositions, vUv);
      vec3 velocity = texture2D(uVelocities, vUv).xyz;

      // 오일러 적분. delta를 곱해야 기기 프레임률과 무관해진다.
      position.xyz += velocity * uDelta;

      gl_FragColor = position;
    }
  `,
);

/**
 * 속도 갱신 패스.
 *
 * 힘(포인터 인력/척력 + 복원력)을 적분해 다음 속도를 낸다.
 * a 채널에 파티클의 고유 시드를 실어 두면 개별 편차를 줄 수 있다.
 */
const GpgpuFlowVelocityMaterial = shaderMaterial(
  {
    uPositions: null,
    uVelocities: null,
    uOrigins: null,
    uPointer: new THREE.Vector3(),
    uPointerActive: 0,
    uDelta: 0,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    precision highp float;

    uniform sampler2D uPositions;
    uniform sampler2D uVelocities;
    uniform sampler2D uOrigins;
    uniform vec3 uPointer;
    uniform float uPointerActive;
    uniform float uDelta;

    varying vec2 vUv;

    void main() {
      vec3 position = texture2D(uPositions, vUv).xyz;
      vec3 velocity = texture2D(uVelocities, vUv).xyz;
      vec4 origin = texture2D(uOrigins, vUv);

      vec3 force = vec3(0.0);

      // 1) 포인터 인력 — 거리에 반비례. 너무 가까우면 부호를 뒤집어 밀어낸다.
      vec3 toPointer = uPointer - position;
      float distance = max(length(toPointer), 0.0001);
      vec3 direction = toPointer / distance;
      float pull = ${ATTRACTION_STRENGTH.toFixed(1)} / (1.0 + distance * distance);
      float push = smoothstep(${REPULSION_RADIUS.toFixed(2)}, 0.0, distance) * 14.0;
      force += direction * (pull - push) * uPointerActive;

      // 2) 복원력 — 원래 자리로 당긴다. 없으면 군집이 영원히 흩어진다.
      //    origin.w는 파티클마다 다른 시드라 복원 세기에 편차를 준다.
      force += (origin.xyz - position) * ${HOME_STRENGTH.toFixed(2)} * (0.6 + origin.w * 0.8);

      velocity += force * uDelta;

      // 3) 감쇠 — 지수 감쇠라 프레임률과 무관하다.
      velocity *= exp(-${DAMPING.toFixed(2)} * uDelta);

      gl_FragColor = vec4(velocity, origin.w);
    }
  `,
);

/**
 * 렌더 패스용 포인트 머티리얼.
 *
 * vertex 셰이더가 `aReference` UV로 위치 텍스처를 읽는다.
 * 어트리뷰트 position은 쓰지 않고 자리만 차지한다.
 */
const GpgpuFlowRenderMaterial = shaderMaterial(
  {
    uPositions: null,
    uVelocities: null,
    uScale: 300,
    uSize: BASE_POINT_SIZE,
    uSlowColor: SLOW_COLOR.clone(),
    uFastColor: FAST_COLOR.clone(),
  },
  /* glsl */ `
    precision highp float;

    uniform sampler2D uPositions;
    uniform sampler2D uVelocities;
    uniform float uScale;
    uniform float uSize;

    // 각 파티클이 시뮬레이션 텍스처의 어느 픽셀인지 가리키는 UV.
    attribute vec2 aReference;

    varying float vSpeed;

    void main() {
      // GPGPU의 핵심 한 줄 — 위치를 CPU 배열이 아니라 텍스처에서 읽는다.
      vec3 simulated = texture2D(uPositions, aReference).xyz;
      vSpeed = length(texture2D(uVelocities, aReference).xyz);

      vec4 mvPosition = modelViewMatrix * vec4(simulated, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // 크기 감쇠는 points-particle-field 소관. 여기서는 같은 공식을 쓴다.
      // clamp는 기기별 gl_PointSize 상한과, 카메라를 군집 안으로 밀어넣었을 때
      // 가산 합성이 순백으로 포화되는 것을 막는 안전장치다.
      gl_PointSize = clamp(uSize * (uScale / -mvPosition.z), 1.0, 32.0);
    }
  `,
  /* glsl */ `
    precision highp float;

    uniform vec3 uSlowColor;
    uniform vec3 uFastColor;

    varying float vSpeed;

    void main() {
      vec2 centered = gl_PointCoord - 0.5;
      float mask = smoothstep(0.5, 0.05, length(centered));
      if (mask <= 0.001) discard;

      // 빠른 입자를 밝게 물들여 유동이 눈에 보이게 한다.
      vec3 color = mix(uSlowColor, uFastColor, clamp(vSpeed * 0.22, 0.0, 1.0));
      gl_FragColor = vec4(color, mask * 0.85);
    }
  `,
);

extend({
  GpgpuFlowPositionMaterial,
  GpgpuFlowVelocityMaterial,
  GpgpuFlowRenderMaterial,
});

declare module "@react-three/fiber" {
  interface ThreeElements {
    gpgpuFlowPositionMaterial: ThreeElement<typeof GpgpuFlowPositionMaterial>;
    gpgpuFlowVelocityMaterial: ThreeElement<typeof GpgpuFlowVelocityMaterial>;
    gpgpuFlowRenderMaterial: ThreeElement<typeof GpgpuFlowRenderMaterial>;
  }
}

/** 렌더 타깃 한 쌍. 읽는 쪽과 쓰는 쪽을 매 스텝 교대한다. */
interface PingPongTargets {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
}

/**
 * 부동소수 렌더 타깃 하나를 만든다.
 *
 * 필터는 반드시 NearestFilter다. 선형 보간이 걸리면 이웃 파티클의 상태가
 * 섞여 위치가 뭉개진다.
 */
function createSimulationTarget(size: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(size, size, {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

/**
 * 초기 상태 텍스처를 만든다.
 *
 * RGB에 위치, A에 파티클 고유 시드를 담는다. FloatType 이므로
 * 값의 범위 제한이 없어 월드 좌표를 그대로 실을 수 있다.
 */
function createOriginTexture(size: number): THREE.DataTexture {
  const data = new Float32Array(size * size * 4);

  for (let i = 0; i < size * size; i += 1) {
    // 구 껍질이 아니라 부피 안에 고르게 뿌린다(세제곱근 보정).
    const radius = Math.cbrt(Math.random()) * SPAWN_RADIUS;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    data[i * 4] = radius * Math.sin(phi) * Math.cos(theta);
    data[i * 4 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
    data[i * 4 + 2] = radius * Math.cos(phi);
    data[i * 4 + 3] = Math.random();
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

/** 파티클마다 자기 픽셀을 가리키는 UV와, 자리만 차지하는 position 어트리뷰트. */
function createReferenceAttributes(size: number): {
  references: Float32Array;
  positions: Float32Array;
} {
  const count = size * size;
  const references = new Float32Array(count * 2);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    // 픽셀 중심을 가리켜야 한다. +0.5를 빼면 경계에서 이웃 픽셀을 읽을 수 있다.
    references[i * 2] = ((i % size) + 0.5) / size;
    references[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size;
  }

  return { references, positions };
}

/**
 * 시뮬레이션 패스가 그릴 풀스크린 삼각형/사각형 지오메트리.
 *
 * 렌더 타깃 전체를 정확히 덮어 픽셀마다 프래그먼트 셰이더가 한 번 돌게 한다.
 */
function createSimulationQuad(): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(2, 2);
}

export function Scene() {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);
  const reducedMotion = useReducedMotion();

  const positionMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const velocityMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const renderMaterialRef = useRef<THREE.ShaderMaterial>(null);

  /** 포인터의 월드 좌표. useFrame 안에서만 쓰므로 ref로 든다. */
  const pointerWorld = useRef(new THREE.Vector3());
  const pointerActive = useRef(0);

  const { references, positions } = useMemo(
    () => createReferenceAttributes(SIM_SIZE),
    [],
  );

  const origins = useMemo(() => createOriginTexture(SIM_SIZE), []);
  const simulationQuad = useMemo(() => createSimulationQuad(), []);

  /**
   * 시뮬레이션 패스를 담을 별도 씬 두 개.
   *
   * 화면 씬과 섞이면 안 된다 — 이 씬들은 렌더 타깃에만 그려진다.
   */
  const positionScene = useMemo(() => new THREE.Scene(), []);
  const velocityScene = useMemo(() => new THREE.Scene(), []);

  /** 위치·속도 각각 렌더 타깃 2개씩. 같은 텍스처를 읽으며 쓸 수 없기 때문이다. */
  const positionTargets = useRef<PingPongTargets | null>(null);
  const velocityTargets = useRef<PingPongTargets | null>(null);

  if (positionTargets.current === null) {
    positionTargets.current = {
      read: createSimulationTarget(SIM_SIZE),
      write: createSimulationTarget(SIM_SIZE),
    };
  }
  if (velocityTargets.current === null) {
    velocityTargets.current = {
      read: createSimulationTarget(SIM_SIZE),
      write: createSimulationTarget(SIM_SIZE),
    };
  }

  /** 첫 프레임에 시드 텍스처를 렌더 타깃으로 복사했는지. */
  const seeded = useRef(false);

  // 렌더 타깃은 GC 대상이 아니다. 언마운트 시 직접 반납한다.
  useEffect(() => {
    const positionPair = positionTargets.current;
    const velocityPair = velocityTargets.current;

    return () => {
      positionPair?.read.dispose();
      positionPair?.write.dispose();
      velocityPair?.read.dispose();
      velocityPair?.write.dispose();
      origins.dispose();
      simulationQuad.dispose();
      seeded.current = false;
    };
  }, [origins, simulationQuad]);

  useFrame((state, rawDelta) => {
    const positionPair = positionTargets.current;
    const velocityPair = velocityTargets.current;
    const positionMaterial = positionMaterialRef.current;
    const velocityMaterial = velocityMaterialRef.current;
    const renderMaterial = renderMaterialRef.current;

    if (
      !positionPair ||
      !velocityPair ||
      !positionMaterial ||
      !velocityMaterial ||
      !renderMaterial
    ) {
      return;
    }

    const delta =
      Math.min(rawDelta, MAX_DELTA) *
      (reducedMotion ? REDUCED_MOTION_SCALE : 1);

    // 포인터(정규화 좌표)를 z=POINTER_PLANE_Z 평면의 월드 좌표로 되돌린다.
    pointerWorld.current
      .set(state.pointer.x, state.pointer.y, 0.5)
      .unproject(state.camera);
    pointerWorld.current
      .sub(state.camera.position)
      .normalize()
      .multiplyScalar(
        (POINTER_PLANE_Z - state.camera.position.z) /
          (pointerWorld.current.z || 1e-6),
      )
      .add(state.camera.position);

    // 포인터가 한 번이라도 움직였는지에 무관하게 인력을 켠다.
    // (배경 쇼케이스라 항상 켜두는 편이 거동이 잘 보인다)
    pointerActive.current = 1;

    // --- 시드 패스 ---
    // 첫 프레임에는 렌더 타깃이 비어 있다. 원점 텍스처를 위치 타깃에 복사한다.
    if (!seeded.current) {
      positionMaterial.uniforms.uPositions.value = origins;
      positionMaterial.uniforms.uVelocities.value = origins;
      positionMaterial.uniforms.uDelta.value = 0;

      for (const target of [positionPair.read, positionPair.write]) {
        gl.setRenderTarget(target);
        gl.render(positionScene, SIM_CAMERA);
      }
      // 속도는 0에서 시작한다. 렌더 타깃을 그냥 비우면 된다.
      for (const target of [velocityPair.read, velocityPair.write]) {
        gl.setRenderTarget(target);
        gl.clear();
      }
      gl.setRenderTarget(null);
      seeded.current = true;
    }

    // --- 1) 속도 패스 ---
    velocityMaterial.uniforms.uPositions.value = positionPair.read.texture;
    velocityMaterial.uniforms.uVelocities.value = velocityPair.read.texture;
    velocityMaterial.uniforms.uOrigins.value = origins;
    velocityMaterial.uniforms.uPointer.value.copy(pointerWorld.current);
    velocityMaterial.uniforms.uPointerActive.value = pointerActive.current;
    velocityMaterial.uniforms.uDelta.value = delta;

    gl.setRenderTarget(velocityPair.write);
    gl.render(velocityScene, SIM_CAMERA);

    // swap — 방금 쓴 쪽이 다음 스텝의 읽는 쪽이 된다.
    const nextVelocity = velocityPair.write;
    velocityPair.write = velocityPair.read;
    velocityPair.read = nextVelocity;

    // --- 2) 위치 패스 --- 갱신된 속도로 위치를 적분한다.
    positionMaterial.uniforms.uPositions.value = positionPair.read.texture;
    positionMaterial.uniforms.uVelocities.value = velocityPair.read.texture;
    positionMaterial.uniforms.uDelta.value = delta;

    gl.setRenderTarget(positionPair.write);
    gl.render(positionScene, SIM_CAMERA);

    const nextPosition = positionPair.write;
    positionPair.write = positionPair.read;
    positionPair.read = nextPosition;

    // 화면 렌더로 돌아간다. 이걸 빼면 R3F의 본 렌더가 타깃으로 들어가 화면이 빈다.
    gl.setRenderTarget(null);

    // --- 3) 결과를 파티클에 물린다 ---
    renderMaterial.uniforms.uPositions.value = positionPair.read.texture;
    renderMaterial.uniforms.uVelocities.value = velocityPair.read.texture;
    renderMaterial.uniforms.uScale.value = (size.height * dpr) / 2;
  });

  return (
    <>
      <color attach="background" args={["#05070f"]} />

      {/* 시뮬레이션 패스 — 별도 씬에 포털로 넣어 화면 씬을 오염시키지 않는다. */}
      {createPortal(
        <mesh geometry={simulationQuad} frustumCulled={false}>
          <gpgpuFlowPositionMaterial
            key={GpgpuFlowPositionMaterial.key}
            ref={positionMaterialRef}
          />
        </mesh>,
        positionScene,
      )}
      {createPortal(
        <mesh geometry={simulationQuad} frustumCulled={false}>
          <gpgpuFlowVelocityMaterial
            key={GpgpuFlowVelocityMaterial.key}
            ref={velocityMaterialRef}
          />
        </mesh>,
        velocityScene,
      )}

      {/* 렌더 패스 — position 어트리뷰트는 자리만 차지하고 실제 위치는 텍스처에서 온다. */}
      <points frustumCulled={false} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute
            attach="attributes-aReference"
            args={[references, 2]}
          />
        </bufferGeometry>
        <gpgpuFlowRenderMaterial
          key={GpgpuFlowRenderMaterial.key}
          ref={renderMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </>
  );
}
