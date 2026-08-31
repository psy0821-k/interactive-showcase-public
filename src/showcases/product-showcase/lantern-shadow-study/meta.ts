import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "랜턴 그림자 연구",
  category: "product-showcase",
  usedSkills: ["shadow-setup", "gltf-model-loading", "hdri-environment"],
  description:
    "shadow-setup 시나리오 5의 정본 예제 — <Environment>는 방향 그림자를 만들지 않으므로, HDRI 배경 씬에서 또렷한 드롭섀도우를 얻으려면 directionalLight 하나를 castShadow로 병행한다. 모델은 형태가 불규칙해 shadow-camera 절두체를 Box3로 재서 딱 감싸게 잡고, 노란 CameraHelper로 확인시킨다. 계기판은 environmentIntensity와 directionalLight의 bias·normalBias·mapSize·frustum 범위를 표시한다. HDRI는 자체 호스팅 classroom-1k.hdr(preset 금지).",
};
