import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "외곽선 선택 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "pointer-raycast-hover",
    "bloom-postprocessing",
    "outline-selection",
  ],
  description:
    "천천히 도는 진열대 위 세 오브젝트 중 마우스가 올라간 하나에만 외곽선이 그려진다. 색도 크기도 전혀 바뀌지 않고 선택 표현을 온전히 후처리에 맡기며, 앞 기둥 뒤로 들어간 부분은 xRay 덕분에 어두운 외곽선으로 비쳐 보인다.",
};
