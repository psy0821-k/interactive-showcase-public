"use client";

export { meta } from "./meta";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera, useAnimations, useGLTF } from "@react-three/drei";

/** public/ 기준 절대 경로. 상세 페이지 URL이 중첩이어도 기준점이 흔들리지 않는다. */
const MODEL_URL = "/models/marcher.glb";

/** 인형을 놓을 x 좌표. 개수를 바꾸면 배치가 따라간다. */
const MARCHER_OFFSETS = [-1.5, 0, 1.5] as const;

/** 크로스페이드 길이(초). 너무 짧으면 툭 끊기고, 너무 길면 흐물거린다. */
const FADE_DURATION = 0.45;

/** 이 모델에 들어 있는 클립 이름. 생성 스크립트와 짝을 이룬다. */
const CLIP_IDLE = "idle";
const CLIP_MARCH = "march";

/** march 클립을 재생할 때 곱하는 속도 배수. 인형마다 살짝 어긋나게 준다. */
const MARCH_TIME_SCALES = [0.85, 1, 1.15] as const;

/** 선택된 인형의 발판 색. 어떤 인형이 march 중인지 눈으로 구분한다. */
const PAD_ACTIVE_COLOR = "#6ee7b7";
const PAD_IDLE_COLOR = "#37415160";

interface MarcherProps {
  position: [number, number, number];
  /** 재생할 클립 이름. 바뀌면 크로스페이드가 일어난다. */
  clipName: string;
  /** march 클립의 재생 속도 배수. */
  marchTimeScale: number;
  onSelect: () => void;
}

/**
 * 인형 한 개.
 *
 * 모델 로딩·캐시 동작은 `gltf-model-loading` 소관이므로 여기서는 두 가지만 한다.
 *
 * 1. `SkeletonUtils.clone()`으로 복제한다.
 *    drei `<Clone>`이나 `Object3D.clone()`은 SkinnedMesh의 뼈 참조를 다시 잇지
 *    않아 사본이 **원본의 스켈레톤을 그대로 가리킨다.** 사본 세 개가 하나의
 *    스켈레톤을 공유하면 세 인형이 똑같이 움직이거나 아예 찌그러진다.
 *    스킨드 메시를 복제할 때는 항상 SkeletonUtils.clone()이다.
 * 2. 복제한 트리를 root로 넘겨 `useAnimations`를 건다.
 *    인형마다 훅을 따로 호출하므로 믹서도 액션도 인형마다 독립이다.
 */
function Marcher({ position, clipName, marchTimeScale, onSelect }: MarcherProps) {
  const { scene, animations } = useGLTF(MODEL_URL);

  // 복제는 인스턴스당 한 번이면 충분하다. 매 렌더 복제하면 스켈레톤이 매번 새로 생긴다.
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  const rootRef = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, rootRef);

  // 그림자 플래그는 glTF에 저장되지 않으므로 복제본을 순회해 직접 켠다.
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  /**
   * 재생과 크로스페이드.
   *
   * `actions`는 ref가 채워진 뒤에야 만들어지는 lazy getter라 **렌더 중에는
   * 읽을 수 없다.** 반드시 effect 안에서 읽는다.
   *
   * 이전 액션을 `fadeOut`만 하고 새 액션을 `play()`하면 화면이 멈춘 것처럼
   * 보이는 경우가 있다. 새 액션이 지난번 재생의 마지막 프레임에 `paused`로
   * 남아 있기 때문이다. `reset()`이 time·weight·paused를 원복해 이를 막는다.
   */
  useEffect(() => {
    const next = actions[clipName];
    if (!next) return;

    next.reset().setEffectiveTimeScale(clipName === CLIP_MARCH ? marchTimeScale : 1);
    next.fadeIn(FADE_DURATION).play();

    // 정리 함수에서 페이드아웃한다. clipName이 바뀌면 새 액션의 fadeIn과
    // 겹쳐 실행되므로 두 클립이 가중치로 섞이는 구간이 생긴다.
    return () => {
      next.fadeOut(FADE_DURATION);
    };
  }, [actions, clipName, marchTimeScale]);

  /**
   * 클립 종료 감지 예시.
   *
   * 두 클립 모두 LoopRepeat이라 'finished'는 실제로 발생하지 않지만,
   * LoopOnce 클립을 섞을 때 이 자리에 후속 동작을 건다. 리스너는 믹서에
   * 누적되므로 cleanup에서 반드시 뗀다.
   */
  useEffect(() => {
    const handleFinished = (event: { action: THREE.AnimationAction }) => {
      event.action.paused = true;
    };
    mixer.addEventListener("finished", handleFinished);
    return () => mixer.removeEventListener("finished", handleFinished);
  }, [mixer]);

  return (
    <group ref={rootRef} position={position} onClick={onSelect}>
      <primitive object={clonedScene} />
    </group>
  );
}

/** 인형 아래 발판. 어떤 인형이 march 중인지 색으로 알린다. */
function SelectionPad({ position, active }: { position: [number, number, number]; active: boolean }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[0.55, 32]} />
      <meshStandardMaterial
        color={active ? PAD_ACTIVE_COLOR : PAD_IDLE_COLOR}
        roughness={0.6}
        transparent
        opacity={active ? 0.9 : 0.4}
      />
    </mesh>
  );
}

/** 모델을 기다리는 동안 자리를 지키는 3D fallback. */
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y = state.clock.elapsedTime * 1.4;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.9, 0]}>
      <torusGeometry args={[0.4, 0.06, 8, 24]} />
      <meshStandardMaterial color="#64748b" wireframe />
    </mesh>
  );
}

/**
 * 인형 세 개와 선택 상태.
 *
 * 어떤 인형이 march 중인지는 React 상태로 들고, 클립 전환 자체는 effect가
 * 처리한다. `useFrame` 안에서 상태를 바꾸지 않으므로 초당 60회 리렌더가 없다.
 */
function MarcherRelay() {
  const [marchingIndex, setMarchingIndex] = useState<number | null>(1);

  const handleSelect = useCallback((index: number) => {
    // 이미 행진 중인 인형을 다시 누르면 idle로 되돌린다.
    setMarchingIndex((current) => (current === index ? null : index));
  }, []);

  return (
    <>
      {MARCHER_OFFSETS.map((offsetX, index) => {
        const active = marchingIndex === index;
        return (
          <group key={offsetX}>
            <SelectionPad position={[offsetX, 0.01, 0]} active={active} />
            <Marcher
              position={[offsetX, 0, 0]}
              clipName={active ? CLIP_MARCH : CLIP_IDLE}
              marchTimeScale={MARCH_TIME_SCALES[index] ?? 1}
              onSelect={() => handleSelect(index)}
            />
          </group>
        );
      })}
    </>
  );
}

export function Scene() {
  /**
   * preload는 모듈 최상위가 아니라 effect 안에서 부른다.
   * 갤러리는 meta를 eager import 하므로 최상위에 두면 목록만 열어도 모든
   * 쇼케이스의 모델이 내려받아진다 (PRD 27절 규칙 5).
   */
  useEffect(() => {
    useGLTF.preload(MODEL_URL);
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault fov={40} near={0.5} far={40} position={[0, 1.9, 5.6]} />

      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={4} scale={[10, 5]} position={[0, 5, -4]} color="#dce9ff" />
      </Environment>

      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 3]} intensity={2.2} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#161a21" roughness={0.95} />
      </mesh>

      {/*
        모델을 기다리는 경계. 없으면 useGLTF가 던진 promise가 셸까지 올라가
        fallback이 null인 상위 경계에 걸려 씬 전체가 사라진다.
      */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <MarcherRelay />
      </Suspense>
    </>
  );
}
