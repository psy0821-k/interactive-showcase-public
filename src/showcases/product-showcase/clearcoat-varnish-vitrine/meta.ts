import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "코팅 재질 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "hdri-environment",
    "clearcoat-varnish",
  ],
  description:
    "같은 라운드 큐브 4개를 서로 다른 clearcoat 재질로 놓고 비교한다 — 자동차 도장(금속 base + 매끈 코팅), 바니시 목재(거친 나무 base + 매끈 코팅 = 이중 하이라이트), 젖은 표면(거친 무광 base 유지 + 부분 코팅), 오렌지필(clearcoatNormalMap으로 코팅 층만 요철). 구가 아니라 곡률이 넓게 변하는 라운드 큐브라 코팅 하이라이트가 면을 따라 늘어져 base·coat 두 로브가 분리돼 보인다. 오렌지필 노멀맵은 offscreen canvas에서 사인파 높이장으로 절차 생성(에셋 0). IBL은 Lightformer 스트립 라이트(preset 금지). 그리드가 아주 느리게 회전해 좁은 코팅 하이라이트가 넓은 base 하이라이트 위를 미끄러진다.",
};
