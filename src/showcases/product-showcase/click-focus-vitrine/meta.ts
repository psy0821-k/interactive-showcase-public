import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "클릭 포커스 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "pointer-raycast-hover",
    "click-focus-camera",
  ],
  description:
    "크기가 제각각인 전시물을 클릭하면 카메라가 그 앞으로 미끄러져 간다. 오브젝트마다 Box3로 크기를 재어 거리를 유도하므로 큰 것도 작은 것도 화면 점유율이 같고, 위치와 궤도 타깃을 함께 보간해 전환 중 회전이 튀지 않는다. 빈 곳을 클릭하면 전체 뷰로 돌아온다.",
};
