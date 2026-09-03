import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '데칼 투영 바니트린',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'gltf-model-loading',
    'decal-and-projection',
  ],
  description:
    "머그컵 하나에 drei <Decal>을 세 개 얹어 표면 투영의 함정을 한 화면에서 대조한다. (1) 정면 왼쪽 데칼은 children으로 <meshStandardMaterial>을 줘 씬 조명을 받아 명암이 산다 — 권장. (3) 정면 오른쪽 데칼은 같은 텍스처를 map 축약형(children 없음)으로 얹어, three Mesh 기본 MeshBasicMaterial에 물려 조명을 전혀 안 받는다 — 안티패턴. 나란히 두면 차이가 바로 보인다. (2) 손잡이에 얹은 별 스티커는 투영 상자 깊이축 scale이 크면 얇은 튜브를 관통해 안쪽 면에도 찍힌다(bleeding) — '투영 상자 얇게' 토글로 줄이면 사라지고, debug 토글로 투영 상자(wireframe box + axes)를 본다. 데칼 텍스처는 색 데이터라 colorSpace를 SRGBColorSpace로 지정하고, 알파 경계는 alphaTest로 정리한다. 머그컵 glb는 scripts/generate-mug-glb.mjs가 코드로 만든다(약 35KB).",
  skillUsage:
    'decal-and-projection: drei <Decal> 3개로 세 가지 상황을 대조한다 — children으로 <meshStandardMaterial>을 준 데칼(조명 받음, 권장), map 축약형 데칼(MeshBasicMaterial에 물려 조명 무시, 안티패턴), 투영 상자 깊이가 커서 튜브 안쪽까지 새는 데칼(bleeding). 데칼 텍스처는 SRGBColorSpace 지정 + alphaTest로 경계 정리. debug 토글로 투영 상자를 wireframe으로 그린다. gltf-model-loading: 머그컵 glb는 scripts로 코드 생성(35KB). standard-scene-setup: 셸 기본.',
  promptExample:
    "머그컵 하나에 drei <Decal>을 세 개 얹어서 표면 투영의 함정을 대조하는 씬을 만들어줘. (1) children으로 meshStandardMaterial 준 데칼 — 조명 받음, 권장. (2) map 축약형으로만 얹은 데칼 — MeshBasicMaterial에 물려 조명 무시, 안티패턴. 둘을 나란히 놔. (3) 손잡이에 별 스티커 얹되 투영 상자 깊이를 키워서 튜브 안쪽까지 새는 bleeding을 보여주고, '상자 얇게' 토글로 없어지게. debug 토글로 투영 상자 wireframe 표시. 데칼 텍스처는 SRGBColorSpace + alphaTest. 머그컵 glb는 스크립트로 코드 생성해줘.",
};
