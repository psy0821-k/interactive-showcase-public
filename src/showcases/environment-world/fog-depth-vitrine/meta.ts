import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '안개 깊이 진열대',
  category: 'environment-world',
  usedSkills: [
    'standard-scene-setup',
    'fog-and-atmosphere',
    'pointer-raycast-hover',
  ],
  description:
    "z축으로 늘어선 아치 12개가 카메라에서 멀어질수록 안개 색으로 사라진다. 배경색과 fog 색이 같은 상수(FOG_COLOR)를 공유해 원경이 '실루엣'이 아니라 '사라짐'으로 보인다 — fog의 1번 규칙. 씬 안 3D 버튼을 클릭하면 THREE.Fog(선형, near~far)와 THREE.FogExp2(지수, density)가 번갈아 적용되고, 계기판이 현재 모드와 활성 파라미터를 표시한다. 카메라는 좌우로 아주 느리게 스윙해 열을 여러 각도에서 보여준다(prefers-reduced-motion이면 정지).",
  skillUsage:
    "fog-and-atmosphere: FOG_COLOR 상수 하나를 scene.background와 fog 색에 함께 물려 '실루엣'이 아니라 '사라짐'이 되게 했다(핵심 함정 회피). <fog>와 <fogExp2>를 토글로 갈아끼우고 near/far·density를 계기판에 노출한다. pointer-raycast-hover: 씬 안 3D 버튼을 raycast 클릭으로 토글한다. standard-scene-setup: 조명·카메라는 셸 기본, 좌우 스윙은 useFrame에서 delta 기반으로 돌리되 useReducedMotion이면 멈춘다.",
  promptExample:
    'z축으로 아치를 12개 늘어놓고 카메라에서 멀어질수록 안개에 묻혀 사라지는 씬을 만들어줘. 중요한 건 배경색과 fog 색을 같은 상수로 공유하는 거야 — 안 그러면 원경이 실루엣으로 떠 보여. 씬 안에 3D 버튼을 하나 놓고 클릭하면 선형 fog(near/far)와 지수 fogExp2(density)가 번갈아 걸리게. 계기판에 현재 모드와 파라미터 값 표시하고. 카메라는 좌우로 아주 느리게 스윙하되 prefers-reduced-motion이면 정지시켜줘.',
};
