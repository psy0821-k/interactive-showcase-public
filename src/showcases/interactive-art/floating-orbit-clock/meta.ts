import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "부유하는 궤도 시계",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "camera-rig", "procedural-animation"],
  description:
    "같은 움직임을 프레임 의존 방식(왼쪽)과 delta 정규화 방식(오른쪽)으로 나란히 돌린다. 인위적으로 프레임을 떨어뜨리면 왼쪽만 느려지고 오른쪽은 속도를 유지한다. 사인 부유·위상 오프셋·지수 감쇠 보간을 한 씬에 모았다.",
  skillUsage:
    "procedural-animation: 왼쪽 그룹은 매 프레임 rotation에 고정값을 더하는 '프레임당' 방식(안티패턴), 오른쪽은 delta를 곱한 '초당' 방식으로 같은 회전을 돌려 대조한다. 부유는 Math.sin(elapsed * f + phase), 추적은 lerp 고정계수 대신 1 - exp(-rate * delta) 지수 감쇠를 썼다. useFrame 안에서 setState는 쓰지 않고 ref 변형만 한다. camera-rig: 두 그룹이 한 화면에 담기는 구도. standard-scene-setup: 셸 기본.",
  promptExample:
    "같은 회전 애니메이션을 왼쪽은 '프레임당' 고정값 더하기, 오른쪽은 delta 곱한 '초당' 방식으로 나란히 돌려서 대조하는 씬을 만들어줘. 프레임을 인위적으로 떨어뜨리는 토글을 넣어서, 프레임 드랍 시 왼쪽만 느려지고 오른쪽은 속도 유지하는 걸 보여줘. 부유는 Math.sin(elapsed*f + phase)로 위상 오프셋 주고, 추적 보간은 lerp 고정계수 말고 1 - exp(-rate*delta) 지수 감쇠로. useFrame 안에서 setState 금지, ref만 만져.",
};
