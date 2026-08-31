"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "절차적 지형",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "camera-rig", "procedural-geometry"],
  description:
    "BufferGeometry를 코드로 만들고 fBm 노이즈로 높이를 준 지형. 인덱스로 정점을 공유해 음영이 부드럽게 이어진다.",
};

/** 격자 분할 수. 정점은 (SEGMENTS+1)^2 개가 된다. */
const SEGMENTS = 140;
/** 월드 크기 */
const SIZE = 12;
/** 높이 진폭. SIZE의 10~20%가 자연스럽다. */
const HEIGHT = 1.9;
/** 노이즈 주파수 */
const NOISE_SCALE = 3.2;

/** fBm 파라미터 */
const OCTAVES = 5;
const LACUNARITY = 2;
const GAIN = 0.5;

/** 정수 격자점의 0~1 난수. 같은 입력에 항상 같은 값이 나와야 한다. */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** 5차 에르미트 보간. 2차 미분까지 연속이라 매끄럽다. */
function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** 격자 사이를 보간한 값 노이즈 */
function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smootherstep(x - ix);
  const fy = smootherstep(y - iy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  return (
    a * (1 - fx) * (1 - fy) +
    b * fx * (1 - fy) +
    c * (1 - fx) * fy +
    d * fx * fy
  );
}

/** 주파수를 배로 올리고 진폭을 반으로 줄이며 겹친다. */
function fbm(x: number, y: number): number {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let totalAmplitude = 0;

  for (let i = 0; i < OCTAVES; i += 1) {
    sum += valueNoise(x * frequency, y * frequency) * amplitude;
    totalAmplitude += amplitude;
    amplitude *= GAIN;
    frequency *= LACUNARITY;
  }

  return sum / totalAmplitude;
}

/** 격자 UV(0~1)를 받아 높이를 돌려준다. */
function heightAt(u: number, v: number): number {
  const base = fbm(u * NOISE_SCALE, v * NOISE_SCALE);
  // 가장자리를 낮춰 섬처럼 보이게 한다.
  const edgeFalloff = Math.min(
    smootherstep(Math.min(u, 1 - u) * 3),
    smootherstep(Math.min(v, 1 - v) * 3),
  );
  return (base - 0.35) * HEIGHT * edgeFalloff;
}

/**
 * 평면 격자를 만들고 노이즈로 높이를 준다.
 * 이 함수를 모듈 최상위에서 "호출"하면 계약 위반이다. 정의만 둔다.
 */
function createTerrainGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertexCount = (SEGMENTS + 1) ** 2;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  for (let iz = 0; iz <= SEGMENTS; iz += 1) {
    for (let ix = 0; ix <= SEGMENTS; ix += 1) {
      const index = iz * (SEGMENTS + 1) + ix;
      const u = ix / SEGMENTS;
      const v = iz / SEGMENTS;

      positions[index * 3] = (u - 0.5) * SIZE;
      positions[index * 3 + 1] = heightAt(u, v);
      positions[index * 3 + 2] = (v - 0.5) * SIZE;

      uvs[index * 2] = u;
      uvs[index * 2 + 1] = v;
    }
  }

  // 정점이 65,535개를 넘으면 Uint16Array로는 인덱스를 표현할 수 없다.
  const IndexArray = vertexCount > 65535 ? Uint32Array : Uint16Array;
  const indices = new IndexArray(SEGMENTS * SEGMENTS * 6);
  let offset = 0;

  for (let iz = 0; iz < SEGMENTS; iz += 1) {
    for (let ix = 0; ix < SEGMENTS; ix += 1) {
      const a = iz * (SEGMENTS + 1) + ix;
      const b = a + 1;
      const c = a + (SEGMENTS + 1);
      const d = c + 1;

      // 반시계 방향이 앞면이다. 뒤집으면 뒷면이 되어 보이지 않는다.
      indices[offset] = a;
      indices[offset + 1] = c;
      indices[offset + 2] = b;
      indices[offset + 3] = b;
      indices[offset + 4] = c;
      indices[offset + 5] = d;
      offset += 6;
    }
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // 인덱스가 있으므로 공유 면들의 평균이 되어 음영이 부드럽게 이어진다.
  // 이 호출을 빼면 법선이 없어 지형이 검게 나온다.
  geometry.computeVertexNormals();
  // 정점을 직접 채웠으므로 바운딩도 직접 계산해야 컬링이 정상 동작한다.
  geometry.computeBoundingSphere();

  return geometry;
}

export function Scene() {
  // 비싼 생성이므로 한 번만 하고 캐시한다.
  const geometry = useMemo(() => createTerrainGeometry(), []);

  // useMemo로 만든 지오메트리는 R3F가 관리하지 않으므로 직접 해제한다.
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <>
      {/*
        지형은 위에서 내려다봐야 형태가 읽힌다. 기본 카메라(z=5, fov 75)로는
        12유닛 크기의 지형을 담을 수 없어 makeDefault로 교체한다.
        far/near = 60/1 = 60 으로 depth 정밀도도 여유롭다.
      */}
      <PerspectiveCamera makeDefault fov={45} near={1} far={60} position={[0, 9, 13]} />

      <Environment resolution={256} environmentIntensity={0.7}>
        <Lightformer
          form="rect"
          intensity={4}
          scale={[14, 6]}
          position={[0, 8, -6]}
          color="#cfe4ff"
        />
      </Environment>

      {/* 지형의 요철이 드러나도록 낮은 각도에서 비춘다. */}
      <directionalLight position={[6, 5, 4]} intensity={2} castShadow />
      <ambientLight intensity={0.15} />

      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#7d8a63" roughness={0.95} metalness={0} />
      </mesh>
    </>
  );
}
