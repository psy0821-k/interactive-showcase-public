import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "발광 랜턴 블룸",
  category: "transition-effect",
  usedSkills: ["standard-scene-setup", "camera-rig", "bloom-postprocessing"],
  a11yLabel:
    "블룸 효과를 대조하는 장면입니다. 왼쪽 세 구는 밝기가 높아 빛이 부드럽게 새어나오고, 오른쪽 세 구는 같은 색이지만 밝기가 낮아 선명하게 남습니다. 정적인 장면으로 깜빡임은 없습니다.",
  description:
    "EffectComposer + Bloom으로 밝은 영역만 번지게 한다. 왼쪽 세 구는 임계값을 넘는 HDR 색이라 빛이 새어나오고, 오른쪽 세 구는 같은 색이지만 밝기가 1 이하라 선명하게 남는다. 블룸이 걸리는 기준이 '색'이 아니라 '밝기'임을 한 화면에서 대조한다.",
};
