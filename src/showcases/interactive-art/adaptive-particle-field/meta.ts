import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "적응형 파티클 필드",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "responsive-canvas"],
  description:
    "화면 폭에 따라 파티클 개수를 낮춘다. 좁은 화면에서는 1/4로 줄어 저사양 기기의 프레임을 지킨다.",
};
