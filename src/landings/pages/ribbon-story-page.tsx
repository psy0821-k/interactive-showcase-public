'use client';

import { LandingShell, LandingSection, LandingCard } from '../landing-shell';
import { findLanding } from '../registry';
import { RibbonStoryScene } from '../scenes/ribbon-story-scene';

const STORY = [
  {
    year: '2021',
    body: '두 명이 카페에서 시작했습니다. "메모가 흩어지지 않는 노트"가 전부였습니다.',
  },
  {
    year: '2023',
    body: '100만 개의 노트가 Fluxnote에 저장됐습니다. 동기화 엔진을 처음부터 다시 썼습니다.',
  },
  {
    year: '2025',
    body: '팀 협업을 출시했습니다. 이제 노트는 개인의 기억이자 팀의 문맥입니다.',
  },
];

export function RibbonStoryPage() {
  const entry = findLanding('ribbon-story')!;
  return (
    <LandingShell
      entry={entry}
      renderScene={(ctx) => <RibbonStoryScene {...ctx} />}
    >
      <LandingSection align="center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-pink-300">
          Fluxnote Story
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          하나의 선을 따라 여기까지
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          스크롤하면 리본을 따라 날아갑니다.
        </p>
      </LandingSection>

      {STORY.map((chapter) => (
        <LandingSection key={chapter.year} align="start">
          <LandingCard className="max-w-md">
            <p className="text-sm font-medium uppercase tracking-widest text-pink-300">
              {chapter.year}
            </p>
            <p className="mt-3 text-lg text-white/80">{chapter.body}</p>
          </LandingCard>
        </LandingSection>
      ))}

      <LandingSection align="center">
        <h2 className="text-3xl font-semibold">다음 장에 함께해요</h2>
        <p className="mt-4 text-white/70">채용 중 · 원격 우선</p>
      </LandingSection>
    </LandingShell>
  );
}
