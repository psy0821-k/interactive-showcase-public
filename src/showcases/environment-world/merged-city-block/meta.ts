import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "병합된 도시 블록",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "merge-draw-calls", "instanced-particles"],
  description:
    "똑같은 정적 건물 140동을 세 가지 방식으로 그린다. 실측 드로우콜은 개별 메시 283개, 종류별 인스턴싱 11개, mergeGeometries로 합친 지오메트리 5개다. 삼각형 수는 셋 다 약 5,100개로 같다 — 화면도 형상도 그대로인데 CPU가 GPU에 거는 호출 횟수만 달라진다는 것이 이 쇼케이스의 논점이다.",
};
