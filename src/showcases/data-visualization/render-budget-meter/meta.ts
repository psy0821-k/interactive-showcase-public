import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "렌더 예산 미터",
  category: "data-visualization",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "on-demand-rendering",
    "pointer-raycast-hover",
  ],
  description:
    "씬이 몇 번 렌더됐는지를 씬 자신이 막대로 그린다. 어떤 오브젝트도 스스로 애니메이션하지 않고, 색과 높이는 클릭으로 바꾼 상태에서만 파생된다 — invalidate()가 부르는 프레임만으로 성립하도록 짠 구조다. 초당 렌더 막대가 계속 차오르면 캔버스가 always 모드라는 뜻이고, 손을 뗀 뒤 0으로 떨어지면 demand가 실제로 먹은 것이다.",
  skillUsage:
    "on-demand-rendering: meta.frameloop를 'demand'로 두고, 모든 시각 변화가 React 상태에서 파생되도록 짜 invalidate()가 부르는 프레임만 렌더되게 했다. pointer-raycast-hover: 막대 클릭으로 상태를 바꿔 프레임을 유발하고, onPointerOver/Out로 커서 피드백을 준다. camera-rig: 막대 그래프 전체가 담기도록 makeDefault 카메라로 구도만 잡았다. standard-scene-setup: 셸이 제공하는 Canvas·조명 위에 Scene 노드만 얹었다. 렌더 카운트는 useThree의 gl.info.render.frame 델타를 useFrame에서 읽어 막대 높이로 그린다.",
  promptExample:
    "온디맨드 렌더링이 실제로 먹는지 눈으로 확인시키는 씬을 만들어줘. meta.frameloop를 'demand'로 하고, 씬 안 어떤 것도 스스로 움직이지 않게 — 색·높이 전부 클릭한 상태에서만 파생되도록 짜줘. 막대 그래프로 '초당 렌더된 프레임 수'를 그려서, 손을 놓으면 0으로 떨어지는 게 보이게. 막대를 클릭하면 색과 높이가 바뀌고 그때만 invalidate()가 프레임을 부르는 구조로. useFrame 안에서 setState 하지 말고 gl.info.render로 카운트만 읽어.",
};
