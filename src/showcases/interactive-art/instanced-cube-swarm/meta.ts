import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '인스턴스 큐브 군집',
  category: 'interactive-art',
  usedSkills: [
    'standard-scene-setup',
    'instanced-particles',
    'responsive-canvas',
  ],
  description:
    '4000개의 큐브가 InstancedMesh 하나로 그려진다. 인스턴스마다 다른 궤도·회전·색을 갖지만 드로우콜은 1이다. 더미 Object3D로 행렬을 만들고 매 프레임 instanceMatrix.needsUpdate를 세우는 것이 전부다.',
  skillUsage:
    'instanced-particles: <instancedMesh args={[geo, mat, 4000]} />에 더미 Object3D를 재사용해 매 프레임 각 인스턴스의 위치·회전을 계산하고 setMatrixAt → instanceMatrix.needsUpdate = true. 색은 setColorAt으로 한 번만. 카메라를 돌리면 군집이 사라지는 것을 막으려 computeBoundingSphere를 갱신한다(핵심 함정). responsive-canvas: 화면이 좁으면 인스턴스 수를 줄인다. standard-scene-setup: 셸 기본.',
  promptExample:
    '큐브 4000개를 InstancedMesh 하나로 그려줘. 인스턴스마다 다른 궤도·회전·색 갖고, 더미 Object3D 재사용해서 매 프레임 setMatrixAt + instanceMatrix.needsUpdate. 색은 setColorAt으로 초기에 한 번만. 카메라 돌렸을 때 군집이 통째로 사라지지 않게 boundingSphere 갱신해줘. 화면 좁으면 개수 줄이고. 드로우콜 1개 유지.',
};
