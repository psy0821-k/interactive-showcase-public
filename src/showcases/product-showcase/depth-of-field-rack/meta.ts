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
  skillUsage:
    "depth-of-field-focus: focusDistance가 정규화 [0,1]이라 직관적이지 않은 문제를 <Autofocus target>으로 우회했다. target을 useRef<Vector3>로 들고 useFrame에서 lerp해 초점 전환 중 리렌더 0. '마우스 초점'은 depth picking으로 커서 표면을 target으로. bloom-postprocessing: 같은 <EffectComposer> 안에서 Bloom → DoF → ToneMapping 순서를 지켜 DoF가 HDR 값에서 블러하게 했다(보케 하이라이트가 밝게 남음). standard-scene-setup: 셸 기본.",
  promptExample:
    "카메라에서 z축으로 제품 3개를 늘어놓고 초점 맞은 하나만 선명, 나머지는 흐려지는 DoF 진열대를 만들어줘. 뒤쪽에 발광 점 몇 개 놔서 초점 안 맞을 때 큰 원형 보케로 번지게. focusDistance 직접 만지지 말고 <Autofocus target> 쓰고, target은 useRef<Vector3>로 들고 useFrame에서 lerp — setState 금지. 이펙트 체인은 Bloom → DoF → ToneMapping 순서 꼭 지켜서 DoF가 HDR에서 블러하게. '마우스 초점' 토글은 depth picking, 'debug'는 초점 지점에 녹색 구.",
};
