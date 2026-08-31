import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "부유하는 궤도 시계",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "camera-rig", "procedural-animation"],
  description:
    "같은 움직임을 프레임 의존 방식(왼쪽)과 delta 정규화 방식(오른쪽)으로 나란히 돌린다. 인위적으로 프레임을 떨어뜨리면 왼쪽만 느려지고 오른쪽은 속도를 유지한다. 사인 부유·위상 오프셋·지수 감쇠 보간을 한 씬에 모았다.",
};
