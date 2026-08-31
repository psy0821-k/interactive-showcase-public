import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "glTF 랜턴 3연작",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "hdri-environment",
    "gltf-model-loading",
  ],
  description:
    "하나의 .glb를 세 번 배치하며 glTF 로딩의 기본기를 드러낸다. useGLTF의 scene은 단일 인스턴스라 그대로 재사용하면 마지막 위치로 순간이동하므로 <Clone>으로 복제하고, materials 맵으로 개별 재질을 오버라이드하며, Box3로 모델 크기를 재 씬 스케일에 맞춘다.",
};
