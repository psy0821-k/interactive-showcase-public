import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "주석 달린 로버 콘솔",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "camera-rig", "pointer-raycast-hover", "html-3d-sync"],
  description:
    "천천히 도는 장비의 각 부위에 drei <Html>로 실제 DOM 라벨을 앵커한다. 부위에 마우스를 올리면 그 라벨만 떠오르고, 부위가 본체 뒤로 돌아가면 occlude가 라벨을 페이드시킨다. distanceFactor로 원근 스케일이 걸려 라벨이 장비에 속한 것처럼 보인다.",
};
