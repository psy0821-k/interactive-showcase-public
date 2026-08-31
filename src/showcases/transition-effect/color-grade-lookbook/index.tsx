"use client";

export { meta } from "./meta";

import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";
import { Html, PerspectiveCamera } from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  LUT,
  ToneMapping,
} from "@react-three/postprocessing";
import { LUTCubeLoader, ToneMappingMode } from "postprocessing";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SceneReadout } from "@/components/scene-label";

/** 절차 생성 LUT 경로. `scripts/build-luts.mjs`가 만든다 (identity 16³ + 따뜻한 색변환). */
const WARM_LUT_URL = "/luts/warm-film.cube";

/** Bloom은 프리셋과 무관하게 고정. 은은한 발광 막대만 살짝 번지게 한다. */
const BLOOM = {
  intensity: 0.8,
  luminanceThreshold: 1,
  luminanceSmoothing: 0.2,
  radius: 0.6,
} as const;

/** 발광 막대의 HDR 색 — 채널 값이 1을 넘어야 Bloom 대상이 된다 (bloom-postprocessing 2절). */
const EMISSIVE_GAIN = 2.4;

type PresetId =
  | "neutral"
  | "cinema-agx"
  | "cinema-aces"
  | "warm"
  | "faded"
  | "lut";

interface Preset {
  id: PresetId;
  label: string;
  /** 톤매핑 mode. HDR을 표시 범위로 누르는 커브를 고른다. */
  toneMode: ToneMappingMode;
  /** <HueSaturation> — 생략하면 체인에서 빠진다. hue는 라디안, saturation은 -1~1. */
  hueSat?: { hue?: number; saturation?: number };
  /** <BrightnessContrast> — 생략하면 빠진다. 둘 다 -1~1. */
  bc?: { brightness?: number; contrast?: number };
  /** true면 warm-film.cube를 <LUT>로 추가한다. */
  lut?: boolean;
  /** 계기판에 보여줄 활성 체인 요약. */
  chain: string;
}

/**
 * 룩 프리셋 — 순수 데이터. `<Html>` 버튼이 id만 바꾸고, Scene이 이 객체를 읽어
 * 체인 자식을 조건부로 렌더한다.
 *
 * "따뜻"과 "LUT"는 의도적으로 비슷한 결과를 노렸다 — 코드로 매 프레임 계산한
 * 룩(HueSat+BC)과 그 룩을 격자에 구운 LUT가 같은 그림을 낸다는 것이,
 * "LUT는 코드 룩을 굽는 것"이라는 개념의 실증이다.
 */
const PRESETS: readonly Preset[] = [
  {
    id: "neutral",
    label: "중립 (NEUTRAL)",
    toneMode: ToneMappingMode.NEUTRAL,
    chain: "Bloom → ToneMapping(NEUTRAL)",
  },
  {
    id: "cinema-agx",
    label: "시네마 AGX",
    toneMode: ToneMappingMode.AGX,
    bc: { contrast: 0.08 },
    chain: "Bloom → ToneMapping(AGX) → BrightnessContrast(+0.08 대비)",
  },
  {
    id: "cinema-aces",
    label: "시네마 ACES",
    toneMode: ToneMappingMode.ACES_FILMIC,
    bc: { contrast: 0.05 },
    chain: "Bloom → ToneMapping(ACES_FILMIC) → BrightnessContrast(+0.05 대비)",
  },
  {
    id: "warm",
    label: "따뜻 (코드)",
    toneMode: ToneMappingMode.AGX,
    // hue를 아주 살짝 주황 쪽으로 틀고 채도를 조금 올린다.
    hueSat: { hue: -0.06, saturation: 0.06 },
    bc: { brightness: 0.02, contrast: -0.04 },
    chain: "Bloom → ToneMapping(AGX) → HueSaturation → BrightnessContrast",
  },
  {
    id: "faded",
    label: "빛바랜 필름",
    toneMode: ToneMappingMode.AGX,
    // 채도를 크게 낮추고 대비도 낮춰 "물 빠진 필름".
    hueSat: { saturation: -0.32 },
    bc: { brightness: 0.05, contrast: -0.14 },
    chain: "Bloom → ToneMapping(AGX) → HueSaturation(-0.32 채도) → BrightnessContrast",
  },
  {
    id: "lut",
    label: "warm-film.cube LUT",
    toneMode: ToneMappingMode.AGX,
    lut: true,
    chain: "Bloom → ToneMapping(AGX) → LUT(warm-film.cube, tetrahedral)",
  },
] as const;

/**
 * `.cube` 파일을 로드해 `<LUT>`에 물린다.
 *
 * `useLoader`가 URL 기준으로 캐시하므로 프리셋을 오가도 실제 재요청은 없다.
 * 자체 <Suspense>는 두지 않는다 — 이 컴포넌트를 렌더하는 쪽(Scene)이
 * <EffectComposer> 바깥에서 감싸야 EffectComposer가 suspend에 걸리지 않는다.
 */
function LutFromFile({ url }: { url: string }) {
  const texture = useLoader(LUTCubeLoader, url);
  // tetrahedralInterpolation — 16³ 저해상도 격자의 밴딩(그라디언트 띠)을 줄인다.
  return <LUT lut={texture} tetrahedralInterpolation />;
}

/** 채도 있는 절차 소품 3개 + 회색 배경판 + 은은한 발광 막대. */
function LookbookSubject() {
  const emissiveColor = useMemo(
    () => new THREE.Color("#ff7a3d").multiplyScalar(EMISSIVE_GAIN),
    [],
  );

  return (
    <>
      {/* 무채색 배경판 — 색보정이 회색을 어느 쪽으로 미는지 읽는 기준면. */}
      <mesh position={[0, 1.1, -2.2]} receiveShadow>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color="#8a8f96" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#6f747c" roughness={0.95} />
      </mesh>

      {/* 채도 있는 소품 — 색보정이 원색을 어떻게 바꾸는지 드러낸다. */}
      <mesh position={[-1.7, -0.15, 0.3]} castShadow>
        <icosahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#2f6bd8" roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh position={[0.1, -0.3, 0.9]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#3fae5a" roughness={0.5} />
      </mesh>
      <mesh position={[1.7, -0.2, 0.1]} rotation={[0.3, 0.6, 0]} castShadow>
        <torusKnotGeometry args={[0.42, 0.16, 96, 16]} />
        <meshStandardMaterial color="#d8a12f" roughness={0.3} metalness={0.3} />
      </mesh>

      {/*
        은은한 발광 막대 — Bloom이 걸리는 유일한 대상. 톤매핑 mode 차이가
        하이라이트 롤오프에서 가장 잘 보이는 곳이다 (AGX는 흰색으로 덜 뭉친다).
      */}
      <mesh position={[0, 1.6, -1.9]}>
        <boxGeometry args={[5.5, 0.12, 0.12]} />
        <meshBasicMaterial color={emissiveColor} toneMapped={false} />
      </mesh>
    </>
  );
}

export function Scene() {
  const reducedMotion = useReducedMotion();
  const [presetId, setPresetId] = useState<PresetId>("neutral");
  const rigRef = useRef<THREE.Group>(null);

  const preset = useMemo(
    () => PRESETS.find((item) => item.id === presetId) ?? PRESETS[0],
    [presetId],
  );

  const buttonStyle = useMemo<CSSProperties>(
    () => ({
      padding: "5px 10px",
      borderRadius: 6,
      // border shorthand 대신 분리 속성 — active 스타일이 borderColor만 덮어써도
      // shorthand/non-shorthand 충돌 경고가 안 난다.
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "rgba(138, 180, 255, 0.4)",
      background: "rgba(15, 20, 30, 0.9)",
      color: "#e8edf5",
      fontSize: 12,
      cursor: "pointer",
      userSelect: "none",
    }),
    [],
  );

  const activeButtonStyle = useMemo<CSSProperties>(
    () => ({
      ...buttonStyle,
      background: "rgba(90, 130, 220, 0.9)",
      borderColor: "rgba(180, 205, 255, 0.8)",
    }),
    [buttonStyle],
  );

  const getReadout = useCallback(
    () => `${preset.label}\n${preset.chain}`,
    [preset],
  );

  useFrame((state) => {
    const rig = rigRef.current;
    if (!rig || reducedMotion) return;
    // 소품을 아주 느리게 회전 — 색보정이 각 재질에 어떻게 붙는지 여러 각도로.
    // 절대 시간 기반이라 프레임률과 무관하다.
    rig.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.3;
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={42}
        near={0.5}
        far={40}
        position={[0, 0.9, 6.4]}
      />

      {/* 어두운 배경 — Bloom이 보이는 전제 (bloom-postprocessing 5절). */}
      <color attach="background" args={["#0c0d12"]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.9} castShadow />
      <directionalLight position={[-5, 3, -2]} intensity={0.45} color="#9fb8ff" />

      <group ref={rigRef}>
        <LookbookSubject />
      </group>

      <SceneReadout
        getText={getReadout}
        backdrop={[5.4, 0.86]}
        position={[0, 3.3, 0]}
        fontSize={0.14}
        color="#cdd6f4"
        textAlign="center"
        lineHeight={1.5}
      />

      {/*
        프리셋 선택 버튼. <Html>은 <Canvas> 자식이라 계약 위반이 아니다.
        버튼은 presetId만 바꾸고, 아래 <EffectComposer>의 자식이 그에 따라 갈린다.
      */}
      <Html position={[0, -1.7, 0]} center distanceFactor={9} zIndexRange={[120, 0]}>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: 340,
          }}
        >
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              style={item.id === presetId ? activeButtonStyle : buttonStyle}
              onClick={() => setPresetId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Html>

      {/*
        <EffectComposer>는 정확히 1개. 프리셋 전환은 컴포저를 다시 만드는 게
        아니라 (bloom-postprocessing 흔한 실수 8번) 자식 Effect를 조건부로
        갈아끼운다.

        체인 순서 규칙:
          1. Bloom — 원본 HDR 값을 봐야 하므로 맨 앞
          2. ToneMapping — HDR(1 초과)을 표시 범위로 누른다
          3. HueSaturation / BrightnessContrast / LUT — 0~1이 된 색에 색을 입힌다

        LUT는 <Suspense> 안에 둔다 — LUTCubeLoader가 비동기라, 경계가 없으면
        로딩 중 EffectComposer 트리가 통째로 suspend된다 (sdf-text-rendering
        1규칙과 같은 계열).
      */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={BLOOM.intensity}
          luminanceThreshold={BLOOM.luminanceThreshold}
          luminanceSmoothing={BLOOM.luminanceSmoothing}
          mipmapBlur
          radius={BLOOM.radius}
        />
        {/*
          adaptive={false} — 기본값 true는 프레임마다 화면 평균 휘도에 노출을
          맞추는 Reinhard 계열용이다. AGX/ACES/NEUTRAL은 고정 커브라 adaptive를
          켜두면 적응 텍스처가 초기 프레임을 새까맣게 만든다.
        */}
        <ToneMapping mode={preset.toneMode} adaptive={false} />
        {preset.hueSat && (
          <HueSaturation
            hue={preset.hueSat.hue ?? 0}
            saturation={preset.hueSat.saturation ?? 0}
          />
        )}
        {preset.bc && (
          <BrightnessContrast
            brightness={preset.bc.brightness ?? 0}
            contrast={preset.bc.contrast ?? 0}
          />
        )}
        {preset.lut && (
          <Suspense fallback={null}>
            <LutFromFile url={WARM_LUT_URL} />
          </Suspense>
        )}
      </EffectComposer>
    </>
  );
}
