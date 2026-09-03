import type { ShowcaseMeta } from '@/domain/showcase';

export const meta: ShowcaseMeta = {
  title: '공간 타이포그래피 보드',
  category: 'text-typography',
  usedSkills: ['standard-scene-setup', 'sdf-text-rendering'],
  description:
    'drei <Text>(troika SDF)의 네 가지 쓰임을 한 화면에 모았다 — (1) 씬 상단 헤드라인은 outlineWidth로 복잡한 배경 위에서 읽힌다, (2) 뒤 오브젝트 3개(구·큐브·원기둥)의 이름표는 <Billboard>로 감싸 카메라가 회전해도 정면을 유지한다, (3) 같은 위치의 고정 라벨 하나는 Billboard 없이 두어 각도가 틀어지면 안 읽히는 대조를 보여준다, (4) maxWidth로 줄바꿈된 본문과 매 프레임 갱신되는 계기판(SceneReadout — ref로 .text 직접 갱신, setState 없음). 폰트는 Pretendard 서브셋 WOFF2 자체 호스팅(CDN Roboto 의존 없음). 카메라는 좌우로 아주 느리게 스윙한다(prefers-reduced-motion이면 정지).',
  skillUsage:
    "sdf-text-rendering: drei <Text>(troika SDF)를 헤드라인·이름표·본문·계기판 4용도로 썼다. Troika는 WOFF2를 못 읽으므로(핵심 함정) 폰트 빌드 시 targetFormat: 'woff'로 만든 Pretendard 서브셋을 자체 호스팅했다. 헤드라인은 outlineWidth로 배경 위 가독성 확보, 이름표는 <Billboard>로 정면 유지, 계기판은 <SceneReadout> 래퍼로 ref .text를 직접 갱신(setState 없음). standard-scene-setup: 스윙은 procedural, reduced-motion이면 정지.",
  promptExample:
    'drei <Text>(troika SDF)의 네 가지 쓰임을 한 화면에 모은 타이포그래피 보드를 만들어줘 — (1) outlineWidth로 배경 위에서 읽히는 헤드라인 (2) <Billboard>로 감싸 카메라 회전에도 정면 유지하는 이름표 (3) Billboard 없이 둬서 각도 틀어지면 안 읽히는 대조 라벨 (4) maxWidth 줄바꿈 본문 + 매 프레임 갱신 계기판. 계기판은 ref로 .text 직접 갱신하고 setState 쓰지 마. Troika는 WOFF2 못 읽으니 폰트는 woff로 빌드한 Pretendard 서브셋 자체 호스팅. CDN Roboto 의존 없이. 카메라 좌우 스윙, reduced-motion이면 정지.',
};
