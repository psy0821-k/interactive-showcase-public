import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "제스처 안내 뷰어",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "gesture-orbit-inertia",
    "html-3d-sync",
  ],
  description:
    "회전 가능한 제품 하나 + drei <Html> 조작 안내 HUD. 셸의 <OrbitControls>가 touches를 '한 손가락=페이지 스크롤 / 두 손가락=회전·줌'으로 매핑하고 enableDamping으로 관성을 준다(gesture-orbit-inertia, ISSUE-44). HUD 문구는 첫 포인터 입력의 event.pointerType('mouse'/'touch')으로 분기한다 — 기기를 감지하는 게 아니라 실제 발생한 이벤트의 필드를 읽으므로 하이브리드 기기에서도 지금 쓰는 입력에 맞는 안내가 나온다. 관성으로 놓은 뒤 잠시 더 도는 것을 확인할 수 있고, prefers-reduced-motion이면 즉시 멈춘다(셸).",
};
