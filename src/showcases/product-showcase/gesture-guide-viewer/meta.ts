import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '제스처 안내 뷰어',
  category: 'product-showcase',
  usedSkills: ['standard-scene-setup', 'gesture-orbit-inertia', 'html-3d-sync'],
  a11yLabel:
    '회전할 수 있는 3D 제품 뷰어입니다. 마우스로 드래그하면 제품이 돌아가고, 스크롤로 확대·축소하며, 화면 위에 조작 방법 안내가 떠 있습니다. 손을 떼면 관성으로 잠시 더 회전합니다.',
  description:
    "회전 가능한 제품 하나 + drei <Html> 조작 안내 HUD. 셸의 <OrbitControls>가 touches를 '한 손가락=페이지 스크롤 / 두 손가락=회전·줌'으로 매핑하고 enableDamping으로 관성을 준다(gesture-orbit-inertia, ISSUE-44). HUD 문구는 첫 포인터 입력의 event.pointerType('mouse'/'touch')으로 분기한다 — 기기를 감지하는 게 아니라 실제 발생한 이벤트의 필드를 읽으므로 하이브리드 기기에서도 지금 쓰는 입력에 맞는 안내가 나온다. 관성으로 놓은 뒤 잠시 더 도는 것을 확인할 수 있고, prefers-reduced-motion이면 즉시 멈춘다(셸).",
  refinement:
    'AI 초안은 조작 안내 HUD 문구를 navigator.userAgent / "ontouchstart" in window로 갈랐다. 이러면 터치와 마우스를 모두 지원하는 노트북·태블릿에서 "터치 안내"가 고정돼, 실제로 마우스를 쓰는 사용자에게 틀린 안내가 나온다. onPointerDown의 event.nativeEvent.pointerType("mouse"/"touch"/"pen")으로 바꿔, "지금 발생한 입력"의 필드를 읽게 했다. 이후 입력 방식이 바뀌면 다음 포인터에서 문구도 따라 바뀐다. 또 AI는 OrbitControls를 기본값으로 뒀는데, 그러면 모바일에서 캔버스 위 한 손가락 스와이프가 3D 회전에 먹혀 페이지 스크롤이 막힌다. touches에서 ONE을 비우고 컨테이너에 touch-action: pan-y를 걸어 한 손가락은 브라우저 스크롤, 두 손가락만 회전·줌으로 분리했다(ISSUE-44).',
  skillUsage:
    'gesture-orbit-inertia: 셸 <OrbitControls>의 touches에서 ONE을 비워 한 손가락 세로 스와이프를 페이지 스크롤로 넘기고, 컨테이너에 touch-action: pan-y를 걸었다(ISSUE-44). enableDamping으로 관성을 주고 prefers-reduced-motion이면 셸이 damping을 끈다. html-3d-sync: 조작 안내 HUD를 drei <Html>로 띄우고, 첫 포인터 이벤트의 pointerType으로 마우스/터치 문구를 분기했다(기기 감지가 아니라 실제 이벤트 필드). standard-scene-setup: 셸 기본.',
  promptExample:
    "회전 가능한 제품 뷰어 + drei <Html> 조작 안내 HUD를 만들어줘. 모바일에서 한 손가락 세로 스와이프는 페이지 스크롤로 넘기고 두 손가락으로만 회전·줌 되게 — OrbitControls touches에서 ONE 빼고 컨테이너에 touch-action: pan-y. enableDamping으로 관성 주고. HUD 문구는 기기 감지 말고 첫 포인터 이벤트의 pointerType('mouse'/'touch')으로 분기해서 하이브리드 기기에서도 맞는 안내가 나오게. prefers-reduced-motion이면 관성 없이 즉시 정지.",
};
