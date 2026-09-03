"use client";

import { LandingShell, LandingSection, LandingCard } from "../landing-shell";
import { findLanding } from "../registry";
import { GridMetricsScene } from "../scenes/grid-metrics-scene";
import { UiMock, type UiMockKind } from "../ui-mock";

const POINTS: { title: string; body: string; mock: UiMockKind }[] = [
  {
    title: "실시간 지표",
    body: "이벤트가 발생한 지 2초 안에 차트에 반영됩니다. 배치 집계를 기다리지 않습니다.",
    mock: "chart",
  },
  {
    title: "커스텀 대시보드",
    body: "드래그로 위젯을 배치하고, 팀별로 다른 뷰를 저장합니다.",
    mock: "dashboard",
  },
];

export function GridMetricsPage() {
  const entry = findLanding("grid-metrics")!;
  return (
    <LandingShell
      entry={entry}
      renderScene={(ctx) => <GridMetricsScene {...ctx} />}
    >
      <LandingSection align="center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-300">
          Fluxnote Analytics
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          지표가 눈앞에서 자라납니다
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          스크롤하면 데이터 필드가 솟아오릅니다.
        </p>
      </LandingSection>

      {POINTS.map((point) => (
        <LandingSection key={point.title} align="start">
          <LandingCard className="max-w-md">
            <UiMock kind={point.mock} accent="#fbbf24" className="mb-5 aspect-[16/10]" />
            <h2 className="text-2xl font-semibold">{point.title}</h2>
            <p className="mt-3 text-white/75">{point.body}</p>
          </LandingCard>
        </LandingSection>
      ))}

      <LandingSection align="center">
        <h2 className="text-3xl font-semibold">데모 데이터로 먼저 둘러보기</h2>
        <p className="mt-4 text-white/70">가입 없이 샘플 대시보드를 열어봅니다</p>
      </LandingSection>
    </LandingShell>
  );
}
