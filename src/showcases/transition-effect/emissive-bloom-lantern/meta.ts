import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "발광 랜턴 블룸",
  category: "transition-effect",
  usedSkills: ["standard-scene-setup", "camera-rig", "bloom-postprocessing"],
  a11yLabel:
    "블룸 효과를 대조하는 장면입니다. 왼쪽 세 구는 밝기가 높아 빛이 부드럽게 새어나오고, 오른쪽 세 구는 같은 색이지만 밝기가 낮아 선명하게 남습니다. 정적인 장면으로 깜빡임은 없습니다.",
  description:
    "EffectComposer + Bloom으로 밝은 영역만 번지게 한다. 왼쪽 세 구는 임계값을 넘는 HDR 색이라 빛이 새어나오고, 오른쪽 세 구는 같은 색이지만 밝기가 1 이하라 선명하게 남는다. 블룸이 걸리는 기준이 '색'이 아니라 '밝기'임을 한 화면에서 대조한다.",
  skillUsage:
    "bloom-postprocessing: <EffectComposer> 안 <Bloom>의 luminanceThreshold를 1.0 근처로 두고, 왼쪽 구의 emissiveIntensity를 1 초과(HDR)로, 오른쪽 구는 같은 색이되 1 이하로 줘 '색이 아니라 밝기'가 기준임을 대조했다. <EffectComposer> 마운트 시 톤매핑이 꺼지는 점을 감안해 노출을 맞췄다. camera-rig: 두 그룹이 담기는 구도. standard-scene-setup: 정적 씬, 셸 기본.",
  promptExample:
    "EffectComposer + Bloom으로 밝은 영역만 번지는 씬을 만들어줘. 구를 6개 놓되 왼쪽 3개는 emissiveIntensity를 1 넘게(HDR) 줘서 빛이 새어나오고, 오른쪽 3개는 똑같은 색인데 밝기 1 이하라 선명하게 남게 — 블룸 기준이 색이 아니라 밝기라는 걸 대조로 보여줘. Bloom luminanceThreshold는 1.0 근처로. EffectComposer 마운트하면 톤매핑 꺼지는 거 감안해서 노출 맞추고. 정적 씬이라 애니메이션 없어도 돼.",
};
