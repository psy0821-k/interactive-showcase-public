import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '스크롤 섹션 리액터',
  category: 'scroll-storytelling',
  usedSkills: [
    'standard-scene-setup',
    'camera-rig',
    'scroll-camera-path',
    'html-3d-sync',
    'section-scroll-scene',
  ],
  description:
    '<ScrollControls> 위에 4개 섹션을 얹어, 스크롤하면 코어 모듈이 조립됐다 분해되고, 한 바퀴 돌고, 링이 순서대로 강조된다. 섹션 카피는 <Scroll html>로 3D와 함께 흐르고, 전환은 useScroll().range/curve를 지수 감쇠로 보간한다.',
  // 카메라를 스크롤로 직접 몬다. 셸이 OrbitControls를 렌더하지 않게 한다.
  controlsMode: 'none',
  refinement:
    "AI 초안은 useScroll().offset을 useFrame 안에서 setState로 저장하고, 그 state로 링 위치·색을 계산했다. 스크롤 중 초당 60회 리렌더가 나 씬 전체가 버벅이고, React Compiler 경고도 떴다. 공유 ref 하나(AssemblyState)에 explode/spin/highlight를 담아, 부모가 useFrame에서 쓰고 자식 링은 자기 useFrame에서 읽기만 하게 바꿨다 — 렌더 사이클을 한 번도 돌리지 않는다. 두 번째로, AI는 셸의 <OrbitControls>를 그대로 두고 useFrame에서 camera.position만 매 프레임 덮어썼다. 다음 프레임에 OrbitControls가 controls.target 기준으로 카메라를 되돌려 씬이 떨렸다. meta.controlsMode: 'none'으로 옵트인해 셸이 OrbitControls를 아예 렌더하지 않게 하고, 카메라를 지수 감쇠(1 - exp(-rate·delta))로 직접 몰았다 — 프레임률이 흔들려도 전환 속도가 일정하다.",
  skillUsage:
    "section-scroll-scene: drei <ScrollControls pages={4}>로 스크롤 한 축에 4챕터를 얹고, useScroll().range()/curve()로 각 챕터 구간의 진행률을 뽑아 씬 상태를 파생했다. useFrame 안에서 그 결과로 setState 하지 않고 ref 보간만 했다. scroll-camera-path: 챕터별 카메라 목표를 지수 감쇠로 이었다. html-3d-sync: 섹션 카피는 <Scroll html>로 3D와 함께 흐른다. controlsMode 'none'으로 카메라 소유권을 가져왔다. camera-rig / standard-scene-setup: 기본.",
  promptExample:
    "drei <ScrollControls> 위에 4개 섹션을 얹은 애플 스타일 스크롤 스토리텔링 씬을 만들어줘. 스크롤하면 코어 모듈이 조립됐다 분해되고, 한 바퀴 돌고, 링이 순서대로 강조되게. 각 섹션 진행률은 useScroll().range()/curve()로 뽑고, useFrame 안에서 그걸로 setState 하지 말고 ref 보간만. 섹션 카피는 <Scroll html>로 3D와 함께 흐르게. 카메라는 직접 모니까 meta.controlsMode 'none'.",
};
