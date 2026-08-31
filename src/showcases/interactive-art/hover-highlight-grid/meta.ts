import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "호버 하이라이트 그리드",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "camera-rig", "pointer-raycast-hover"],
  description:
    "포인터가 올라간 큐브 하나만 떠오르며 빛난다. 3D에서 오브젝트는 기본적으로 포인터에 투명하므로, 겹친 오브젝트를 가리려면 stopPropagation이 필요하다는 점을 앞줄에 놓인 판으로 드러낸다.",
};
