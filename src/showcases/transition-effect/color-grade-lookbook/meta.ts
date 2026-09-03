import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '색보정 룩북',
  category: 'transition-effect',
  usedSkills: [
    'standard-scene-setup',
    'bloom-postprocessing',
    'color-grading-lut',
  ],
  a11yLabel:
    '색보정 프리셋을 비교하는 장면입니다. 같은 장면에 여섯 가지 색감 프리셋을 번갈아 적용해 톤과 채도 차이를 보여줍니다. 프리셋 전환은 서서히 이루어지며 급격한 밝기 변화나 깜빡임은 없습니다.',
  description:
    '같은 씬(회색 배경판 + 채색 소품 + 은은한 발광 막대)에 색보정 체인을 바꿔 얹어 룩 프리셋 6종을 비교한다. 체인은 <Bloom>(고정) → <ToneMapping>(프리셋별 mode) → <HueSaturation> → <BrightnessContrast> 순서이고, LUT 프리셋에서만 절차 생성한 warm-film.cube가 <LUT>로 추가된다. <EffectComposer>는 정확히 1개 — 프리셋 전환은 컴포저를 다시 만드는 게 아니라 자식 Effect를 갈아끼우는 방식이다. AGX와 ACES를 번갈아 보면 발광 막대 하이라이트에서 톤매핑 커브 차이가 드러난다.',
  skillUsage:
    'color-grading-lut: <EffectComposer> 하나 안에서 Bloom → ToneMapping → HueSaturation → BrightnessContrast 순서를 지켰다(체인 순서가 룩의 절반). ToneMapping mode(AGX/ACES/…)를 프리셋별로 바꾸고, LUT 프리셋에서만 절차 생성한 .cube를 <LUT>로 추가한다. 프리셋 전환은 컴포저 재생성이 아니라 자식 Effect 교체다. bloom-postprocessing: Bloom은 항상 체인 맨 앞. standard-scene-setup: 발광 막대는 HDR 색, 셸 기본.',
  promptExample:
    '같은 씬에 색보정 체인을 바꿔 얹어 룩 프리셋 6종을 비교하는 씬을 만들어줘. 체인은 <Bloom>(고정) → <ToneMapping>(프리셋별 mode) → <HueSaturation> → <BrightnessContrast> 순서 꼭 지켜. LUT 프리셋에서만 절차 생성한 .cube를 <LUT>로 추가하고. <EffectComposer>는 정확히 1개 — 프리셋 전환은 컴포저 다시 만들지 말고 자식 Effect만 갈아끼워. 발광 막대 하나 놔서 AGX vs ACES 하이라이트 차이가 보이게. a11yLabel도 채워줘.',
};
