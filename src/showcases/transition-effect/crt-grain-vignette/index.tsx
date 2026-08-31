"use client";

export { meta } from "./meta";

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import { BlendFunction, Effect } from 'postprocessing';

/** 주사선의 세로 밀도. 화면 높이에 몇 줄이 들어가는지. */
const SCANLINE_DENSITY = 520;
/** 주사선 대비. 0.25를 넘으면 화면이 지저분해진다. */
const SCANLINE_STRENGTH = 0.16;
/** 프레임마다 튀는 그레인 강도. 0.1을 넘으면 노이즈가 화면을 삼킨다. */
const GRAIN_STRENGTH = 0.055;
/** 비네트가 시작되는 반경. 낮을수록 어두운 테두리가 두꺼워진다. */
const VIGNETTE_OFFSET = 0.62;
/** 비네트 감쇠 강도 */
const VIGNETTE_DARKNESS = 0.85;
/** 화면 가장자리에서 R/B 채널이 벌어지는 최대 픽셀 비율 */
const ABERRATION_AMOUNT = 0.0032;
/** 화면 왜곡(배럴 디스토션) 계수. 0이면 평평하다. */
const BARREL_AMOUNT = 0.11;

/**
 * 커스텀 후처리 셰이더.
 *
 * 전체 프래그먼트 셰이더가 아니라 `mainImage` 함수 하나만 쓴다. postprocessing이
 * 이 함수를 EffectPass의 합성 셰이더 안으로 끌어넣고, 이름 충돌을 피하려고
 * 함수·uniform 이름 앞에 `e0` 같은 접두사를 자동으로 붙인다. 그래서 여기서
 * `main()`을 직접 선언하면 안 되고, `inputBuffer`/`resolution` 같은 내장
 * uniform은 선언 없이 그대로 쓸 수 있다.
 *
 * `inputColor`는 이미 이 픽셀의 색이므로, 왜곡 없이 색만 만질 때는 굳이
 * inputBuffer를 다시 샘플링할 필요가 없다. 여기서는 uv를 휘고 채널을
 * 어긋나게 하므로 직접 샘플링한다.
 */
const CRT_FRAGMENT_SHADER = /* glsl */ `
uniform float uScanlineDensity;
uniform float uScanlineStrength;
uniform float uGrainStrength;
uniform float uVignetteOffset;
uniform float uVignetteDarkness;
uniform float uAberration;
uniform float uBarrel;
uniform float uIntensity;

/** 해시 기반 의사난수. 픽셀 좌표와 시간을 섞어 매 프레임 다른 그레인을 만든다. */
float hashNoise(const in vec2 seed) {
  return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453123);
}

/**
 * 화면 중심을 기준으로 uv를 바깥으로 밀어 배럴 디스토션을 만든다.
 * 결과가 0~1 밖으로 나가면 화면 밖을 샘플링하게 되므로 호출부에서 처리한다.
 */
vec2 barrelDistort(const in vec2 uv, const in float amount) {
  vec2 centered = uv * 2.0 - 1.0;
  float r2 = dot(centered, centered);
  return (centered * (1.0 + amount * r2)) * 0.5 + 0.5;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // uIntensity가 0이면 원본을 그대로 통과시킨다. 효과 on/off 대조용이다.
  if (uIntensity <= 0.0) {
    outputColor = inputColor;
    return;
  }

  vec2 distortedUv = barrelDistort(uv, uBarrel * uIntensity);

  // 화면 밖으로 나간 픽셀은 샘플링하지 않고 검게 둔다.
  // clamp만 하면 가장자리 픽셀이 옆으로 길게 늘어나는 줄무늬가 생긴다.
  if (distortedUv.x < 0.0 || distortedUv.x > 1.0 ||
      distortedUv.y < 0.0 || distortedUv.y > 1.0) {
    outputColor = vec4(0.0, 0.0, 0.0, inputColor.a);
    return;
  }

  // 색수차 — 중심에서 멀수록 R/B 채널을 서로 반대로 밀어 벌린다.
  vec2 fromCenter = distortedUv - 0.5;
  vec2 shift = fromCenter * uAberration * uIntensity;

  // 채널을 어긋나게 샘플링하므로 clamp로 경계를 한 번 더 막는다.
  // 위 경계 검사를 통과했어도 shift가 다시 0~1 밖으로 밀어낼 수 있다.
  vec3 color = vec3(
    texture2D(inputBuffer, clamp(distortedUv + shift, 0.0, 1.0)).r,
    texture2D(inputBuffer, distortedUv).g,
    texture2D(inputBuffer, clamp(distortedUv - shift, 0.0, 1.0)).b
  );

  // 주사선 — uv.y가 아니라 실제 픽셀 높이를 기준으로 해야 리사이즈해도
  // 줄 간격이 일정하다. resolution은 EffectMaterial의 내장 uniform이다.
  float scanline = sin(distortedUv.y * uScanlineDensity) * 0.5 + 0.5;
  color *= 1.0 - scanline * uScanlineStrength * uIntensity;

  // 그레인 — time도 내장 uniform이고 EffectPass가 매 프레임 누적해준다.
  float grain = hashNoise(distortedUv * resolution + fract(time) * 100.0) - 0.5;
  color += grain * uGrainStrength * uIntensity;

  // 비네트 — 중심에서의 거리로 감쇠. smoothstep으로 경계를 부드럽게 한다.
  float dist = length(fromCenter) * 1.414;
  float vignette = smoothstep(1.0, uVignetteOffset, dist);
  color *= mix(1.0, vignette, uVignetteDarkness * uIntensity);

  outputColor = vec4(color, inputColor.a);
}
`;

/** CrtEffect 생성자가 받는 값. 생성 시점에만 쓰이고 이후에는 uniform으로 갱신한다. */
interface CrtEffectOptions {
  scanlineDensity: number;
  scanlineStrength: number;
  grainStrength: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  aberration: number;
  barrel: number;
}

/**
 * postprocessing의 `Effect`를 상속한 커스텀 패스.
 *
 * `super(name, fragmentShader, { uniforms, blendFunction })`가 전부다.
 * blendFunction 기본값은 NORMAL이라 결과가 원본과 알파 혼합된다. 이 효과는
 * 화면을 통째로 대체하므로 SRC를 명시한다.
 */
class CrtEffect extends Effect {
  constructor(options: CrtEffectOptions) {
    super('CrtEffect', CRT_FRAGMENT_SHADER, {
      // SRC = 이 효과의 출력이 곧 결과. NORMAL(기본값)이면 원본과 섞여
      // 왜곡·색수차가 절반만 적용된 것처럼 흐리게 보인다.
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, THREE.Uniform>([
        ['uScanlineDensity', new THREE.Uniform(options.scanlineDensity)],
        ['uScanlineStrength', new THREE.Uniform(options.scanlineStrength)],
        ['uGrainStrength', new THREE.Uniform(options.grainStrength)],
        ['uVignetteOffset', new THREE.Uniform(options.vignetteOffset)],
        ['uVignetteDarkness', new THREE.Uniform(options.vignetteDarkness)],
        ['uAberration', new THREE.Uniform(options.aberration)],
        ['uBarrel', new THREE.Uniform(options.barrel)],
        ['uIntensity', new THREE.Uniform(1)],
      ]),
    });
  }

  /**
   * 효과 전체 강도(0~1) uniform을 그대로 돌려준다.
   *
   * `set intensity(value)` 같은 접근자로 두지 않는 이유가 있다. React Compiler는
   * 훅이 돌려준 값(아래 `useMemo`의 반환값)을 렌더 이후에 변형하는 것을 막으므로
   * `effect.intensity = x`가 lint에서 걸린다. uniform 객체를 꺼내 그 `.value`를
   * 만지는 형태는 "훅 반환값 자체의 변형"이 아니라 통과한다
   * (troubleshooting 12-G와 같은 계열의 제약).
   *
   * 어느 쪽이든 인스턴스를 다시 만들지는 않는다 — 재생성하면 셰이더가 다시
   * 컴파일되고 EffectPass가 통째로 재구성되어 한 프레임 끊긴다.
   */
  getIntensityUniform(): THREE.Uniform<number> | undefined {
    const uniform = this.uniforms.get('uIntensity');
    return typeof uniform?.value === 'number' ? (uniform as THREE.Uniform<number>) : undefined;
  }
}

/** 효과 on/off 전이의 지수 감쇠 계수. 낮으면 늘어지고 높으면 즉각적이다. */
const TOGGLE_DAMP_RATE = 7;

interface CrtPassProps {
  /** true면 효과 강도를 1로, false면 0으로 부드럽게 보간한다. */
  enabled: boolean;
}

/**
 * 클래스 Effect를 R3F 노드로 감싸는 컴포넌트.
 *
 * `<EffectComposer>`는 자식 중 `Effect` 인스턴스를 골라 EffectPass로 묶으므로,
 * `<primitive object={effect} />`로 씬 그래프에 넣기만 하면 된다. 라이브러리의
 * 기성 효과(`<Bloom>` 등)도 내부적으로 같은 형태다.
 *
 * `useMemo` 의존성 배열이 비어 있는 것이 핵심이다. 여기에 값을 넣으면 그 값이
 * 바뀔 때마다 Effect가 새로 생성되어 셰이더가 재컴파일된다. 변하는 값은
 * 생성자가 아니라 uniform으로 넘긴다.
 */
function CrtPass({ enabled }: CrtPassProps) {
  // 의존성 배열이 비어 있다 — 이 인스턴스는 컴포넌트가 사는 동안 하나뿐이다.
  const effect = useMemo(
    () =>
      new CrtEffect({
        scanlineDensity: SCANLINE_DENSITY,
        scanlineStrength: SCANLINE_STRENGTH,
        grainStrength: GRAIN_STRENGTH,
        vignetteOffset: VIGNETTE_OFFSET,
        vignetteDarkness: VIGNETTE_DARKNESS,
        aberration: ABERRATION_AMOUNT,
        barrel: BARREL_AMOUNT,
      }),
    []
  );

  useFrame((_, delta) => {
    const intensity = effect.getIntensityUniform();
    if (!intensity) return;

    const target = enabled ? 1 : 0;
    // 프레임률과 무관한 지수 감쇠. delta를 곱해야 저프레임에서도 같은 속도다.
    const factor = 1 - Math.exp(-TOGGLE_DAMP_RATE * delta);
    intensity.value += (target - intensity.value) * factor;
  });

  return <primitive object={effect} dispose={null} />;
}

/** 씬 안에서 도는 큐브의 색과 위치. 후처리가 걸릴 대상일 뿐이다. */
const CUBE_COLORS = ['#ff7a45', '#4dd2ff', '#ffe066'] as const;
const CUBE_SPACING = 1.85;
const CUBE_SIZE = 0.9;

interface SpinningCubeProps {
  position: [number, number, number];
  color: string;
  /** 회전 위상. 큐브마다 달라야 나란히 돌지 않는다. */
  phase: number;
  onToggle: () => void;
}

/** 천천히 회전하는 큐브 하나. 클릭하면 후처리 토글을 호출한다. */
function SpinningCube({ position, color, phase, onToggle }: SpinningCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(state => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const elapsed = state.clock.elapsedTime;
    mesh.rotation.x = elapsed * 0.35 + phase;
    mesh.rotation.y = elapsed * 0.5 + phase;
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // 뒤 오브젝트까지 클릭이 전달되면 토글이 두 번 일어나 제자리로 돌아온다.
    event.stopPropagation();
    onToggle();
  };

  return (
    <mesh ref={meshRef} position={position} onClick={handleClick} castShadow>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
    </mesh>
  );
}

/** 격자 바닥. 주사선·비네트가 걸린 것을 읽기 쉬운 규칙적 패턴을 제공한다. */
function GridFloor() {
  return <gridHelper args={[26, 26, '#2f6f86', '#1b3b4a']} position={[0, -1.35, 0]} />;
}

export function Scene() {
  const [effectEnabled, setEffectEnabled] = useState(true);

  const toggleEffect = () => setEffectEnabled(previous => !previous);

  return (
    <>
      <PerspectiveCamera makeDefault fov={45} near={0.5} far={60} position={[0, 1.1, 7]} />

      <color attach="background" args={['#080b12']} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 4]} intensity={2.1} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} color="#7fb0ff" />

      {CUBE_COLORS.map((color, index) => (
        <SpinningCube key={color} color={color} position={[(index - 1) * CUBE_SPACING, 0.2, 0]} phase={index * 1.4} onToggle={toggleEffect} />
      ))}

      <GridFloor />

      {/*
        multisampling={0}: 후처리 체인에서 MSAA는 비용이 크고, 이 씬의 룩은
        오히려 거친 편이 어울린다.
      */}
      <EffectComposer multisampling={0}>
        <CrtPass enabled={effectEnabled} />
      </EffectComposer>
    </>
  );
}
