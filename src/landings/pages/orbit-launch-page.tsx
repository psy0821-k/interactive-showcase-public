'use client';

import { LandingShell, LandingSection, LandingCard } from '../landing-shell';
import { findLanding } from '../registry';
import { OrbitLaunchScene } from '../scenes/orbit-launch-scene';
import { UiMock } from '../ui-mock';

const ROADMAP = [
  {
    phase: '베타',
    body: '초대받은 팀만. 새 협업 엔진을 실사용 부하에서 검증합니다.',
  },
  {
    phase: 'RC',
    body: '누구나 가입. 데이터 마이그레이션 도구와 API가 공개됩니다.',
  },
  {
    phase: '정식 출시',
    body: 'SLA 보장, 온프레미스 옵션, 전담 지원이 함께 시작됩니다.',
  },
];

export function OrbitLaunchPage() {
  const entry = findLanding('orbit-launch')!;
  return (
    <LandingShell
      entry={entry}
      renderScene={(ctx) => <OrbitLaunchScene {...ctx} />}
    >
      <LandingSection align="center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-300">
          Fluxnote Launch
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          다음 궤도로 올라갑니다
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          스크롤하며 출시 로드맵을 따라오세요.
        </p>
      </LandingSection>

      {ROADMAP.map((step) => (
        <LandingSection key={step.phase} align="end">
          <LandingCard className="ml-auto max-w-md">
            <UiMock
              kind="roadmap"
              accent="#a5b4fc"
              className="mb-5 aspect-[16/10]"
            />
            <p className="text-sm font-medium uppercase tracking-widest text-indigo-300">
              {step.phase}
            </p>
            <p className="mt-3 text-lg text-white/80">{step.body}</p>
          </LandingCard>
        </LandingSection>
      ))}

      <LandingSection align="center">
        <h2 className="text-3xl font-semibold">베타 대기자 명단에 등록</h2>
        <p className="mt-4 text-white/70">
          자리가 열리면 가장 먼저 알려드립니다
        </p>
      </LandingSection>
    </LandingShell>
  );
}
