import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "출렁이는 구체",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "custom-shader-material"],
  description:
    "버텍스 셰이더로 구 표면을 변형하고, 유한차분법으로 법선을 다시 계산해 음영이 형태를 따라가게 만든 예제.",
  skillUsage:
    "custom-shader-material: drei shaderMaterial로 vertex 셰이더에서 노이즈로 정점을 밀어내 표면을 출렁이게 했다. 세그먼트가 충분한 SphereGeometry라야 변형이 보인다(핵심 함정). 변형된 표면의 음영을 맞추려 인접 두 점을 같은 노이즈로 밀어 유한차분으로 법선을 재계산했다. drei shaderMaterial은 씬 조명이 자동 통합되지 않아 라이팅 항을 셰이더에서 직접 계산했다. uTime은 useFrame에서 갱신. standard-scene-setup: 셸 기본.",
  promptExample:
    "버텍스 셰이더로 구 표면을 노이즈로 출렁이게 변형하는 씬을 만들어줘. drei shaderMaterial 쓰고, SphereGeometry 세그먼트 넉넉하게 줘 — 세그먼트 없으면 안 움직여. 변형 후 음영이 형태를 따라가게 인접 점을 같은 노이즈로 밀어서 유한차분으로 법선 재계산해. drei shaderMaterial은 씬 조명 자동 통합 안 되니까 라이팅은 셰이더에서 직접. uTime은 useFrame에서 갱신.",
};
