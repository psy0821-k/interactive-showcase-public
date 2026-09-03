"use client";

import { LandingShell, LandingSection, LandingCard } from "../landing-shell";
import { findLanding } from "../registry";
import { CrystalFeaturesScene } from "../scenes/crystal-features-scene";
import { UiMock, type UiMockKind } from "../ui-mock";

const FEATURES: { title: string; body: string; mock: UiMockKind }[] = [
  {
    title: "오프라인 우선",
    body: "비행기 안에서도 그대로 씁니다. 연결되면 조용히 병합됩니다.",
    mock: "sync",
  },
  {
    title: "종단 암호화",
    body: "서버도 내용을 읽지 못합니다. 키는 당신의 기기에만 있습니다.",
    mock: "note",
  },
  {
    title: "무한 캔버스",
    body: "문서의 경계가 없습니다. 노트끼리 연결해 지식 그래프를 만듭니다.",
    mock: "grid",
  },
  {
    title: "공개 API",
    body: "모든 데이터에 REST/GraphQL로 접근합니다. 웹훅으로 워크플로에 연결합니다.",
    mock: "dashboard",
  },
  {
    title: "자동 백업",
    body: "매일 3벌의 사본이 서로 다른 지역에 저장됩니다.",
    mock: "chart",
  },
];

export function CrystalFeaturesPage() {
  const entry = findLanding("crystal-features")!;
  return (
    <LandingShell
      entry={entry}
      renderScene={(ctx) => <CrystalFeaturesScene {...ctx} />}
    >
      <LandingSection align="center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">
          Fluxnote Features
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          하나씩 피어나는 기능들
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          스크롤하면 결정이 열립니다.
        </p>
      </LandingSection>

      {FEATURES.map((feature) => (
        <LandingSection key={feature.title} align="start">
          <LandingCard className="max-w-md">
            <UiMock kind={feature.mock} accent="#c4b5fd" className="mb-5 aspect-[16/10]" />
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-3 text-white/75">{feature.body}</p>
          </LandingCard>
        </LandingSection>
      ))}

      <LandingSection align="center">
        <h2 className="text-3xl font-semibold">전부 한 요금제에</h2>
        <p className="mt-4 text-white/70">숨은 애드온 없음</p>
      </LandingSection>
    </LandingShell>
  );
}
