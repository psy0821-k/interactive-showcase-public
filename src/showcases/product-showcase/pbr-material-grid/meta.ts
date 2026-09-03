import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: 'PBR 재질 그리드',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'hdri-environment',
    'pbr-material-setup',
  ],
  description:
    'metalness와 roughness 조합에 따른 재질 변화를 격자로 비교한다. 윗줄은 비금속, 아랫줄은 금속이며 왼쪽에서 오른쪽으로 거칠어진다.',
  refinement:
    'AI 초안은 금속 구에 방향광·환경광만 비추고 <Environment>를 넣지 않았다. meshStandardMaterial의 금속(metalness 1)은 확산광이 거의 없고 주변 환경의 반사로만 보이므로, IBL이 없으면 아랫줄 금속이 통째로 검게 나온다. drei <Environment>에 <Lightformer>로 절차적 환경맵을 넣어(외부 HDR 파일 없이) 반사가 생기게 했다. 두 번째로, AI가 텍스처 맵을 붙인 버전에서는 모든 맵에 기본 colorSpace를 그대로 뒀다. baseColor·emissive 맵은 sRGB로 저장돼 있어 linear로 읽으면 색이 밝고 뜨고, roughness·metalness·normal 맵은 raw 데이터라 sRGB로 읽으면 값이 왜곡된다. 맵별로 colorSpace를 지정하고(색 맵만 SRGBColorSpace), 그 규칙을 코드 주석으로 남겼다.',
  skillUsage:
    'pbr-material-setup: meshStandardMaterial의 metalness·roughness를 격자 좌표에 매핑해 5×2 구를 배치했다. 맵을 쓴다면 color/emissive는 SRGBColorSpace, roughness/metalness/normal은 linear라는 규칙을 코드 주석으로 명시했다. hdri-environment: <Environment>로 IBL을 줘 금속 줄이 검게 나오지 않게 했다(PBR 금속은 IBL 필수). standard-scene-setup: 셸 기본 조명은 보조로만.',
  promptExample:
    'metalness × roughness 조합을 5×2 격자로 비교하는 PBR 재질 그리드를 만들어줘. 윗줄 비금속, 아랫줄 금속, 왼쪽→오른쪽으로 roughness 증가. meshStandardMaterial 쓰고, 금속 줄이 검게 안 나오게 <Environment>로 IBL 넣어줘. 텍스처 맵을 쓴다면 color/emissive는 SRGBColorSpace, roughness/metalness/normal은 linear라는 거 주석으로 남겨.',
};
