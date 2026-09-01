import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "피사계 심도 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "bloom-postprocessing",
    "depth-of-field-focus",
  ],
  a11yLabel:
    "피사계 심도를 보여주는 장면입니다. 앞뒤로 늘어선 제품 세 개 중 초점이 맞은 하나만 선명하고 나머지는 흐려지며, 뒤쪽 불빛은 둥근 보케로 번집니다. 마우스 초점과 디버그 표시를 토글로 켤 수 있습니다.",
  description:
    "카메라에서 z축으로 늘어선 제품 3개 중 초점 대상만 선명하고 나머지는 흐려진다(bokeh). 뒤쪽 발광 점은 초점이 안 맞을수록 큰 원형 보케로 커진다. <Autofocus>의 target을 useRef<Vector3>로 들고 useFrame에서 lerp해 초점 대상을 부드럽게 전환한다 — setState를 쓰지 않아 전환 중 리렌더가 0이다. 체인 순서는 Bloom → DoF → ToneMapping: DoF가 톤매핑 앞이라 HDR 값에서 블러해 보케 하이라이트가 밝게 남는다. '마우스 초점' 토글은 depth picking으로 커서가 가리키는 표면에 자동 초점, 'debug' 토글은 초점 지점에 녹색 구를 띄운다.",
};
