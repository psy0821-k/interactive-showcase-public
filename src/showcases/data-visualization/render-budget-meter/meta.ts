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
};
