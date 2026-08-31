import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "스킨드 마처 릴레이",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "gltf-model-loading", "skeletal-animation"],
  description:
    "본과 애니메이션 클립이 든 .glb를 올려 idle ↔ march 두 클립을 크로스페이드로 섞는다. 클릭하면 그 인형만 클립이 바뀌고, 페이드 구간에서 두 클립의 포즈가 가중 평균으로 겹친다. 세 인형은 SkeletonUtils.clone()으로 복제해 각자 독립된 믹서를 갖는다.",
};
