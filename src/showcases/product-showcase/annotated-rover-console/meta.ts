import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '주석 달린 로버 콘솔',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'camera-rig',
    'pointer-raycast-hover',
    'html-3d-sync',
  ],
  description:
    '천천히 도는 장비의 각 부위에 drei <Html>로 실제 DOM 라벨을 앵커한다. 부위에 마우스를 올리면 그 라벨만 떠오르고, 부위가 본체 뒤로 돌아가면 occlude가 라벨을 페이드시킨다. distanceFactor로 원근 스케일이 걸려 라벨이 장비에 속한 것처럼 보인다.',
  skillUsage:
    'html-3d-sync: 부위마다 drei <Html position occlude distanceFactor>로 실제 DOM 라벨을 앵커했다. occlude로 본체 뒤 라벨을 페이드시키고, distanceFactor로 원근 스케일을 줘 라벨이 장비에 붙어 보이게 했다. 텍스처가 아닌 진짜 HTML이라 링크·스크린리더가 동작한다. pointer-raycast-hover: 부위 호버 시 해당 라벨만 강조. camera-rig: 콘솔 전체가 담기는 구도. standard-scene-setup: 천천히 도는 회전은 procedural, 셸 기본 조명.',
  promptExample:
    '장비 모델의 각 부위에 drei <Html>로 실제 DOM 라벨을 붙이는 씬을 만들어줘. 장비는 천천히 회전하고, 부위에 마우스 올리면 그 라벨만 떠오르고, 부위가 본체 뒤로 돌아가면 occlude로 라벨이 페이드되게. distanceFactor로 원근 스케일 걸어서 라벨이 장비에 속한 것처럼. 라벨은 텍스처 말고 진짜 HTML이라 링크·선택 가능해야 해.',
};
