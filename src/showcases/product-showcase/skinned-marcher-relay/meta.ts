import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "스킨드 마처 릴레이",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "gltf-model-loading",
    "skeletal-animation",
  ],
  description:
    "본과 애니메이션 클립이 든 .glb를 올려 idle ↔ march 두 클립을 크로스페이드로 섞는다. 클릭하면 그 인형만 클립이 바뀌고, 페이드 구간에서 두 클립의 포즈가 가중 평균으로 겹친다. 세 인형은 SkeletonUtils.clone()으로 복제해 각자 독립된 믹서를 갖는다.",
  skillUsage:
    "skeletal-animation: useAnimations로 clip을 받되 actions는 ref가 채워진 뒤 생성되는 lazy 값이라 useEffect에서 접근했다. 전환 시 action.reset().fadeIn(0.3), 이전 action은 fadeOut해 크로스페이드하고, reset()을 빼면 마지막 프레임에 굳는 함정을 피했다. gltf-model-loading: 본이 있는 모델은 SkeletonUtils.clone()으로 복제해야 각 인형이 독립 스켈레톤·믹서를 갖는다. standard-scene-setup: 셸 기본.",
  promptExample:
    "본 + 애니메이션 클립이 든 캐릭터 .glb를 올려서 idle ↔ march를 크로스페이드로 섞는 씬을 만들어줘. useAnimations 쓰고, actions는 lazy 값이니까 useEffect에서 접근해. 전환은 다음 클립 reset().fadeIn(), 이전 클립 fadeOut — reset() 빼먹으면 마지막 프레임에 굳어. 인형 3개는 SkeletonUtils.clone()으로 복제해서 각자 독립 믹서 갖게. 클릭하면 그 인형만 클립 전환.",
};
