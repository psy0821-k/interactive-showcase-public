"use client";

import { LandingShell, LandingSection, LandingCard } from "../landing-shell";
import { findLanding } from "../registry";
import { CloudSyncScene } from "../scenes/cloud-sync-scene";
import { UiMock, type UiMockKind } from "../ui-mock";

const FEATURES: {
  title: string;
  body: string;
  mock: UiMockKind;
}[] = [
  {
    title: "무제한 동기화",
    body: "노트가 기기에 닿는 순간 클라우드에 반영됩니다. 용량 제한도, 수동 저장도 없습니다.",
    mock: "sync",
  },
  {
    title: "버전 히스토리",
    body: "모든 편집이 스냅샷으로 남습니다. 30일 전 문장으로 한 번에 되돌릴 수 있습니다.",
    mock: "note",
  },
  {
    title: "팀 공유",
    body: "링크 하나로 팀 전체가 같은 노트를 봅니다. 권한은 문단 단위로 조절됩니다.",
    mock: "dashboard",
  },
];

export function CloudSyncPage() {
  const entry = findLanding("cloud-sync")!;
  return (
    <LandingShell entry={entry} renderScene={(ctx) => <CloudSyncScene {...ctx} />}>
      <LandingSection align="center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
          Fluxnote Cloud
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          구름 너머에 당신의 노트가 있습니다
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          아래로 스크롤하면 구름 사이로 들어갑니다.
        </p>
      </LandingSection>

      {FEATURES.map((feature) => (
        <LandingSection key={feature.title} align="start">
          <LandingCard className="max-w-md">
            <UiMock kind={feature.mock} accent="#38bdf8" className="mb-5 aspect-[16/10]" />
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-3 text-white/75">{feature.body}</p>
          </LandingCard>
        </LandingSection>
      ))}

      <LandingSection align="center">
        <h2 className="text-3xl font-semibold">지금 팀을 옮겨오세요</h2>
        <p className="mt-4 text-white/70">14일 무료 · 카드 등록 없음</p>
      </LandingSection>
    </LandingShell>
  );
}
