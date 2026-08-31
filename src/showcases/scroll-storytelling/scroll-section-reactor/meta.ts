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
};
