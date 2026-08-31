import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "발광 랜턴 블룸",
  category: "transition-effect",
  usedSkills: ["standard-scene-setup", "camera-rig", "bloom-postprocessing"],
  description:
    "EffectComposer + Bloom으로 밝은 영역만 번지게 한다. 왼쪽 세 구는 임계값을 넘는 HDR 색이라 빛이 새어나오고, 오른쪽 세 구는 같은 색이지만 밝기가 1 이하라 선명하게 남는다. 블룸이 걸리는 기준이 '색'이 아니라 '밝기'임을 한 화면에서 대조한다.",
};
