"use client";

export { meta } from "./meta";

import { useRef } from "react";
import * as THREE from "three";
import {
  extend,
  useFrame,
  useThree,
  type ThreeElement,
} from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** 평면의 z 위치. 멀수록 카메라 회전에 강하다. */
const PLANE_Z = -8;
/** 평면 여유 배율. 1.0이면 회전 즉시 가장자리가 보인다. */
const OVERSCAN = 1.8;
/** 시간 배속. 배경은 느릴수록 좋다. */
const TIME_SPEED = 0.5;

/**
 * 클래스 이름은 slug 기준으로 유일해야 한다.
 * 다른 쇼케이스와 이름이 겹치면 나중에 등록된 것이 앞의 것을 덮어써,
 * A를 열었는데 B의 셰이더가 나오는 추적하기 어려운 버그가 생긴다.
 */
const AuroraPlaneMaterial = shaderMaterial(
  {
    uTime: 0,
    uAspect: 1,
    uPointer: new THREE.Vector2(0, 0),
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

    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uPointer;
    varying vec2 vUv;

    // 값 노이즈 — 외부 라이브러리 없이 부드러운 흐름을 만든다
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      // 종횡비 보정 — 보정하지 않으면 원형 빛무리가 타원이 된다
      vec2 uv = vUv - 0.5;
      uv.x *= uAspect;

      // 세로로 흐르는 오로라 커튼.
      // 옥타브 2개를 겹쳐 큰 흐름 위에 잔결을 얹는다.
      float base = noise(vec2(uv.x * 3.0 + uTime * 0.15, uTime * 0.2));
      float detail = noise(vec2(uv.x * 7.0 - uTime * 0.1, uTime * 0.3));
      float curtain = base * 0.7 + detail * 0.3;

      // 커튼의 세로 중심선을 노이즈로 흔들고, 그로부터의 거리로 밝기를 만든다
      float centerY = (curtain - 0.5) * 0.5;
      float dist = abs(uv.y - centerY);
      float band = smoothstep(0.28, 0.0, dist);

      // 위로 갈수록 옅어지는 수직 그라디언트
      float verticalFade = smoothstep(-0.5, 0.35, uv.y);

      vec3 cool = vec3(0.10, 0.85, 0.60);
      vec3 warm = vec3(0.45, 0.20, 0.75);
      vec3 aurora = mix(cool, warm, curtain) * band * verticalFade * 1.5;

      // 포인터를 따라오는 옅은 빛무리
      float glow = smoothstep(0.4, 0.0, length(uv - uPointer * vec2(uAspect, 1.0) * 0.5));
      aurora += glow * vec3(0.06, 0.10, 0.18);

      vec3 night = vec3(0.02, 0.03, 0.07);
      gl_FragColor = vec4(night + aurora, 1.0);
    }
  `,
);

// JSX 카탈로그 등록. 파일당 한 번만 호출한다.
extend({ AuroraPlaneMaterial });

// R3F v9 타입 선언. 구버전 JSX.IntrinsicElements 방식은 폐기됐다.
declare module "@react-three/fiber" {
  interface ThreeElements {
    auroraPlaneMaterial: ThreeElement<typeof AuroraPlaneMaterial>;
  }
}

export function Scene() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const elapsed = useRef(0);
  const reducedMotion = useReducedMotion();

  const viewport = useThree((state) => state.viewport);

  // 평면이 놓일 깊이에서의 화면 크기를 구한다.
  const { width, height } = viewport.getCurrentViewport(undefined, [
    0,
    0,
    PLANE_Z,
  ]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    // 첫 프레임에는 ref가 비어 있을 수 있다.
    if (!material) return;

    // 감속 모드에서는 시간을 아주 느리게만 흘린다.
    elapsed.current += delta * (reducedMotion ? 0.05 : TIME_SPEED);
    material.uniforms.uTime.value = elapsed.current;

    // 평면 종횡비를 그대로 넘겨 셰이더의 보정과 일치시킨다.
    material.uniforms.uAspect.value = width / height;

    // pointer는 이미 정규화된 중심 기준 좌표다. 보간해 부드럽게 따라간다.
    material.uniforms.uPointer.value.lerp(state.pointer, Math.min(delta * 4, 1));
  });

  return (
    // 배경이므로 레이캐스트에서 제외해 앞쪽 오브젝트의 이벤트를 가로채지 않는다.
    <mesh position={[0, 0, PLANE_Z]} raycast={() => null}>
      <planeGeometry args={[width * OVERSCAN, height * OVERSCAN]} />
      <auroraPlaneMaterial
        key={AuroraPlaneMaterial.key}
        ref={materialRef}
        // 셰이더가 낸 색을 그대로 보여준다. ACESFilmic 톤매핑을 이 머티리얼에서만 끈다.
        toneMapped={false}
      />
    </mesh>
  );
}
