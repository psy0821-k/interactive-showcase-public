import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: 'GSAP 등장 연출 진열대',
  category: 'product-showcase',
  usedSkills: [
    'standard-scene-setup',
    'gsap-r3f-integration',
    'gsap-timeline-sequence',
  ],
  description:
    'GSAP 타임라인으로 진열대·제품·라벨을 순서대로 등장시키는 예제. useGsapScene 훅이 온디맨드 렌더와 모션 축소를 처리하고, 모션 축소 시에는 타임라인을 만들지 않고 최종 상태만 찍는다.',
  frameloop: 'always',
  track: 'gsap',
  skillUsage:
    "gsap-r3f-integration: useGSAP + 재사용 훅 useGsapScene으로 scope를 잡아 언마운트 시 트윈이 자동 revert되게 했다. GSAP는 R3F 바깥에서 값을 바꾸므로 frameloop를 'always'로 옵트인했다. gsap-timeline-sequence: gsap.timeline({ defaults })로 진열대→제품→라벨을 position parameter·라벨로 엮고, 3D 객체는 셀렉터가 아니라 ref 객체를 직접 넘겼다. rotation은 라디안. useReducedMotion이면 타임라인을 만들지 않고 gsap.set으로 최종 상태만 찍는다. standard-scene-setup: 셸 기본.",
  promptExample:
    "GSAP 타임라인으로 진열대 → 제품 → 라벨을 순서대로 등장시키는 R3F 씬을 만들어줘. useGSAP + useGsapScene 훅으로 scope 잡아서 상세 페이지 오갈 때 트윈이 자동 정리되게. 3D 객체는 셀렉터 말고 ref 직접 넘기고, rotation은 라디안. GSAP는 R3F 바깥에서 값 바꾸니까 meta.frameloop를 'always'로. prefers-reduced-motion이면 타임라인 아예 만들지 말고 gsap.set으로 최종 상태만 찍어. meta.track은 'gsap'.",
};
