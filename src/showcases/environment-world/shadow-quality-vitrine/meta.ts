import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "그림자 품질 진열대",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "shadow-setup"],
  description:
    "directionalLight 그림자의 3대 아티팩트 — 표면 줄무늬(acne), 씬 일부에서 끊기는 frustum 잘림, 계단처럼 각진 가장자리 — 를 한 화면에서 동시에 노출하고, 클릭 한 번으로 교정값을 적용해 대조한다. broken 세트는 bias=0 / mapSize=512 / shadow-camera 기본(±5), fixed 세트는 normalBias=0.035 / mapSize=2048 / 씬에 맞춘 frustum. fixed에서는 노란 CameraHelper 와이어프레임이 그림자 카메라 절두체를 그려 frustum이 씬을 감싸는지 눈으로 확인시킨다.",
};
