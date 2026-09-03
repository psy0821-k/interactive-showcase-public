import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '클릭 포커스 진열대',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'camera-rig',
    'pointer-raycast-hover',
    'click-focus-camera',
  ],
  description:
    '크기가 제각각인 전시물을 클릭하면 카메라가 그 앞으로 미끄러져 간다. 오브젝트마다 Box3로 크기를 재어 거리를 유도하므로 큰 것도 작은 것도 화면 점유율이 같고, 위치와 궤도 타깃을 함께 보간해 전환 중 회전이 튀지 않는다. 빈 곳을 클릭하면 전체 뷰로 돌아온다.',
  skillUsage:
    'click-focus-camera: 클릭한 오브젝트의 Box3로 반경을 재 목표 카메라 위치·거리를 유도하고, camera.position과 controls.target을 함께 lerp한 뒤 매 프레임 controls.update()를 호출했다(셸 OrbitControls가 카메라를 되돌리는 함정 회피). 도착 판정으로 보간을 종료한다. pointer-raycast-hover: 클릭 대상 판별과 커서 피드백. camera-rig: 기본 전체 뷰 구도. standard-scene-setup: 셸 기본.',
  promptExample:
    '크기가 제각각인 전시물을 클릭하면 카메라가 그 앞으로 미끄러져 가는 진열대를 만들어줘. 오브젝트마다 Box3로 크기 재서 거리를 유도해 — 큰 것도 작은 것도 화면 점유율이 같게. camera.position이랑 controls.target을 같이 보간하고 매 프레임 controls.update() 불러줘, 안 그러면 셸 OrbitControls가 카메라를 도로 당겨. 도착하면 보간 멈추고, 빈 곳 클릭하면 전체 뷰로 복귀.',
};
