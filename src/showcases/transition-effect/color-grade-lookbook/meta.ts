import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "색보정 룩북",
  category: "transition-effect",
  usedSkills: [
    "standard-scene-setup",
    "bloom-postprocessing",
    "color-grading-lut",
  ],
  description:
    "같은 씬(회색 배경판 + 채색 소품 + 은은한 발광 막대)에 색보정 체인을 바꿔 얹어 룩 프리셋 6종을 비교한다. 체인은 <Bloom>(고정) → <ToneMapping>(프리셋별 mode) → <HueSaturation> → <BrightnessContrast> 순서이고, LUT 프리셋에서만 절차 생성한 warm-film.cube가 <LUT>로 추가된다. <EffectComposer>는 정확히 1개 — 프리셋 전환은 컴포저를 다시 만드는 게 아니라 자식 Effect를 갈아끼우는 방식이다. AGX와 ACES를 번갈아 보면 발광 막대 하이라이트에서 톤매핑 커브 차이가 드러난다.",
};
