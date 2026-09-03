import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "그림자 품질 진열대",
  category: "environment-world",
  usedSkills: ["standard-scene-setup", "shadow-setup"],
  description:
    "directionalLight 그림자의 3대 아티팩트 — 표면 줄무늬(acne), 씬 일부에서 끊기는 frustum 잘림, 계단처럼 각진 가장자리 — 를 한 화면에서 동시에 노출하고, 클릭 한 번으로 교정값을 적용해 대조한다. broken 세트는 bias=0 / mapSize=512 / shadow-camera 기본(±5), fixed 세트는 normalBias=0.035 / mapSize=2048 / 씬에 맞춘 frustum. fixed에서는 노란 CameraHelper 와이어프레임이 그림자 카메라 절두체를 그려 frustum이 씬을 감싸는지 눈으로 확인시킨다.",
  skillUsage:
    "shadow-setup: broken/fixed 두 프로파일을 토글로 전환한다. broken은 bias=0·mapSize=512·기본 frustum이라 acne·잘림·계단이 다 나오고, fixed는 normalBias=0.035·mapSize=2048에 shadow-camera-{left,right,top,bottom}을 씬 크기에 맞춰 좁혔다(계단은 frustum 먼저, mapSize 나중이라는 순서 준수). CameraHelper로 그림자 카메라 절두체를 와이어프레임으로 그려 씬을 감싸는지 확인시킨다. standard-scene-setup: 그 외는 셸 기본.",
  promptExample:
    "directionalLight 그림자의 3대 아티팩트(표면 줄무늬 acne, frustum 잘림, 계단 가장자리)를 한 화면에서 동시에 보여주고, 토글로 교정 전/후를 대조하는 씬을 만들어줘. broken은 bias=0, mapSize=512, shadow-camera 기본으로 두고 fixed는 normalBias=0.035, mapSize=2048, shadow-camera 범위를 씬 크기에 딱 맞춰 좁혀줘. 계단 잡을 땐 frustum 먼저 좁히고 mapSize는 그 다음에. fixed에서 CameraHelper로 그림자 카메라 절두체를 노란 와이어프레임으로 그려서 씬을 감싸는지 보이게 해줘.",
};
