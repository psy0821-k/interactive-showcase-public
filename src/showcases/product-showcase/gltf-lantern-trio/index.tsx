'use client';

export { meta } from './meta';

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  Clone,
  Environment,
  Lightformer,
  PerspectiveCamera,
  useGLTF,
} from '@react-three/drei';

/**
 * public/ 기준 절대 경로.
 *
 * Next는 `public/models/lantern.glb`를 `/models/lantern.glb`로 서빙한다.
 * `./models/...` 같은 상대 경로를 쓰면 상세 페이지 URL이 중첩 경로일 때
 * 기준점이 달라져 404가 난다.
 */
const MODEL_URL = '/models/lantern.glb';

/** 랜턴을 놓을 x 좌표 3곳. 개수를 바꾸면 배치가 그대로 따라간다. */
const LANTERN_OFFSETS = [-1.9, 0, 1.9] as const;

/** 모델을 정규화할 목표 높이(월드 유닛). 씬의 다른 오브젝트와 스케일을 맞춘다. */
const TARGET_HEIGHT = 1.6;

/** 세 번째 랜턴에 덮어씌울 재질 색. 원본 BrassFrame 대신 쓴다. */
const OVERRIDE_FRAME_COLOR = '#7fdcc0';

/** 부유 운동의 진폭과 각속도. delta 기반이라 프레임률과 무관하다. */
const BOB_AMPLITUDE = 0.08;
const BOB_SPEED = 1.1;
const SPIN_SPEED = 0.35;

/**
 * 모델의 바운딩 박스를 재서 "높이 TARGET_HEIGHT, 바닥이 y=0"이 되는
 * 스케일과 y 오프셋을 계산한다.
 *
 * glb는 제작 도구마다 단위(m/cm/inch)와 원점이 달라 그대로 놓으면
 * 먼지처럼 작거나 화면을 뚫고 나온다. 눈대중으로 스케일을 넣지 말고
 * 반드시 실측해서 맞춘다.
 */
function measureNormalization(object: THREE.Object3D): {
  scale: number;
  offsetY: number;
} {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  // 높이가 0이면(빈 씬·평면 모델) 나눗셈이 Infinity가 된다.
  const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1;

  // 스케일을 적용한 뒤의 바닥 높이를 상쇄해 y=0에 앉힌다.
  return { scale, offsetY: -box.min.y * scale };
}

interface LanternProps {
  position: [number, number, number];
  /** 부유 위상. 세 랜턴이 동시에 같은 높이로 움직이지 않게 한다. */
  phase: number;
  /** 프레임 재질을 덮어쓸 색. 없으면 원본 재질 그대로 쓴다. */
  frameColor?: string;
}

/**
 * 랜턴 한 개.
 *
 * `useGLTF`는 URL 단위로 결과를 캐시하므로, 이 컴포넌트가 세 번 마운트돼도
 * 네트워크 요청과 파싱은 한 번만 일어난다. 대신 돌아오는 `scene`은
 * **모든 호출자가 공유하는 단 하나의 객체**다. 그래서 `<primitive object={scene} />`
 * 로 세 번 렌더하면 같은 노드가 세 부모 사이를 옮겨다니다 마지막 것만 남는다.
 * drei `<Clone>`이 이 문제를 해결한다 — 지오메트리·재질은 공유하고
 * 노드 계층만 복제하므로 메모리 비용도 거의 없다.
 */
function Lantern({ position, phase, frameColor }: LanternProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, materials } = useGLTF(MODEL_URL);

  // 스케일 실측은 모델당 한 번이면 충분하다.
  const { scale, offsetY } = useMemo(
    () => measureNormalization(scene),
    [scene],
  );

  /**
   * 그림자 플래그는 glTF에 저장되지 않으므로 로드 후 직접 켠다.
   * 원본 `scene`을 순회하면 <Clone>이 복제한 사본에도 그대로 반영된다.
   *
   * useLayoutEffect를 쓰는 이유: 첫 페인트 전에 켜야 그림자 없는
   * 한 프레임이 노출되지 않는다.
   */
  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  /**
   * 재질 오버라이드.
   *
   * `materials`는 glTF의 재질 이름을 키로 갖는 맵이라 원하는 재질만 집어
   * 바꿀 수 있다. 다만 이 인스턴스도 **캐시를 공유**하므로 여기서 색을
   * 바꾸면 세 랜턴이 전부 바뀐다. 하나만 바꾸려면 `.clone()`으로 사본을
   * 떠야 하고, 사본은 직접 dispose 해야 GPU 자원이 샌다.
   */
  const overriddenFrame = useMemo(() => {
    if (!frameColor) return null;

    const original = materials.BrassFrame;
    if (!(original instanceof THREE.MeshStandardMaterial)) return null;

    const copy = original.clone();
    copy.color = new THREE.Color(frameColor);
    copy.metalness = 0.65;
    copy.roughness = 0.22;
    return copy;
  }, [materials, frameColor]);

  // clone()으로 만든 재질은 캐시가 관리해주지 않는다. 언마운트 시 직접 해제한다.
  useEffect(() => {
    if (!overriddenFrame) return;
    return () => overriddenFrame.dispose();
  }, [overriddenFrame]);

  // 부유 + 회전. delta 기반이 아니라 절대 시간(elapsed) 기반이라
  // 탭을 전환했다 돌아와도 위상이 튀지 않는다.
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const elapsed = state.clock.elapsedTime;
    group.position.y =
      position[1] + Math.sin(elapsed * BOB_SPEED + phase) * BOB_AMPLITUDE;
    group.rotation.y = elapsed * SPIN_SPEED + phase;
  });

  return (
    <group ref={groupRef} position={position}>
      {/*
        실측한 스케일·오프셋을 적용하는 내부 group.
        부유/회전은 바깥 group이 담당해 두 관심사가 섞이지 않는다.
      */}
      <group scale={scale} position={[0, offsetY, 0]}>
        {/*
          inject로 넘긴 재질이 복제된 모든 메시에 적용된다.
          원본 재질을 유지할 때는 inject 없이 그대로 둔다.
        */}
        {overriddenFrame ? (
          <Clone
            object={scene}
            inject={<primitive object={overriddenFrame} attach="material" />}
          />
        ) : (
          <Clone object={scene} />
        )}
      </group>
    </group>
  );
}

/**
 * 로딩 중 자리를 지키는 3D fallback.
 *
 * 셸(showcase-canvas.tsx)에도 `<Suspense fallback={null}>`이 있지만 그건
 * Scene 청크 자체를 기다리는 것이고 fallback이 null이라 화면이 비어 보인다.
 * 모델을 기다리는 동안 "로딩 중"임을 보여주려면 쇼케이스가 자기 경계를
 * 하나 더 두고 눈에 보이는 fallback을 넣어야 한다.
 */
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.x = state.clock.elapsedTime * 0.8;
    mesh.rotation.y = state.clock.elapsedTime * 1.2;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.9, 0]}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color="#6b7280"
        wireframe
        emissive="#94a3b8"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

/** 랜턴 3개를 배치한다. 이 컴포넌트 전체가 모델 로딩 동안 suspend 한다. */
function LanternTrio() {
  return (
    <>
      {LANTERN_OFFSETS.map((offsetX, index) => (
        <Lantern
          key={offsetX}
          position={[offsetX, 0, 0]}
          phase={index * 0.9}
          // 마지막 하나만 재질을 덮어써 오버라이드 여부를 눈으로 비교할 수 있게 한다.
          frameColor={
            index === LANTERN_OFFSETS.length - 1
              ? OVERRIDE_FRAME_COLOR
              : undefined
          }
        />
      ))}
    </>
  );
}

export function Scene() {
  /**
   * preload는 모듈 최상위가 아니라 effect 안에서 부른다.
   * 갤러리는 meta를 eager import 하므로, 최상위에 두면 목록 페이지를 여는
   * 것만으로 모든 쇼케이스의 모델이 내려받아진다(PRD 27절 규칙 5 위반).
   */
  useEffect(() => {
    useGLTF.preload(MODEL_URL);
  }, []);

  return (
    <>
      {/* 랜턴 3개가 가로 약 5유닛을 차지하므로 조금 물러선 구도로 담는다. */}
      <PerspectiveCamera
        makeDefault
        fov={42}
        near={0.5}
        far={40}
        position={[0, 2.1, 6.4]}
      />

      {/* 금속 프레임과 유리 패널이 주인공이라 반사할 환경이 반드시 필요하다. */}
      <Environment resolution={256} environmentIntensity={0.7}>
        <Lightformer
          form="rect"
          intensity={5}
          scale={[12, 6]}
          position={[0, 6, -5]}
          color="#dbe9ff"
        />
        <Lightformer
          form="rect"
          intensity={3}
          scale={[8, 4]}
          position={[-6, 2, 3]}
          color="#ffd9a8"
        />
      </Environment>

      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 4]} intensity={2} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1e26" roughness={0.9} />
      </mesh>

      {/*
        모델을 기다리는 경계. 이 Suspense가 없으면 useGLTF가 던진 promise가
        셸까지 올라가 fallback이 null인 상위 경계에 걸리고, 로딩 동안 씬 전체
        (조명·바닥까지)가 사라진다.
      */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <LanternTrio />
      </Suspense>
    </>
  );
}
