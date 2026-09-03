'use client';

export { meta } from './meta';

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, PerspectiveCamera } from '@react-three/drei';
import {
  Autofocus,
  Bloom,
  EffectComposer,
  ToneMapping,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { SceneReadout } from '@/components/scene-label';

/** Bloom은 프리셋과 무관하게 고정. 뒤쪽 발광 점이 보케로 커질 때 빛나게 한다. */
const BLOOM = {
  intensity: 0.9,
  luminanceThreshold: 1,
  luminanceSmoothing: 0.2,
  radius: 0.7,
} as const;

/** 발광 점의 HDR 색 — 채널 값이 1을 넘어야 Bloom 대상 (bloom-postprocessing 2절). */
const EMISSIVE_GAIN = 3;

/** DoF 파라미터. worldFocusRange는 월드 단위 — "focusDistance [0,1]"의 비직관성을 피한다. */
const BOKEH_SCALE = 4;
const WORLD_FOCUS_RANGE = 1.6;
/** <Autofocus> 자체 이징. target을 직접 lerp하므로 짧게 둬서 이중 완충을 줄인다. */
const SMOOTH_TIME = 0.1;

/** 제품 하나의 정의. z가 작을수록(음수) 카메라에서 멀다. */
interface Product {
  id: string;
  label: string;
  position: readonly [number, number, number];
  color: string;
  geometry: 'box' | 'sphere' | 'cone';
}

const PRODUCTS: readonly Product[] = [
  {
    id: 'front',
    label: '앞 (근거리)',
    position: [-1.4, 0, 2.2],
    color: '#d8623f',
    geometry: 'box',
  },
  {
    id: 'mid',
    label: '중간',
    position: [0.1, 0, 0],
    color: '#3f8fd8',
    geometry: 'sphere',
  },
  {
    id: 'back',
    label: '뒤 (원거리)',
    position: [1.5, 0, -2.4],
    color: '#3fae5a',
    geometry: 'cone',
  },
] as const;

/** 뒤쪽 발광 점의 위치 — 초점이 안 맞을수록 큰 보케로 커진다. */
const BOKEH_LIGHTS: readonly [number, number, number][] = [
  [-2.6, 1.4, -4],
  [-0.8, 2, -4.6],
  [1.2, 1.1, -4.2],
  [2.8, 1.8, -5],
] as const;

interface ProductMeshProps {
  product: Product;
}

/** 제품 하나. 지오메트리 종류만 다르고 재질·크기는 같다. */
function ProductMesh({ product }: ProductMeshProps) {
  return (
    <mesh position={product.position} castShadow>
      {product.geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {product.geometry === 'sphere' && (
        <sphereGeometry args={[0.62, 40, 24]} />
      )}
      {product.geometry === 'cone' && <coneGeometry args={[0.62, 1.2, 32]} />}
      <meshStandardMaterial
        color={product.color}
        roughness={0.4}
        metalness={0.15}
      />
    </mesh>
  );
}

/** 뒤쪽 발광 점들 — Bloom이 걸리는 유일한 대상. DoF가 이걸 큰 보케로 만든다. */
function BokehLights() {
  const color = useMemo(
    () => new THREE.Color('#ffd9a8').multiplyScalar(EMISSIVE_GAIN),
    [],
  );

  return (
    <>
      {BOKEH_LIGHTS.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();
  const [focusIndex, setFocusIndex] = useState(1);
  const [mouseMode, setMouseMode] = useState(false);
  const [debug, setDebug] = useState(false);

  /**
   * 현재 초점 대상 위치. useFrame에서 선택 제품 위치로 수렴시키고, 같은
   * Vector3 인스턴스를 <Autofocus target>에 넘긴다. setState로 들면 초당 60회
   * 리렌더 (click-focus-camera와 같은 계열).
   *
   * useMemo로 만드는 것이 핵심 — useRef.current를 render 중 JSX prop으로 넘기면
   * react-hooks/refs가 막는다. useMemo 반환값은 render 산출물이라 넘겨도 된다.
   */
  const focusTarget = useMemo(
    () => new THREE.Vector3(...PRODUCTS[1].position),
    [],
  );
  /** lerp 목적지 — 매 프레임 새 Vector3를 만들지 않으려고 재사용한다. */
  const destVec = useMemo(() => new THREE.Vector3(), []);
  const rigRef = useRef<THREE.Group>(null);

  const buttonStyle = useMemo<CSSProperties>(
    () => ({
      padding: '5px 10px',
      borderRadius: 6,
      // border shorthand 대신 분리 속성 — active 스타일이 borderColor만 덮어써도
      // shorthand/non-shorthand 충돌 경고가 안 난다.
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: 'rgba(138, 180, 255, 0.4)',
      background: 'rgba(15, 20, 30, 0.9)',
      color: '#e8edf5',
      fontSize: 12,
      cursor: 'pointer',
      userSelect: 'none',
    }),
    [],
  );

  const activeButtonStyle = useMemo<CSSProperties>(
    () => ({
      ...buttonStyle,
      background: 'rgba(90, 130, 220, 0.9)',
      borderColor: 'rgba(180, 205, 255, 0.8)',
    }),
    [buttonStyle],
  );

  const getReadout = useCallback(() => {
    const mode = mouseMode
      ? '마우스 초점'
      : `고정 초점 · ${PRODUCTS[focusIndex].label}`;
    return (
      `${mode}\n` +
      `bokehScale ${BOKEH_SCALE} · worldFocusRange ${WORLD_FOCUS_RANGE}`
    );
  }, [mouseMode, focusIndex]);

  useFrame((state, delta) => {
    const rig = rigRef.current;
    if (rig && !reducedMotion) {
      // 진열대를 아주 느리게 좌우로 스윙 — 심도를 여러 각도에서 보여준다.
      rig.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.18;
    }

    // 마우스 모드면 <Autofocus>가 depth picking으로 직접 초점을 잡는다.
    if (mouseMode) return;

    // 고정 초점 — 선택 제품 위치로 프레임률 독립 지수 감쇠 lerp.
    const dest = PRODUCTS[focusIndex].position;
    destVec.set(dest[0], dest[1], dest[2]);
    const t = reducedMotion ? 1 : 1 - Math.exp(-7 * delta);
    focusTarget.lerp(destVec, t);
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={40}
        near={0.5}
        far={40}
        position={[0, 1.1, 7.5]}
      />

      {/* 어두운 배경 — Bloom이 보이는 전제 (bloom-postprocessing 5절). */}
      <color attach="background" args={['#0b0c11']} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={2} castShadow />
      <directionalLight
        position={[-5, 3, -2]}
        intensity={0.45}
        color="#9fb8ff"
      />

      {/* 바닥 — mouse 모드가 빈 공간을 가리켜도 표면이 잡히게. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.65, -1]}
        receiveShadow
      >
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#6b7079" roughness={0.95} />
      </mesh>
      {/* 배경 벽 — 같은 이유. mouse가 far plane을 안 잡게. */}
      <mesh position={[0, 2, -7]}>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial color="#4a4f57" roughness={1} />
      </mesh>

      <group ref={rigRef}>
        {PRODUCTS.map((product) => (
          <ProductMesh key={product.id} product={product} />
        ))}
        <BokehLights />
      </group>

      {/*
        계기판은 초점이 잘 맞는 z(제품들의 평균 위치 ≈ 0) 높은 곳에 둔다.
        씬 안 오브젝트라 DoF 대상이 되지만, 이 z면 대체로 선명하다.
      */}
      <SceneReadout
        getText={getReadout}
        backdrop={[5.2, 0.86]}
        position={[0, 2.4, 0]}
        fontSize={0.14}
        color="#cdd6f4"
        textAlign="center"
        lineHeight={1.5}
      />

      <Html
        position={[0, -1.7, 0]}
        center
        distanceFactor={9}
        zIndexRange={[120, 0]}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 320,
          }}
        >
          {PRODUCTS.map((product, index) => (
            <button
              key={product.id}
              type="button"
              style={
                !mouseMode && index === focusIndex
                  ? activeButtonStyle
                  : buttonStyle
              }
              onClick={() => {
                setMouseMode(false);
                setFocusIndex(index);
              }}
            >
              {product.label}
            </button>
          ))}
          <button
            type="button"
            style={mouseMode ? activeButtonStyle : buttonStyle}
            onClick={() => setMouseMode((value) => !value)}
          >
            {mouseMode ? '마우스 초점 끄기' : '마우스 초점'}
          </button>
          <button
            type="button"
            style={debug ? activeButtonStyle : buttonStyle}
            onClick={() => setDebug((value) => !value)}
          >
            {debug ? 'debug 끄기' : 'debug 구'}
          </button>
        </div>
      </Html>

      {/*
        <EffectComposer>는 정확히 1개. 체인 순서 규칙:
          1. Bloom — 원본 HDR 값을 봐야 하므로 맨 앞
          2. Autofocus(DoF) — HDR(1 초과)에서 블러해야 배경 발광 점이 큰
             밝은 원형 보케로 남는다. 톤매핑 뒤에 두면 눌린 값이라 회색 보케
          3. ToneMapping — HDR을 표시 범위로 (color-grading-lut 소관)

        target과 mouse는 배타 — target이 주어지면 mouse를 override한다.
        그래서 mouseMode일 때 target={undefined}.
      */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={BLOOM.intensity}
          luminanceThreshold={BLOOM.luminanceThreshold}
          luminanceSmoothing={BLOOM.luminanceSmoothing}
          mipmapBlur
          radius={BLOOM.radius}
        />
        <Autofocus
          target={mouseMode ? undefined : focusTarget}
          mouse={mouseMode}
          smoothTime={SMOOTH_TIME}
          debug={debug ? 0.04 : 0}
          bokehScale={BOKEH_SCALE}
          worldFocusRange={WORLD_FOCUS_RANGE}
        />
        <ToneMapping mode={ToneMappingMode.AGX} adaptive={false} />
      </EffectComposer>
    </>
  );
}
