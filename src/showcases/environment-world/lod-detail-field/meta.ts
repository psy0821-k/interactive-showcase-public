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
  skillUsage:
    "lod-and-frustum: 기둥마다 <Detail> 3단계(고/중/저 세그먼트)를 THREE.LOD로 묶어 카메라 거리에 따라 자동 전환하고, 단계별로 다른 색을 줘 전환이 보이게 했다. 프러스텀 컬링은 three 기본 동작이라 별도 코드 없이 계기판 드로우콜로 효과를 드러낸다. procedural-geometry: 세 디테일 단계의 실린더 지오메트리를 세그먼트 수만 다르게 코드로 생성했다. camera-rig: 줌 범위가 LOD 전환 거리를 모두 지나도록 min/maxDistance를 잡았다. 계기판은 gl.info.render를 useFrame에서 읽는다.",
  promptExample:
    "기둥 60개를 같은 자리에 세워두고, 카메라 거리에 따라 고/중/저 디테일로 자동으로 갈아타는 LOD 씬을 만들어줘. THREE.LOD(drei <Detailed>)로 3단계 묶고, 단계마다 색을 다르게 해서 전환 순간이 눈에 보이게. 세 단계 지오메트리는 실린더 세그먼트 수만 다르게 코드로 생성하고. 화면 위에 드로우콜·삼각형 수 계기판 띄워서, 줌아웃하면 삼각형 줄고 카메라 돌려서 화면 밖으로 나가면 프러스텀 컬링으로 드로우콜까지 떨어지는 걸 보여줘.",
};
