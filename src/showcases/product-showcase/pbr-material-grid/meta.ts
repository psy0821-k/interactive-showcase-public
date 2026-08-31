import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "PBR 재질 그리드",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "hdri-environment",
    "pbr-material-setup",
  ],
  description:
    "metalness와 roughness 조합에 따른 재질 변화를 격자로 비교한다. 윗줄은 비금속, 아랫줄은 금속이며 왼쪽에서 오른쪽으로 거칠어진다.",
};
