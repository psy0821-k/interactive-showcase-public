import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "적응형 파티클 필드",
  category: "interactive-art",
  usedSkills: ["standard-scene-setup", "responsive-canvas"],
  description:
    "화면 폭에 따라 파티클 개수를 낮춘다. 좁은 화면에서는 1/4로 줄어 저사양 기기의 프레임을 지킨다.",
  skillUsage:
    "responsive-canvas: useThree의 size(픽셀)와 viewport(월드 단위)를 구분해 읽고, size.width 구간에 따라 파티클 개수를 4단계로 낮춘다. dpr은 셸이 [1,2]로 이미 잡아 재설정하지 않고, resize 리스너도 직접 달지 않고 R3F가 주는 size 변화에 반응한다(중복 리스너 함정 회피). 개수 변경 시 BufferGeometry를 새로 만들어 attribute 크기를 맞춘다. standard-scene-setup: 셸 Canvas 위 Scene 노드만.",
  promptExample:
    "화면 폭에 따라 파티클 개수를 자동으로 낮추는 씬을 만들어줘. useThree의 size.width 구간으로 4단계 나눠서, 좁은 화면은 넓은 화면의 1/4까지 줄여줘. dpr은 셸이 이미 [1,2]로 잡았으니 건드리지 말고, window resize 리스너도 직접 달지 마 — R3F가 주는 size 변화에만 반응하게. 개수 바뀔 때 BufferGeometry attribute 크기 맞춰서 다시 생성하고.",
};
