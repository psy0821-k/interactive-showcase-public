import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "표류하는 별먼지 필드",
  category: "immersive-background",
  usedSkills: [
    "standard-scene-setup",
    "fullscreen-shader-plane",
    "points-particle-field",
  ],
  description:
    "포인트 셰이더로 그린 12,000개의 별먼지. 깊이 방향으로 길게 뻗어 있어 카메라를 앞뒤로 움직이면 sizeAttenuation에 따라 가까운 입자는 커지고 먼 입자는 작아진다.",
};
