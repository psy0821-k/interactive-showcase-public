'use client';

export { meta } from './meta';

import {
  Suspense,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import {
  Decal,
  Html,
  PerspectiveCamera,
  useGLTF,
  useTexture,
} from '@react-three/drei';

/** public/ 기준 절대 경로. 상세 페이지 중첩 URL에서도 안전하다. */
const MUG_URL = '/models/mug.glb';
const LOGO_URL = '/decals/logo-mark.webp';
const STICKER_URL = '/decals/sticker.webp';

/** generate-mug-glb.mjs와 맞춘 치수. */
const BODY_RADIUS = 0.85;
const HANDLE_RADIUS = 0.62;

/** bleeding 나는 깊이축 scale ↔ 얇게 줄인 깊이축 scale.
 *  손잡이 튜브(반지름 0.13)는 얇아서 깊이 0.5면 이미 관통한다. */
const DEPTH_SCALE_BLEED = 1.4;
const DEPTH_SCALE_THIN = 0.22;

interface MugGLTF {
  nodes: { mug: THREE.Mesh };
}

/**
 * 머그컵 + 데칼 3개.
 *
 * <Decal>은 부모 <mesh>의 자식이어야 하고, 부모의 geometry를 읽어 투영
 * 지오메트리를 만든다. 여기서는 glb의 nodes.mug.geometry를 부모 <mesh>에
 * 넘긴다(gltf-model-loading 소관).
 */
function DecoratedMug({
  debug,
  thinBox,
}: {
  debug: boolean;
  thinBox: boolean;
}) {
  const { nodes } = useGLTF(MUG_URL) as unknown as MugGLTF;

  // 데칼 텍스처는 "색 데이터"라 sRGB로 읽어야 물빠지지 않는다.
  // (pbr-material-setup의 맵 컬러스페이스 규칙과 같은 계열.)
  const [logo, sticker] = useTexture([LOGO_URL, STICKER_URL], (textures) => {
    for (const texture of textures) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
    }
  });

  const depthScale = thinBox ? DEPTH_SCALE_THIN : DEPTH_SCALE_BLEED;

  return (
    <mesh geometry={nodes.mug.geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#f2ede3" roughness={0.38} metalness={0} />

      {/* 데칼 1 — 정면 왼쪽. 조명 받는 meshStandardMaterial. 권장.
          rotation을 number로 주면 <Decal>이 가장 가까운 정점의 법선으로 자동
          정렬한다(z는 그 축 기준 회전). 곡면에서는 이게 늘어남이 가장 적다. */}
      <Decal position={[-0.34, 0.2, BODY_RADIUS]} rotation={0} scale={0.5}>
        <meshStandardMaterial
          map={logo}
          transparent
          alphaTest={0.5}
          roughness={0.3}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-10}
        />
      </Decal>

      {/* 데칼 3 — 정면 오른쪽. map 축약형(children 없음)이라 three Mesh 기본
          MeshBasicMaterial에 물려 조명을 전혀 안 받는다. 안티패턴. */}
      <Decal
        position={[0.34, 0.2, BODY_RADIUS]}
        rotation={0}
        scale={0.5}
        map={logo}
      />

      {/* 데칼 2 — 손잡이 바깥면(얇은 토러스 튜브). 깊이축 scale이 크면 투영
          상자가 튜브를 관통해 손잡이 안쪽 면에도 별이 찍힌다(bleeding).
          '투영 상자 얇게'로 depthScale을 줄이면 바깥면에만 남는다.
          debug로 투영 상자(wireframe box + axes)를 본다. */}
      <Decal
        position={[BODY_RADIUS * 0.7 + HANDLE_RADIUS, 0.05, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.42, 0.42, depthScale]}
        debug={debug}
      >
        <meshStandardMaterial
          map={sticker}
          transparent
          alphaTest={0.5}
          polygonOffset
          polygonOffsetFactor={-10}
        />
      </Decal>
    </mesh>
  );
}

/** 씬 안 캡션 한 장. */
function Caption({
  position,
  tone,
  children,
}: {
  position: [number, number, number];
  tone: 'good' | 'bad' | 'note';
  children: ReactNode;
}) {
  const border =
    tone === 'good'
      ? 'rgba(120, 220, 170, 0.5)'
      : tone === 'bad'
        ? 'rgba(240, 130, 110, 0.5)'
        : 'rgba(150, 180, 220, 0.4)';
  return (
    <Html position={position} center distanceFactor={7} zIndexRange={[110, 0]}>
      <div
        style={{
          padding: '5px 9px',
          borderRadius: 6,
          background: 'rgba(9, 12, 18, 0.85)',
          border: `1px solid ${border}`,
          color: '#e8edf5',
          fontSize: 12,
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    </Html>
  );
}

export function Scene() {
  const [debug, setDebug] = useState(false);
  const [thinBox, setThinBox] = useState(false);

  const buttonStyle = useMemo<CSSProperties>(
    () => ({
      padding: '6px 12px',
      borderRadius: 6,
      border: '1px solid rgba(138, 180, 255, 0.4)',
      background: 'rgba(15, 20, 30, 0.9)',
      color: '#e8edf5',
      fontSize: 13,
      cursor: 'pointer',
      userSelect: 'none',
    }),
    [],
  );

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={40}
        near={0.5}
        far={40}
        position={[1.6, 1.4, 5.2]}
      />

      <color attach="background" args={['#0b0d13']} />

      {/* standard-scene-setup: key + fill + rim 3점 조명. <Environment> 없음. */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
      <directionalLight
        position={[-5, 2, -3]}
        intensity={0.5}
        color="#8fb4ff"
      />
      <directionalLight position={[0, 3, -6]} intensity={0.6} color="#ffd9a8" />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.95, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#14171f" roughness={0.95} />
      </mesh>

      <Suspense fallback={null}>
        <DecoratedMug debug={debug} thinBox={thinBox} />
      </Suspense>

      <Caption position={[-1.35, 1.15, 0.6]} tone="good">
        1 · 권장: meshStandardMaterial — 조명 받음
      </Caption>
      <Caption position={[1.5, 1.15, 0.6]} tone="bad">
        3 · 안티패턴: map 축약형 — 조명 안 받음
      </Caption>
      <Caption position={[2.1, 0.9, 0]} tone="note">
        2 · 손잡이 bleeding — 투영 상자 깊이 조절
      </Caption>

      <Html
        position={[0, 1.9, 0]}
        center
        distanceFactor={10}
        zIndexRange={[120, 0]}
      >
        <div style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setDebug((value) => !value)}
          >
            {debug ? '투영 상자 숨기기' : '투영 상자 보기(debug)'}
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setThinBox((value) => !value)}
          >
            {thinBox ? '투영 상자 두껍게(bleeding)' : '투영 상자 얇게'}
          </button>
        </div>
      </Html>
    </>
  );
}

useGLTF.preload(MUG_URL);
