import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: 'CRT 그레인 비네트',
  category: 'transition-effect',
  usedSkills: ['standard-scene-setup', 'camera-rig', 'bloom-postprocessing', 'custom-effect-pass'],
  a11yLabel:
    "CRT 모니터 느낌의 후처리를 입힌 장면입니다. 화면에 주사선·노이즈·가장자리 어두워짐 효과가 걸려 있고, 가운데 큐브를 클릭하면 효과를 켜고 끄며 원본과 비교할 수 있습니다. 노이즈는 미세하며 큰 밝기 변화나 깜빡임은 없습니다.",
  description:
    "postprocessing의 Effect 클래스를 상속해 만든 커스텀 후처리 패스. 주사선·그레인·비네트·색수차를 한 셰이더에서 렌더된 화면 전체에 건다. 가운데 큐브를 클릭하면 효과가 꺼지고 켜져 '후처리가 걸린 화면'과 '원본'을 직접 대조할 수 있다.",
};
