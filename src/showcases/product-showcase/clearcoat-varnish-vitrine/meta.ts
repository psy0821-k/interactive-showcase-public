import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '코팅 재질 진열대',
  category: 'product-showcase',
  usedSkills: ['standard-scene-setup', 'hdri-environment', 'clearcoat-varnish'],
  description:
    '같은 라운드 큐브 4개를 서로 다른 clearcoat 재질로 놓고 비교한다 — 자동차 도장(금속 base + 매끈 코팅), 바니시 목재(거친 나무 base + 매끈 코팅 = 이중 하이라이트), 젖은 표면(거친 무광 base 유지 + 부분 코팅), 오렌지필(clearcoatNormalMap으로 코팅 층만 요철). 구가 아니라 곡률이 넓게 변하는 라운드 큐브라 코팅 하이라이트가 면을 따라 늘어져 base·coat 두 로브가 분리돼 보인다. 오렌지필 노멀맵은 offscreen canvas에서 사인파 높이장으로 절차 생성(에셋 0). IBL은 Lightformer 스트립 라이트(preset 금지). 그리드가 아주 느리게 회전해 좁은 코팅 하이라이트가 넓은 base 하이라이트 위를 미끄러진다.',
  skillUsage:
    'clearcoat-varnish: meshPhysicalMaterial의 clearcoat·clearcoatRoughness를 base metalness/roughness와 조합해 4가지 도장 룩을 만들었다. 코팅 반사는 항상 유전체라 base 색이 안 물든다는 점을 목재·젖은 표면 셀로 드러냈다. 오렌지필은 offscreen canvas 사인파 높이장으로 clearcoatNormalMap을 절차 생성했다(에셋 0). hdri-environment: <Environment>에 Lightformer 스트립을 배치해(preset 금지) 코팅 하이라이트가 생기게 했다 — IBL 없으면 clearcoat가 티 안 남. standard-scene-setup: 셸 기본, 회전은 procedural.',
  promptExample:
    '라운드 큐브 4개에 서로 다른 clearcoat 재질을 입혀 비교하는 진열대를 만들어줘 — 자동차 도장(금속 base + 매끈 코팅), 바니시 목재(거친 나무 base + 매끈 코팅으로 이중 하이라이트), 젖은 표면(무광 base 유지 + 부분 코팅), 오렌지필(clearcoatNormalMap으로 코팅만 요철). 오렌지필 노멀맵은 offscreen canvas 사인파로 절차 생성해서 에셋 0으로. IBL은 preset 쓰지 말고 Lightformer 스트립 라이트로 직접 만들어 — 안 그러면 코팅이 티가 안 나. 그리드를 아주 느리게 회전시켜서 코팅 하이라이트가 base 하이라이트 위를 미끄러지게.',
};
