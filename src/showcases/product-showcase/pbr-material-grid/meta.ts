import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "PBR 재질 그리드",
  category: "product-showcase",
  usedSkills: ["standard-scene-setup", "hdri-environment", "pbr-material-setup"],
  description:
    "metalness와 roughness 조합에 따른 재질 변화를 격자로 비교한다. 윗줄은 비금속, 아랫줄은 금속이며 왼쪽에서 오른쪽으로 거칠어진다.",
  skillUsage:
    "pbr-material-setup: meshStandardMaterial의 metalness·roughness를 격자 좌표에 매핑해 5×2 구를 배치했다. 맵을 쓴다면 color/emissive는 SRGBColorSpace, roughness/metalness/normal은 linear라는 규칙을 코드 주석으로 명시했다. hdri-environment: <Environment>로 IBL을 줘 금속 줄이 검게 나오지 않게 했다(PBR 금속은 IBL 필수). standard-scene-setup: 셸 기본 조명은 보조로만.",
  promptExample:
    "metalness × roughness 조합을 5×2 격자로 비교하는 PBR 재질 그리드를 만들어줘. 윗줄 비금속, 아랫줄 금속, 왼쪽→오른쪽으로 roughness 증가. meshStandardMaterial 쓰고, 금속 줄이 검게 안 나오게 <Environment>로 IBL 넣어줘. 텍스처 맵을 쓴다면 color/emissive는 SRGBColorSpace, roughness/metalness/normal은 linear라는 거 주석으로 남겨.",
};
