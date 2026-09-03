import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "오로라 셰이더 배경",
  category: "immersive-background",
  usedSkills: ["standard-scene-setup", "fullscreen-shader-plane"],
  description:
    "화면을 채우는 평면에 프래그먼트 셰이더로 그린 오로라. 포인터를 따라 빛무리가 움직인다.",
  skillUsage:
    "fullscreen-shader-plane: drei shaderMaterial로 만든 재질을 카메라 앞 화면 크기 평면에 붙이고, uTime·uResolution·uPointer 유니폼을 useFrame에서 갱신했다. 셰이더는 도메인 워프 노이즈로 오로라 커튼을 그리고 uPointer 주변에 밝기를 더한다. extend로 커스텀 재질을 R3F에 등록하고, 평면은 depthWrite=false로 배경에 고정했다. standard-scene-setup: 조명은 쓰지 않고(픽셀 색은 전부 셰이더 계산) 셸 Canvas만 사용했다.",
  promptExample:
    "화면 전체를 채우는 평면에 프래그먼트 셰이더로 오로라를 그려줘. 도메인 워프 노이즈로 커튼 모양 만들고, 포인터 위치를 유니폼으로 넘겨서 커서 주변에 빛무리가 따라오게. drei shaderMaterial + extend로 등록하고 uTime·uResolution·uPointer는 useFrame에서 갱신. 평면은 카메라 앞에 화면 크기로 고정하고 depthWrite=false로 배경 처리해줘.",
};
