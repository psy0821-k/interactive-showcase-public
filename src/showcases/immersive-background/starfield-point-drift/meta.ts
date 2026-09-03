import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '표류하는 별먼지 필드',
  category: 'immersive-background',
  usedSkills: [
    'standard-scene-setup',
    'fullscreen-shader-plane',
    'points-particle-field',
  ],
  description:
    '포인트 셰이더로 그린 12,000개의 별먼지. 깊이 방향으로 길게 뻗어 있어 카메라를 앞뒤로 움직이면 sizeAttenuation에 따라 가까운 입자는 커지고 먼 입자는 작아진다.',
  skillUsage:
    'points-particle-field: BufferGeometry에 12,000개 position 속성을 깊이 방향으로 길게 흩뿌리고 <points>로 드로우콜 1개에 렌더했다. PointsMaterial의 sizeAttenuation을 켜 원근에 따라 점 크기가 변하게 했다. fullscreen-shader-plane: 뒤 배경은 화면 평면 셰이더로 은은한 성운 그라디언트를 깔았다. 표류는 useFrame에서 geometry position을 미세하게 갱신하거나 group을 천천히 회전시켜 준다. standard-scene-setup: 조명 없이 셸 Canvas만.',
  promptExample:
    '별먼지 12,000개를 <points> 하나로 그려줘. 깊이 방향으로 길게 뻗게 뿌리고, PointsMaterial sizeAttenuation 켜서 카메라를 앞뒤로 움직이면 가까운 입자는 커지고 먼 입자는 작아지게. 뒤에 화면 평면 셰이더로 은은한 성운 그라디언트 깔고. 전체가 아주 느리게 표류하도록 group을 회전시켜줘. 드로우콜은 1개 유지.',
};
