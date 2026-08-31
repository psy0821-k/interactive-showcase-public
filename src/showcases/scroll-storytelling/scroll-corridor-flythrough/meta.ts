import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "스크롤 통로 플라이스루",
  category: "scroll-storytelling",
  usedSkills: ["standard-scene-setup", "camera-rig", "scroll-camera-path"],
  description:
    "캔버스 위에서 휠을 굴리면 카메라가 미리 정의된 곡선 경로를 따라 통로 안을 전후진한다. 스크롤 진행률 0~1을 CatmullRomCurve3의 호 길이 매개변수로 넘겨 위치와 시선을 함께 보간한다.",
  // 카메라를 스크롤로 직접 몬다. 셸이 OrbitControls를 렌더하지 않게 한다.
  controlsMode: "none",
};
