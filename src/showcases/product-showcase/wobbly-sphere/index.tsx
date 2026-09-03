'use client';

export { meta } from './meta';

import { useRef } from 'react';
import * as THREE from 'three';
import { extend, useFrame, type ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/** 지오메트리 해상도. 파장 하나에 정점 8~10개가 기준이다. */
const SPHERE_SEGMENTS = 128;
/** 시간 배속. "숨 쉬는" 인상은 0.5 이하가 좋다. */
const WAVE_SPEED = 0.7;

/**
 * 바닥을 비추는 씬 조명의 위치. 구체는 셰이더가 직접 조명을 계산하므로
 * 이 값의 영향을 받지 않는다 (drei shaderMaterial은 조명 자동 통합이 없다).
 */
const SCENE_LIGHT_POSITION: [number, number, number] = [4, 6, 5];

/**
 * 셰이더용 광원 방향. vNormal이 뷰 공간이므로 이 벡터도 뷰 공간으로 취급한다.
 * z를 크게 잡아 카메라 쪽에서 비추게 하면 정면이 밝아 형태가 잘 읽힌다.
 */
const SHADER_LIGHT_DIRECTION = new THREE.Vector3(0.4, 0.7, 1).normalize();

/**
 * 클래스 이름은 slug 기준으로 유일해야 한다.
 * 다른 쇼케이스와 겹치면 나중 등록이 앞의 것을 덮어쓴다.
 */
const WobblySphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmplitude: 0.16,
    uFrequency: 2.6,
    uColorA: new THREE.Color('#12245c'),
    uColorB: new THREE.Color('#66e0ff'),
    uLightDirection: SHADER_LIGHT_DIRECTION.clone(),
  },
  /* glsl */ `
    // position, normal, normalMatrix, modelViewMatrix, projectionMatrix는
    // ShaderMaterial이 자동 주입한다. 다시 선언하면 중복 선언 에러다.
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vDisplacement;

    // 변위량을 구하는 순수 함수.
    // 법선 재계산에서 이웃 점에도 같은 규칙을 적용해야 하므로 반드시 분리한다.
    float displacementAt(vec3 p) {
      float wave =
          sin(p.x * uFrequency + uTime)
        * sin(p.y * uFrequency + uTime * 0.8)
        * sin(p.z * uFrequency + uTime * 1.3);
      return wave * uAmplitude;
    }

    void main() {
      float displaced = displacementAt(position);
      vec3 newPosition = position + normal * displaced;

      // --- 법선 재계산 (유한차분법) ---
      // 이걸 생략하면 표면이 출렁여도 음영이 원래 구 그대로라 평평해 보인다.
      float eps = 0.01;

      // normal과 나란하지 않은 축을 골라야 cross가 0벡터가 되지 않는다.
      vec3 helper = abs(normal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 tangent = normalize(cross(helper, normal));
      vec3 bitangent = normalize(cross(normal, tangent));

      // 이웃 두 점을 원본과 같은 규칙으로 변형시킨다.
      vec3 neighborA = position + tangent * eps;
      vec3 neighborB = position + bitangent * eps;
      neighborA += normal * displacementAt(neighborA);
      neighborB += normal * displacementAt(neighborB);

      // 변형된 표면 위의 접선 두 개를 외적하면 새 법선이 나온다.
      vec3 newNormal = normalize(cross(neighborA - newPosition, neighborB - newPosition));

      vNormal = normalize(normalMatrix * newNormal);
      vDisplacement = displaced;

      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    precision highp float;

    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uLightDirection;
    uniform float uAmplitude;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying float vDisplacement;

    void main() {
      vec3 normal = normalize(vNormal);

      // 조명 전략 (a): 광원을 uniform으로 직접 넘겨 계산한다.
      // vNormal이 normalMatrix로 변환된 뷰 공간 법선이므로 광원도 뷰 공간으로
      // 취급한다. 카메라를 돌려도 조명이 따라와 실루엣이 항상 읽힌다.
      // 하프램버트라 광원 반대쪽도 형태가 보인다.
      float ndotl = dot(normal, normalize(uLightDirection));
      float diffuse = ndotl * 0.5 + 0.5;

      // 프레넬로 가장자리를 밝혀 실루엣을 살린다.
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

      // 볼록한 곳과 오목한 곳의 색을 다르게 해 변형을 강조한다.
      float t = clamp(vDisplacement / max(uAmplitude, 0.0001) * 0.5 + 0.5, 0.0, 1.0);
      vec3 base = mix(uColorA, uColorB, t);

      gl_FragColor = vec4(base * diffuse + fresnel * uColorB * 0.5, 1.0);
    }
  `,
);

extend({ WobblySphereMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    wobblySphereMaterial: ThreeElement<typeof WobblySphereMaterial>;
  }
}

export function Scene() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const reducedMotion = useReducedMotion();

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    // 감속 모드에서는 정지된 한 순간의 형태만 보여준다.
    elapsed.current += delta * (reducedMotion ? 0 : WAVE_SPEED);
    material.uniforms.uTime.value = elapsed.current;
  });

  return (
    <>
      {/* 씬 조명은 바닥에만 영향을 준다. 구체는 셰이더가 직접 조명을 계산한다. */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={SCENE_LIGHT_POSITION}
        intensity={1.8}
        castShadow
      />

      {/*
        변위로 정점이 원래 바운딩 밖으로 나가므로 컬링을 끈다.
        오브젝트가 하나뿐이라 비용은 사실상 없다.
      */}
      <mesh frustumCulled={false}>
        <sphereGeometry args={[1.2, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <wobblySphereMaterial
          key={WobblySphereMaterial.key}
          ref={materialRef}
        />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.9, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0d1020" roughness={0.9} />
      </mesh>
    </>
  );
}
