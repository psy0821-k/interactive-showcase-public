import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "LOD 디테일 필드",
  category: "environment-world",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "procedural-geometry",
    "lod-and-frustum",
  ],
  description:
    "같은 자리에 놓인 기둥 60개가 카메라 거리에 따라 고·중·저 디테일로 갈아탄다. 단계마다 색이 달라 전환 순간이 눈에 보이고, 화면 위 계기가 드로우콜과 삼각형 수를 실시간으로 보여준다. 줌아웃하면 삼각형이 줄고, 카메라를 돌려 오브젝트가 화면 밖으로 나가면 프러스텀 컬링이 드로우콜까지 깎아낸다.",
};
