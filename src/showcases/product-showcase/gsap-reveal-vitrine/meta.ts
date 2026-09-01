import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "GSAP 등장 연출 진열대",
  category: "product-showcase",
  usedSkills: [
    "standard-scene-setup",
    "gsap-r3f-integration",
    "gsap-timeline-sequence",
  ],
  description:
    "GSAP 타임라인으로 진열대·제품·라벨을 순서대로 등장시키는 예제. useGsapScene 훅이 온디맨드 렌더와 모션 축소를 처리하고, 모션 축소 시에는 타임라인을 만들지 않고 최종 상태만 찍는다.",
  frameloop: "always",
  track: "gsap",
};
