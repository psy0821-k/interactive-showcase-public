import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '외곽선 선택 진열대',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'camera-rig',
    'pointer-raycast-hover',
    'bloom-postprocessing',
    'outline-selection',
  ],
  description:
    '천천히 도는 진열대 위 세 오브젝트 중 마우스가 올라간 하나에만 외곽선이 그려진다. 색도 크기도 전혀 바뀌지 않고 선택 표현을 온전히 후처리에 맡기며, 앞 기둥 뒤로 들어간 부분은 xRay 덕분에 어두운 외곽선으로 비쳐 보인다.',
  skillUsage:
    'outline-selection: <EffectComposer> 안 <Outline>과 <Selection>·<Select> 세 컴포넌트가 하나의 컨텍스트로 묶인다. 호버된 오브젝트를 <Select enabled>로 감싸 머티리얼을 건드리지 않고 외곽선만 그리고, xRay 옵션으로 가려진 부분도 비치게 했다. pointer-raycast-hover: 호버 대상 판별. bloom-postprocessing: 같은 컴포저에 Bloom을 얹어 외곽선이 은은히 빛나게 했다. camera-rig: 진열대 구도. standard-scene-setup: 회전은 procedural.',
  promptExample:
    '천천히 도는 진열대 위 오브젝트 3개 중 마우스 올라간 하나에만 외곽선을 그리는 씬을 만들어줘. 색·크기는 절대 안 바꾸고 선택 표현을 전부 후처리에 맡겨. drei <EffectComposer> 안에서 <Selection> + <Select enabled> + <Outline> 묶고, xRay 켜서 앞 기둥 뒤로 들어간 부분도 어두운 외곽선으로 비치게. 같은 컴포저에 Bloom도 얹어서 외곽선이 은은하게 빛나게.',
};
