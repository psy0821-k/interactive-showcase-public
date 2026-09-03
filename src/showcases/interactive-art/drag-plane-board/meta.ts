import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '드래그 보드',
  category: 'interactive-art',
  usedSkills: [
    'standard-scene-setup',
    'camera-rig',
    'pointer-raycast-hover',
    'drag-controls',
  ],
  description:
    '말 세 개를 끌어서 옮긴다. 화면의 2D 포인터를 카메라를 향한 평면에 투영해 3D 위치로 되돌리고, 잡은 순간의 오프셋을 기억해 순간이동을 막는다. 자유 이동·축 고정·영역 제약 세 가지 제약 방식을 나란히 놓았다.',
  skillUsage:
    'drag-controls: onPointerDown에서 raycaster.ray.intersectPlane()으로 카메라를 향한 기준 평면과의 교점을 구하고, 말의 현재 위치와의 오프셋을 저장해 드래그 시작 시 순간이동을 막았다(핵심 함정). 세 말은 각각 제약 함수(자유/축 고정/Box 클램프)를 통해 목표 위치를 보정한다. pointer-raycast-hover: 잡을 수 있는 말에 커서 피드백을 준다. camera-rig: 보드가 정면으로 보이는 고정 구도. 드래그 중 셸 OrbitControls는 stopPropagation으로 억제한다.',
  promptExample:
    '체스 말 세 개를 마우스로 끌어서 옮기는 씬을 만들어줘. 2D 포인터를 카메라 향한 평면에 raycaster.ray.intersectPlane()으로 투영해서 3D 위치로 되돌리고, 잡은 순간의 오프셋을 기억해서 클릭하자마자 말이 커서로 순간이동하지 않게 해줘. 세 말에 각각 다른 제약을 걸어줘 — 하나는 자유 이동, 하나는 X축만, 하나는 사각 영역 안으로 클램프. 드래그 중엔 OrbitControls 안 돌아가게 stopPropagation.',
};
