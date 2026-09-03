import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "에셋 예산: 구름",
  category: "data-visualization",
  usedSkills: ["asset-optimization", "gltf-model-loading", "hdri-environment"],
  description:
    "asset-optimization 파이프라인이 실제로 먹었는지를 씬이 숫자로 보여준다. cloud.glb 71.3MB → cloud-opt.glb 5.4MB(Draco + 1024/WebP), classroom.hdr 93.7MB → classroom-1k.hdr 2.0MB(RGBELoader 다운샘플). 계기판은 원본/최적화 크기를 나란히 두고, gl.info.memory의 geometries·textures와 gl.info.render의 삼각형·드로우콜을 실시간으로 갱신한다. Draco 디코더는 public/draco/ 자체 호스팅 — useGLTF의 두 번째 인자로 경로를 준다(gltf-model-loading 6절).",
  skillUsage:
    "asset-optimization: gltf-transform으로 원본 glb에 Draco 압축·텍스처 1024 리사이즈·WebP 변환을 걸고, HDR은 RGBELoader로 받아 1K로 다운샘플한 뒤 setDataType(THREE.FloatType)으로 값 범위를 고정했다. gltf-model-loading: useGLTF에 자체 호스팅 Draco 디코더 경로(public/draco/)를 두 번째 인자로 넘겨 CDN 의존 없이 디코드하고, <Suspense>로 로딩 경계를 잡았다. hdri-environment: <Environment files>로 다운샘플한 hdr을 IBL로 걸어 구름 표면 반사를 만들었다. 계기판 수치는 gl.info.memory·gl.info.render를 useFrame에서 ref로 읽어 setState 없이 갱신한다.",
  promptExample:
    "무거운 glb 모델(구름)과 HDR 환경맵을 최적화 전/후로 비교하는 데이터 시각화 씬을 만들어줘. gltf-transform으로 Draco 압축 + 텍스처 1024 + WebP를 적용하고, HDR은 1K로 다운샘플하되 다운샘플 후 값이 뻥튀기되지 않게 FloatType을 꼭 설정해줘. Draco 디코더는 CDN 말고 public/draco/에 자체 호스팅해서 useGLTF 두 번째 인자로 경로를 넘기고. 화면 위 계기판에 원본/최적화 파일 크기, gl.info.memory의 geometries·textures 개수, 드로우콜·삼각형 수를 실시간으로 띄워줘. 계기판 갱신은 useFrame 안에서 ref로 하고 setState는 쓰지 마.",
};
