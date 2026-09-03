'use client';

export { meta } from './meta';

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  Environment,
  PerspectiveCamera,
  useGLTF,
  useHelper,
} from '@react-three/drei';
import { SceneReadout } from '@/components/scene-label';

const MODEL_URL = '/models/lantern.glb';
/** asset-optimization(ISSUE-29)이 생성한 자체 호스팅 HDRI. */
const HDRI_URL = '/hdri/classroom-1k.hdr';

/** 모델을 정규화할 목표 높이(월드 유닛). */
const TARGET_HEIGHT = 2.0;
/** 광원 위치 — 저각이라 그림자가 바닥에 길게 늘어진다. */
const LIGHT_POSITION: [number, number, number] = [4, 5, 3];
/** HDRI 조명 기여 강도. 계기판에도 같은 값을 표기한다. */
const ENV_INTENSITY = 0.8;
/** Box3 측정 전 첫 프레임에 쓰는 임시 절두체 반경. */
const FALLBACK_EXTENT = 4;

/**
 * 모델 바운딩 박스를 재서 스케일·바닥 오프셋과, 스케일 적용 후의 수평 반경을
 * 계산한다. 이 반경으로 shadow-camera 절두체를 딱 감싸게 잡는다(좁을수록 선명).
 */
function measureNormalization(object: THREE.Object3D): {
  scale: number;
  offsetY: number;
  extent: number;
} {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1;
  const scaledHalfX = (size.x * scale) / 2;
  const scaledHalfZ = (size.z * scale) / 2;

  return {
    scale,
    offsetY: -box.min.y * scale,
    // 모델 반경 + 그림자가 바닥에 퍼질 여유
    extent: Math.max(scaledHalfX, scaledHalfZ) + 1.6,
  };
}

interface ShadowLightProps {
  /** Box3로 유도한 절두체 반경. */
  extent: number;
  lightRef: RefObject<THREE.DirectionalLight | null>;
}

/**
 * castShadow 조명 — HDRI가 못 만드는 방향 그림자를 담당한다.
 *
 * shadow-camera 절두체를 모델 Box3로 재서 딱 감싸게 잡고, CameraHelper로 그
 * 상자가 랜턴을 감싸는지 눈으로 확인시킨다.
 */
function ShadowLight({ extent, lightRef }: ShadowLightProps) {
  const shadowCameraRef = useRef<THREE.Camera | null>(null);

  useHelper(shadowCameraRef as RefObject<THREE.Object3D>, THREE.CameraHelper);

  // extent가 확정될 때(측정 완료) shadow.camera 절두체를 맞추고 참조를 넘긴다.
  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) return;

    const cam = light.shadow.camera as THREE.OrthographicCamera;
    cam.left = -extent;
    cam.right = extent;
    cam.top = extent;
    cam.bottom = -extent;
    cam.near = 1;
    // 광원 높이(5) + 모델 + 그림자 늘어짐. 기본 500을 방치하면 깊이 정밀도 낭비.
    cam.far = 18;
    cam.updateProjectionMatrix();

    shadowCameraRef.current = cam;
    light.shadow.needsUpdate = true;
  }, [extent, lightRef]);

  return (
    <directionalLight
      ref={lightRef}
      position={LIGHT_POSITION}
      intensity={2.2}
      castShadow
      shadow-normalBias={0.035}
      shadow-bias={-0.0002}
      shadow-mapSize={[2048, 2048]}
    />
  );
}

/** 랜턴 모델 — 로드 후 그림자 플래그를 켜고 측정값을 위로 올린다. */
function Lantern({ onMeasured }: { onMeasured: (extent: number) => void }) {
  const { scene } = useGLTF(MODEL_URL);

  const normalization = useMemo(() => measureNormalization(scene), [scene]);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    onMeasured(normalization.extent);
  }, [scene, normalization, onMeasured]);

  return (
    <group scale={normalization.scale} position={[0, normalization.offsetY, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/** environmentIntensity + directionalLight 그림자 파라미터 계기판. */
function ShadowStats({
  lightRef,
}: {
  lightRef: RefObject<THREE.DirectionalLight | null>;
}) {
  const getText = useCallback(() => {
    const light = lightRef.current;
    if (!light) return '측정 중';

    const cam = light.shadow.camera as THREE.OrthographicCamera;
    return (
      `envIntensity ${ENV_INTENSITY}   ·   bias ${light.shadow.bias}   ·   normalBias ${light.shadow.normalBias}\n` +
      `mapSize ${light.shadow.mapSize.x}   ·   frustum ±${cam.right.toFixed(1)}  N${cam.near.toFixed(0)} F${cam.far.toFixed(0)}`
    );
  }, [lightRef]);

  return (
    <SceneReadout
      getText={getText}
      backdrop={[6.2, 1.0]}
      position={[0, 2.7, 1.8]}
      fontSize={0.2}
      color="#e8eaf0"
      textAlign="center"
      lineHeight={1.5}
    />
  );
}

function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y = state.clock.elapsedTime;
  });
  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#6b7280" wireframe />
    </mesh>
  );
}

export function Scene() {
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  // Box3 측정 결과. 로드 후 한 번 정해지고 고정된다.
  const [extent, setExtent] = useState(FALLBACK_EXTENT);

  const handleMeasured = useCallback((measured: number) => {
    setExtent(measured);
  }, []);

  useEffect(() => {
    useGLTF.preload(MODEL_URL);
  }, []);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 2.6, 9]}
        fov={42}
        near={0.1}
        far={100}
      />

      {/* HDRI 배경 + IBL. ambientLight는 두지 않는다(HDRI가 대신). */}
      <Environment
        files={HDRI_URL}
        background
        environmentIntensity={ENV_INTENSITY}
      />

      <ShadowLight extent={extent} lightRef={lightRef} />

      {/* 바닥 — 그림자를 받는다. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#2c2f38" roughness={0.95} />
      </mesh>

      <Suspense fallback={<LoadingPlaceholder />}>
        <Lantern onMeasured={handleMeasured} />
      </Suspense>

      <ShadowStats lightRef={lightRef} />
    </>
  );
}
