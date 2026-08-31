import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "유리 재질 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "hdri-environment",
    "transmission-glass-material",
  ],
  description:
    "같은 구 6개를 서로 다른 투과 재질로 놓고 비교한다 — 맑은 유리(MeshPhysicalMaterial), 맑은 유리(MeshTransmissionMaterial, 배경 씬 굴절), 간유리(roughness 상승), 색유리(attenuationColor로 두께 비례 흡수), 액체(ior 1.33), 색수차(dispersion). 뒤 격자 배경이 굴절·프로스팅으로 왜곡되는 걸 드러낸다. MTM 셀들은 transmissionSampler로 버퍼를 공유하고, 계기판에 gl.info.render.calls를 표시해 그 효과를 확인시킨다. IBL은 Lightformer 절차적 생성(preset 금지).",
};
