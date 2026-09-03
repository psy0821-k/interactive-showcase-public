import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "스크롤 통로 플라이스루",
  category: "scroll-storytelling",
  usedSkills: ["standard-scene-setup", "camera-rig", "scroll-camera-path"],
  description:
    "캔버스 위에서 휠을 굴리면 카메라가 미리 정의된 곡선 경로를 따라 통로 안을 전후진한다. 스크롤 진행률 0~1을 CatmullRomCurve3의 호 길이 매개변수로 넘겨 위치와 시선을 함께 보간한다.",
  // 카메라를 스크롤로 직접 몬다. 셸이 OrbitControls를 렌더하지 않게 한다.
  controlsMode: "none",
  skillUsage:
    "scroll-camera-path: CatmullRomCurve3로 통로를 관통하는 경로를 만들고, 스크롤 진행률 0~1을 getPointAt(호 길이 매개변수)에 넘겨 등속으로 이동시켰다. 위치와 함께 조금 앞 지점을 lookAt해 시선도 보간한다. 셸 OrbitControls와 카메라 소유권이 충돌하지 않게 meta.controlsMode를 'none'으로 옵트인했다. camera-rig: 경로 시작 FOV·near/far. standard-scene-setup: 통로 지오메트리·조명은 셸 기본 위에.",
  promptExample:
    "캔버스 위에서 휠을 굴리면 카메라가 곡선 경로를 따라 통로를 전후진하는 씬을 만들어줘. CatmullRomCurve3로 통로 관통 경로 만들고, 스크롤 진행률 0~1을 getPointAt(호 길이)에 넘겨서 등속 이동. 위치보다 조금 앞 지점을 lookAt해서 시선도 같이 보간. 카메라를 직접 모니까 meta.controlsMode를 'none'으로 해서 셸이 OrbitControls 안 그리게.",
};
