import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "glTF 랜턴 3연작",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "hdri-environment", "gltf-model-loading"],
  description:
    "하나의 .glb를 세 번 배치하며 glTF 로딩의 기본기를 드러낸다. useGLTF의 scene은 단일 인스턴스라 그대로 재사용하면 마지막 위치로 순간이동하므로 <Clone>으로 복제하고, materials 맵으로 개별 재질을 오버라이드하며, Box3로 모델 크기를 재 씬 스케일에 맞춘다.",
  skillUsage:
    "gltf-model-loading: useGLTF로 .glb 하나를 로드하고 <Suspense>로 감쌌다. scene은 URL당 공유 인스턴스라 그대로 3번 렌더하면 마지막 위치로 몰리므로 drei <Clone>으로 복제했다(핵심 함정). materials 맵으로 랜턴마다 emissive 색을 오버라이드하고, Box3로 모델 크기를 재 스케일을 정규화했다. hdri-environment: <Environment>로 금속 부품 반사를 만들었다. standard-scene-setup: 셸 기본.",
  promptExample:
    "랜턴 .glb 하나를 세 번 배치하는 씬을 만들어줘. useGLTF의 scene은 공유 인스턴스라 그냥 3번 렌더하면 다 마지막 위치로 몰려 — <Clone>으로 복제해줘. <Suspense>로 감싸고, materials 맵으로 랜턴마다 emissive 색 다르게 오버라이드하고, Box3로 모델 크기 재서 씬 스케일 정규화. <Environment>로 금속 부품에 반사 넣어줘.",
};
