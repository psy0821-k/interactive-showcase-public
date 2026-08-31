import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "안개 깊이 진열대",
  category: "environment-world",
  usedSkills: [
    "standard-scene-setup",
    "fog-and-atmosphere",
    "pointer-raycast-hover",
  ],
  description:
    "z축으로 늘어선 아치 12개가 카메라에서 멀어질수록 안개 색으로 사라진다. 배경색과 fog 색이 같은 상수(FOG_COLOR)를 공유해 원경이 '실루엣'이 아니라 '사라짐'으로 보인다 — fog의 1번 규칙. 씬 안 3D 버튼을 클릭하면 THREE.Fog(선형, near~far)와 THREE.FogExp2(지수, density)가 번갈아 적용되고, 계기판이 현재 모드와 활성 파라미터를 표시한다. 카메라는 좌우로 아주 느리게 스윙해 열을 여러 각도에서 보여준다(prefers-reduced-motion이면 정지).",
};
