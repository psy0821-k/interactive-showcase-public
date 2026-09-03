import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "스크롤 섹션 리액터",
  category: "scroll-storytelling",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "scroll-camera-path",
    "html-3d-sync",
    "section-scroll-scene",
  ],
  description:
    "<ScrollControls> 위에 4개 섹션을 얹어, 스크롤하면 코어 모듈이 조립됐다 분해되고, 한 바퀴 돌고, 링이 순서대로 강조된다. 섹션 카피는 <Scroll html>로 3D와 함께 흐르고, 전환은 useScroll().range/curve를 지수 감쇠로 보간한다.",
  // 카메라를 스크롤로 직접 몬다. 셸이 OrbitControls를 렌더하지 않게 한다.
  controlsMode: "none",
  skillUsage:
    "section-scroll-scene: drei <ScrollControls pages={4}>로 스크롤 한 축에 4챕터를 얹고, useScroll().range()/curve()로 각 챕터 구간의 진행률을 뽑아 씬 상태를 파생했다. useFrame 안에서 그 결과로 setState 하지 않고 ref 보간만 했다. scroll-camera-path: 챕터별 카메라 목표를 지수 감쇠로 이었다. html-3d-sync: 섹션 카피는 <Scroll html>로 3D와 함께 흐른다. controlsMode 'none'으로 카메라 소유권을 가져왔다. camera-rig / standard-scene-setup: 기본.",
  promptExample:
    "drei <ScrollControls> 위에 4개 섹션을 얹은 애플 스타일 스크롤 스토리텔링 씬을 만들어줘. 스크롤하면 코어 모듈이 조립됐다 분해되고, 한 바퀴 돌고, 링이 순서대로 강조되게. 각 섹션 진행률은 useScroll().range()/curve()로 뽑고, useFrame 안에서 그걸로 setState 하지 말고 ref 보간만. 섹션 카피는 <Scroll html>로 3D와 함께 흐르게. 카메라는 직접 모니까 meta.controlsMode 'none'.",
};
