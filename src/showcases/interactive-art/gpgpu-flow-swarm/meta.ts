import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "GPGPU 유동 군집",
  category: "interactive-art",
  usedSkills: [
    "standard-scene-setup",
    "points-particle-field",
    "gpgpu-simulation",
  ],
  description:
    "65,536개 파티클의 위치와 속도를 부동소수 텍스처에 담고, FBO 핑퐁으로 매 프레임 GPU에서 물리를 갱신한다. 포인터를 따라 끌려오며 흐르지만 CPU는 uniform 몇 개만 쓴다.",
};
