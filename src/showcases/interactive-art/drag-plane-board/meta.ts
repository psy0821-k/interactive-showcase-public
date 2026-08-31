import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "드래그 보드",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "camera-rig", "pointer-raycast-hover", "drag-controls"],
  description:
    "말 세 개를 끌어서 옮긴다. 화면의 2D 포인터를 카메라를 향한 평면에 투영해 3D 위치로 되돌리고, 잡은 순간의 오프셋을 기억해 순간이동을 막는다. 자유 이동·축 고정·영역 제약 세 가지 제약 방식을 나란히 놓았다.",
};
