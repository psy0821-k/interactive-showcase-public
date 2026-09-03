import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '호버 하이라이트 그리드',
  category: 'interactive-art',
  usedSkills: ['standard-scene-setup', 'camera-rig', 'pointer-raycast-hover'],
  description:
    '포인터가 올라간 큐브 하나만 떠오르며 빛난다. 3D에서 오브젝트는 기본적으로 포인터에 투명하므로, 겹친 오브젝트를 가리려면 stopPropagation이 필요하다는 점을 앞줄에 놓인 판으로 드러낸다.',
  skillUsage:
    "pointer-raycast-hover: 각 큐브의 onPointerOver/onPointerOut로 hovered 인덱스를 관리하고, 그 큐브만 position.y와 emissiveIntensity를 올린다. 3D 오브젝트는 기본적으로 포인터 이벤트가 뒤로 관통하므로, 앞줄 판에 onPointerOver에서 e.stopPropagation()을 걸어 '가림'을 만들었다(핵심 함정 시연). camera-rig: 그리드가 정면으로 담기는 구도. standard-scene-setup: 셸 기본 조명·Canvas.",
  promptExample:
    '큐브를 격자로 깔고, 포인터가 올라간 하나만 떠오르며 빛나는 씬을 만들어줘. onPointerOver/Out로 hovered 인덱스 관리하고 그 큐브만 y로 띄우고 emissive 올려. 그리고 앞줄에 판을 하나 놓고 거기 onPointerOver에서 e.stopPropagation() 걸어서, 3D에서는 이걸 안 하면 뒤 오브젝트까지 같이 반응한다는 걸 보여줘. 카메라는 그리드 정면으로.',
};
