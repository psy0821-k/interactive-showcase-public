import type { Metadata } from "next";
import Link from "next/link";
import {
  LANDING_ENTRIES,
  type LandingAuthoring,
  type LandingEntry,
} from "@/landings/registry";

export const metadata: Metadata = {
  title: "Landings",
  description:
    "스크롤 연동 랜딩페이지 예시 모음. R3F Canvas + GSAP ScrollTrigger 접합과 " +
    "순수 DOM GSAP 두 방식으로, 가상 SaaS Fluxnote를 소재로 시연한다. 사람이 " +
    "코드를 다듬은 페이지와 프롬프트만으로 생성한 페이지를 나눠 담는다.",
  alternates: { canonical: "/landings" },
  openGraph: {
    type: "website",
    url: "/landings",
    title: "Landings",
    description: "스크롤 연동 랜딩페이지 예시 — R3F + GSAP, 그리고 순수 DOM GSAP.",
  },
};

/** 저작 방식별 섹션 메타. 표시 순서는 이 배열 순서를 따른다. */
const SECTIONS: {
  authoring: LandingAuthoring;
  heading: string;
  description: string;
  badge: string;
}[] = [
  {
    authoring: "paired",
    heading: "사람이 함께 다듬은 페이지",
    description:
      "AI가 만든 초안에 개발자가 직접 코드를 수정·조율했습니다. 레이아웃 미세 " +
      "조정, 접근성 보강, 연출 타이밍 손질이 사람 손을 거쳤습니다.",
    badge: "사람 + AI",
  },
  {
    authoring: "ai",
    heading: "프롬프트만으로 생성한 페이지",
    description:
      "예시 프롬프트 하나로 AI가 생성했고, 이후 사람의 코드 수정이 없습니다. " +
      "각 페이지 상단의 '예시 프롬프트'가 실제 입력입니다.",
    badge: "AI",
  },
];

function LandingCard({ entry, badge }: { entry: LandingEntry; badge: string }) {
  return (
    <li>
      <Link
        href={`/landings/${entry.slug}`}
        className="group block overflow-hidden rounded-2xl border border-neutral-200 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
      >
        <div
          className="h-32 w-full"
          style={{ background: entry.accent }}
          aria-hidden
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {entry.tag}
            </span>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {badge}
            </span>
          </div>
          <h2 className="mt-1 text-base font-semibold">{entry.title}</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {entry.description}
          </p>
          <p className="mt-3 flex flex-wrap gap-1.5">
            {entry.usedSkills.map((skill) => (
              <code
                key={skill}
                className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {skill}
              </code>
            ))}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function LandingsIndexPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">Landings</h1>
        <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
          스크롤에 반응하는 완성형 랜딩페이지 예시입니다. R3F 3D 히어로에 GSAP
          ScrollTrigger를 물린 것과 <strong>R3F 없이 순수 DOM + GSAP</strong>으로만
          만든 것이 섞여 있습니다. 쇼케이스 셸을 거치지 않고 <strong>독립 라우트</strong>
          에서 직접 구성하며, 소재는 가상 SaaS <strong>Fluxnote</strong>입니다. 각
          페이지 상단에는 그 페이지를 만들 때 쓴 <strong>예시 프롬프트</strong>가
          함께 있습니다.
        </p>
      </header>

      {SECTIONS.map((section) => {
        const entries = LANDING_ENTRIES.filter(
          (entry) => entry.authoring === section.authoring,
        );
        if (entries.length === 0) return null;

        return (
          <section key={section.authoring} className="mb-16">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            <p className="mt-1 mb-6 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              {section.description}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <LandingCard
                  key={entry.slug}
                  entry={entry}
                  badge={section.badge}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
