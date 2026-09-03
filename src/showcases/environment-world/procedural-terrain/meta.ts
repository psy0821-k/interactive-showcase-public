import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "절차적 지형",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "camera-rig", "procedural-geometry"],
  description:
    "BufferGeometry를 코드로 만들고 fBm 노이즈로 높이를 준 지형. 인덱스로 정점을 공유해 음영이 부드럽게 이어진다.",
  skillUsage:
    "procedural-geometry: PlaneGeometry를 격자로 세분한 뒤 각 정점 z를 fBm(옥타브 누적) 노이즈로 밀어올리고, 변위 후 computeVertexNormals()를 호출해 음영이 평평해지지 않게 했다(핵심 함정). 인덱스 버퍼로 정점을 공유해 삼각형 경계 이음매가 없다. camera-rig: 지형 전체가 담기는 비스듬한 부감 구도로 카메라만 잡았다. standard-scene-setup: 방향광 하나로 능선 음영이 읽히게 셸 기본 조명을 유지했다.",
  promptExample:
    "PlaneGeometry를 코드로 세분하고 fBm 노이즈로 높이를 준 절차적 지형을 만들어줘. 정점 변위 후에 computeVertexNormals() 꼭 불러서 음영이 평평해지지 않게 하고, 인덱스 버퍼로 정점 공유해서 이음매 없게. 노이즈는 옥타브 3~4개 누적하는 fBm으로. 카메라는 지형 전체 담기는 비스듬한 부감으로 잡아줘.",
};
