import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: 'CRT 그레인 비네트',
  category: 'transition-effect',
  usedSkills: [
    'standard-scene-setup',
    'camera-rig',
    'bloom-postprocessing',
    'custom-effect-pass',
  ],
  a11yLabel:
    'CRT 모니터 느낌의 후처리를 입힌 장면입니다. 화면에 주사선·노이즈·가장자리 어두워짐 효과가 걸려 있고, 가운데 큐브를 클릭하면 효과를 켜고 끄며 원본과 비교할 수 있습니다. 노이즈는 미세하며 큰 밝기 변화나 깜빡임은 없습니다.',
  description:
    "postprocessing의 Effect 클래스를 상속해 만든 커스텀 후처리 패스. 주사선·그레인·비네트·색수차를 한 셰이더에서 렌더된 화면 전체에 건다. 가운데 큐브를 클릭하면 효과가 꺼지고 켜져 '후처리가 걸린 화면'과 '원본'을 직접 대조할 수 있다.",
  skillUsage:
    'custom-effect-pass: postprocessing의 Effect를 상속해 mainImage() 함수 하나만 작성했다(전체 셰이더 아님, main() 직접 선언 금지). 화면을 통째로 대체하는 효과라 blendFunction을 BlendFunction.SRC로 명시했다(기본 NORMAL이면 절반만 걸림). Effect 인스턴스는 useMemo로 한 번만 만들고 uniform은 .value로 갱신해 재컴파일을 피했다. <primitive object={effect} />로 <EffectComposer>에 넣는다. bloom-postprocessing: 같은 컴포저에 Bloom. camera-rig / standard-scene-setup: 기본.',
  promptExample:
    'postprocessing의 Effect 클래스를 상속해 CRT 느낌(주사선·그레인·비네트·색수차)을 화면 전체에 거는 커스텀 후처리 패스를 만들어줘. 전체 프래그먼트 셰이더 말고 mainImage() 함수 하나만 쓰고 main()은 직접 선언하지 마. 화면을 통째로 대체하니까 blendFunction을 BlendFunction.SRC로 명시 — 기본 NORMAL이면 반만 걸려. Effect 인스턴스는 useMemo로 한 번만 만들고 값 바뀌면 uniforms.get(...).value만 갱신, 재생성 금지. 가운데 큐브 클릭하면 효과 on/off로 원본이랑 대조. a11yLabel도.',
};
