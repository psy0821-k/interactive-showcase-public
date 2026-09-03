import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '탑다운 카메라 리그',
  category: 'environment-world',
  usedSkills: ['standard-scene-setup', 'camera-rig'],
  description:
    '위에서 내려다보는 구도가 씬의 본질인 경우. 기본 카메라(z=5, fov 75)로는 담기지 않아 makeDefault로 교체했다.',
  skillUsage:
    "camera-rig: '기본은 카메라를 안 건드리고 콘텐츠를 맞춘다'는 원칙의 예외 케이스다. 탑다운이 씬의 본질이라 <PerspectiveCamera makeDefault position={[0, y, 0]} />로 셸 기본 카메라를 교체하고, near/far 비율을 좁게 잡아 z-fighting을 피했다. standard-scene-setup: 그 외 조명·스케일·파일 계약은 셸 기본을 그대로 따르고 Scene 노드만 export했다.",
  promptExample:
    '위에서 수직으로 내려다보는 탑다운 구도가 필수인 씬을 만들어줘. 셸 기본 카메라(z=5, fov 75)로는 안 담기니까 makeDefault로 카메라를 교체해줘. near/far는 너무 벌리지 말고 좁게 잡아서 z-fighting 안 나게. 콘텐츠는 바닥 격자 위에 오브젝트 몇 개면 충분하고, 조명·스케일은 표준 셋업 그대로 둬.',
};
