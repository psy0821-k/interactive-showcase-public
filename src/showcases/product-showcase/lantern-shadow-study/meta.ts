import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "랜턴 그림자 연구",
  category: "product-showcase",
  usedSkills: ["shadow-setup", "gltf-model-loading", "hdri-environment"],
  description:
    "shadow-setup 시나리오 5의 정본 예제 — <Environment>는 방향 그림자를 만들지 않으므로, HDRI 배경 씬에서 또렷한 드롭섀도우를 얻으려면 directionalLight 하나를 castShadow로 병행한다. 모델은 형태가 불규칙해 shadow-camera 절두체를 Box3로 재서 딱 감싸게 잡고, 노란 CameraHelper로 확인시킨다. 계기판은 environmentIntensity와 directionalLight의 bias·normalBias·mapSize·frustum 범위를 표시한다. HDRI는 자체 호스팅 classroom-1k.hdr(preset 금지).",
  skillUsage:
    "shadow-setup: <Environment>는 IBL만 주고 방향 그림자를 안 만들므로, castShadow directionalLight 하나를 병행했다(시나리오 5). 불규칙한 모델 형태에 맞춰 shadow-camera-{left..bottom}을 Box3로 재 절두체를 딱 감싸고, CameraHelper로 확인시킨다. hdri-environment: 자체 호스팅 classroom-1k.hdr을 <Environment files>로 걸었다(preset 금지). gltf-model-loading: 랜턴 glb를 useGLTF + <Suspense>로 로드. 계기판은 조명 파라미터를 표시한다.",
  promptExample:
    "HDRI 배경 씬에서 랜턴 모델에 또렷한 드롭섀도우를 만드는 씬을 만들어줘. <Environment>는 방향 그림자를 안 만드니까 castShadow directionalLight 하나를 따로 넣어줘. 모델 형태가 불규칙하니 shadow-camera 범위를 Box3로 재서 절두체가 모델을 딱 감싸게 잡고, CameraHelper 노란 와이어프레임으로 확인시켜. HDRI는 preset 말고 자체 호스팅한 classroom-1k.hdr로. 계기판에 environmentIntensity랑 directionalLight의 bias·normalBias·mapSize·frustum 표시.",
};
