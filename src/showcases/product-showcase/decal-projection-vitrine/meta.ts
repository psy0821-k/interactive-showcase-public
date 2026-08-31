import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "데칼 투영 바니트린",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "gltf-model-loading",
    "decal-and-projection",
  ],
  description:
    "머그컵 하나에 drei <Decal>을 세 개 얹어 표면 투영의 함정을 한 화면에서 대조한다. (1) 정면 왼쪽 데칼은 children으로 <meshStandardMaterial>을 줘 씬 조명을 받아 명암이 산다 — 권장. (3) 정면 오른쪽 데칼은 같은 텍스처를 map 축약형(children 없음)으로 얹어, three Mesh 기본 MeshBasicMaterial에 물려 조명을 전혀 안 받는다 — 안티패턴. 나란히 두면 차이가 바로 보인다. (2) 손잡이에 얹은 별 스티커는 투영 상자 깊이축 scale이 크면 얇은 튜브를 관통해 안쪽 면에도 찍힌다(bleeding) — '투영 상자 얇게' 토글로 줄이면 사라지고, debug 토글로 투영 상자(wireframe box + axes)를 본다. 데칼 텍스처는 색 데이터라 colorSpace를 SRGBColorSpace로 지정하고, 알파 경계는 alphaTest로 정리한다. 머그컵 glb는 scripts/generate-mug-glb.mjs가 코드로 만든다(약 35KB).",
};
