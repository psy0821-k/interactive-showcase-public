import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '기본 씬 셋업',
  category: 'product-showcase',
  usedSkills: ['standard-scene-setup'],
  description:
    '3점 조명(key/fill/rim)과 표준 카메라 스케일을 적용한 기본 씬. 그림자는 key 라이트 하나만 드리운다.',
  skillUsage:
    'standard-scene-setup: 이 프로젝트 모든 쇼케이스의 최소 기준선. key/fill/rim 3점 조명을 배치하고 key만 castShadow, 오브젝트는 대략 1 유닛 = 1m 스케일에 맞췄다. R3F가 이미 하는 톤매핑·색공간·DPR은 다시 건드리지 않고, <Canvas>는 만들지 않고 Scene과 meta만 export하는 파일 계약을 지켰다.',
  promptExample:
    '이 프로젝트의 표준 씬 셋업만 보여주는 최소 예제를 만들어줘. key/fill/rim 3점 조명 배치하고 key 라이트만 castShadow, 바닥 평면 하나에 오브젝트 몇 개. 스케일은 1 유닛 ≈ 1m. R3F가 이미 하는 톤매핑·색공간·DPR은 건드리지 말고, <Canvas>도 만들지 말고 Scene 컴포넌트랑 meta만 export해.',
};
