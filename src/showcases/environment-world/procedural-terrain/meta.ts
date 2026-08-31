import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "절차적 지형",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "camera-rig", "procedural-geometry"],
  description:
    "BufferGeometry를 코드로 만들고 fBm 노이즈로 높이를 준 지형. 인덱스로 정점을 공유해 음영이 부드럽게 이어진다.",
};
