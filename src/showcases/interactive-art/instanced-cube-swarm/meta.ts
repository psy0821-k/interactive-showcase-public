import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "인스턴스 큐브 군집",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "instanced-particles", "responsive-canvas"],
  description:
    "4000개의 큐브가 InstancedMesh 하나로 그려진다. 인스턴스마다 다른 궤도·회전·색을 갖지만 드로우콜은 1이다. 더미 Object3D로 행렬을 만들고 매 프레임 instanceMatrix.needsUpdate를 세우는 것이 전부다.",
};
