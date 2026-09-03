import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: 'GPGPU 유동 군집',
  category: 'interactive-art',
  usedSkills: [
    'standard-scene-setup',
    'points-particle-field',
    'gpgpu-simulation',
  ],
  description:
    '65,536개 파티클의 위치와 속도를 부동소수 텍스처에 담고, FBO 핑퐁으로 매 프레임 GPU에서 물리를 갱신한다. 포인터를 따라 끌려오며 흐르지만 CPU는 uniform 몇 개만 쓴다.',
  skillUsage:
    'gpgpu-simulation: 256×256 float 텍스처 두 장(위치·속도)을 WebGLRenderTarget 핑퐁으로 번갈아 렌더하며, 시뮬레이션 셰이더가 속도를 적분하고 포인터 인력·감쇠를 더한다. 상태가 프레임 간 누적되는 구조라 points-particle-field로는 못 하는 것을 GPU에 맡겼다. points-particle-field: 최종 위치 텍스처를 <points> 버텍스 셰이더에서 샘플해 화면 점으로 그린다. CPU는 uPointer·uDelta 유니폼만 갱신한다. standard-scene-setup: 셸 Canvas만.',
  promptExample:
    '65,536개 파티클의 위치·속도를 float 텍스처 두 장에 담고 FBO 핑퐁으로 매 프레임 GPU에서 물리를 갱신하는 GPGPU 군집을 만들어줘. 시뮬 셰이더에서 속도 적분 + 포인터 인력 + 감쇠 계산하고, 최종 위치 텍스처를 <points> 버텍스 셰이더에서 샘플해서 그려. CPU에서는 uPointer랑 uDelta 유니폼만 넘기고 파티클 배열은 절대 CPU에서 순회하지 마. 포인터를 따라 끌려오며 흐르는 느낌으로.',
};
