import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '유리 재질 진열대',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'hdri-environment',
    'transmission-glass-material',
  ],
  description:
    '같은 구 6개를 서로 다른 투과 재질로 놓고 비교한다 — 맑은 유리(MeshPhysicalMaterial), 맑은 유리(MeshTransmissionMaterial, 배경 씬 굴절), 간유리(roughness 상승), 색유리(attenuationColor로 두께 비례 흡수), 액체(ior 1.33), 색수차(dispersion). 뒤 격자 배경이 굴절·프로스팅으로 왜곡되는 걸 드러낸다. MTM 셀들은 transmissionSampler로 버퍼를 공유하고, 계기판에 gl.info.render.calls를 표시해 그 효과를 확인시킨다. IBL은 Lightformer 절차적 생성(preset 금지).',
  skillUsage:
    'transmission-glass-material: 구 6개에 transmission/ior/thickness/attenuationColor/dispersion을 달리 줘 유리·간유리·색유리·액체·색수차를 비교한다. MeshTransmissionMaterial 셀들은 transmissionSampler로 굴절 버퍼를 공유해 드로우콜을 아꼈고, 계기판에 gl.info.render.calls로 그 효과를 보인다. hdri-environment: <Environment>에 Lightformer를 절차 배치(preset 금지) — IBL 없으면 투과 재질이 검게 나온다(핵심 함정). standard-scene-setup: 뒤 격자 배경으로 굴절 왜곡을 드러낸다.',
  promptExample:
    '같은 구 6개에 서로 다른 투과 재질을 입혀 비교하는 진열대를 만들어줘 — 맑은 유리(MeshPhysicalMaterial), 맑은 유리(MeshTransmissionMaterial, 배경 굴절), 간유리(roughness), 색유리(attenuationColor로 두께 비례 흡수), 액체(ior 1.33), 색수차(dispersion). 뒤에 격자 배경 놔서 굴절로 왜곡되는 걸 보여주고. MTM 셀들은 transmissionSampler로 버퍼 공유해서 드로우콜 아끼고 계기판에 gl.info.render.calls 표시. IBL은 preset 말고 Lightformer로 직접 만들어 — 없으면 유리가 검게 나와.',
};
