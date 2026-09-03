import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "병합된 도시 블록",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "merge-draw-calls", "instanced-particles"],
  description:
    "똑같은 정적 건물 140동을 세 가지 방식으로 그린다. 실측 드로우콜은 개별 메시 283개, 종류별 인스턴싱 11개, mergeGeometries로 합친 지오메트리 5개다. 삼각형 수는 셋 다 약 5,100개로 같다 — 화면도 형상도 그대로인데 CPU가 GPU에 거는 호출 횟수만 달라진다는 것이 이 쇼케이스의 논점이다.",
  skillUsage:
    "merge-draw-calls: BufferGeometryUtils.mergeGeometries로 같은 재질 건물들을 지오메트리 하나로 합쳐 드로우콜을 283→5로 줄였다. instanced-particles: 건물 종류별로 <InstancedMesh>를 만들고 더미 Object3D로 각 인스턴스 행렬을 세팅, 드로우콜을 종류 수(11)로 고정했다. 세 방식(개별/인스턴싱/병합)을 토글로 전환하며 계기판 gl.info.render.calls로 대조한다. standard-scene-setup: 정적 씬이라 조명·카메라는 셸 기본.",
  promptExample:
    "똑같은 건물 140동을 (1) 개별 메시 (2) 종류별 InstancedMesh (3) mergeGeometries로 합친 지오메트리 세 방식으로 그리고 토글로 전환하는 씬을 만들어줘. 세 방식 다 화면 결과와 삼각형 수는 똑같은데 드로우콜만 다르다는 걸 보여주는 게 목적이야. 계기판에 gl.info.render.calls를 띄워서 283 → 11 → 5로 떨어지는 걸 대조시켜줘. 건물은 박스 몇 개 조합이면 충분하고 정적이라 애니메이션 없어도 돼.",
};
