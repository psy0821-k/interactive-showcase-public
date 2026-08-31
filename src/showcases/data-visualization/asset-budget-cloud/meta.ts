import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "에셋 예산: 구름",
  category: "data-visualization",
  usedSkills: ["asset-optimization", "gltf-model-loading", "hdri-environment"],
  description:
    "asset-optimization 파이프라인이 실제로 먹었는지를 씬이 숫자로 보여준다. cloud.glb 71.3MB → cloud-opt.glb 5.4MB(Draco + 1024/WebP), classroom.hdr 93.7MB → classroom-1k.hdr 2.0MB(RGBELoader 다운샘플). 계기판은 원본/최적화 크기를 나란히 두고, gl.info.memory의 geometries·textures와 gl.info.render의 삼각형·드로우콜을 실시간으로 갱신한다. Draco 디코더는 public/draco/ 자체 호스팅 — useGLTF의 두 번째 인자로 경로를 준다(gltf-model-loading 6절).",
};
