import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "HDRI 환경 조명",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "hdri-environment"],
  description:
    "Lightformer로 만든 환경맵이 금속 표면에 반사된다. 외부 CDN 없이 이미지 기반 조명(IBL)을 구성한 예제.",
  skillUsage:
    "hdri-environment: drei <Environment>에 <Lightformer> 몇 장을 배치해 CDN·hdr 파일 없이 환경맵을 절차적으로 만들고, 그것이 scene.environment로 걸려 금속 구에 반사된다. HDRI 파일은 GPU 메모리를 크게 쓰므로 이 예제는 Lightformer로 대체했다. metalness=1 재질이라 IBL이 없으면 검게 나오는 것을 보인다. standard-scene-setup: 셸 기본 카메라·Canvas.",
  promptExample:
    "금속 구 하나에 환경맵이 반사되는 씬을 만들어줘. 외부 CDN이나 .hdr 파일 없이 drei <Environment> 안에 <Lightformer> 몇 장 배치해서 환경맵을 절차적으로 구성해줘. 구는 metalness=1, roughness 낮게. IBL 없으면 검게 나온다는 걸 보여주는 게 목적이야.",
};
