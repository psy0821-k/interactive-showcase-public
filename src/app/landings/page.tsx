import type { Metadata } from 'next';
import Link from 'next/link';
import { LANDING_ENTRIES, type LandingEntry } from '@/landings/registry';

export const metadata: Metadata = {
  title: 'Landings',
  description:
    '스크롤 연동 랜딩페이지 예시 모음. R3F Canvas에 GSAP ScrollTrigger를 물린 ' +
    '방식과 순수 DOM GSAP 방식을 나눠, 가상 SaaS Fluxnote를 소재로 시연한다.',
  alternates: { canonical: '/landings' },
  openGraph: {
    type: 'website',
    url: '/landings',
    title: 'Landings',
    description:
      '스크롤 연동 랜딩페이지 예시 — R3F + GSAP, 그리고 순수 DOM GSAP.',
  },
};

/** 렌더링 방식별 섹션 메타. 표시 순서는 이 배열 순서를 따른다. */
const SECTIONS: {
  kind: 'r3f' | 'dom';
  heading: string;
  description: string;
  badge: string;
}[] = [
  {
    kind: 'r3f',
    heading: '3D 히어로 + 스크롤',
    description:
      '자체 <Canvas>와 스크롤 컨테이너에 GSAP ScrollTrigger를 직접 접합했습니다. ' +
      '스크롤 진행률이 카메라·오브젝트 상태를 몹니다.',
    badge: 'R3F',
  },
  {
    kind: 'dom',
    heading: '순수 DOM + GSAP',
    description:
      'R3F 없이 DOM 요소만 GSAP ScrollTrigger로 움직입니다. 패럴랙스, 핀, ' +
      '키네틱 타이포를 마크업과 CSS transform으로 구성했습니다.',
    badge: 'DOM',
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
          ScrollTrigger를 물린 것과 R3F 없이 순수 DOM + GSAP으로만 만든 것으로
          나눴습니다. 쇼케이스 셸을 거치지 않고 독립 라우트에서 직접 구성하며,
          소재는 가상 SaaS Fluxnote입니다. 각 상세 페이지에는 그 페이지를 만들
          때 정의한 요구사항이 결과물과 나란히 있습니다.
        </p>
      </header>

      {SECTIONS.map((section) => {
        const entries = LANDING_ENTRIES.filter(
          (entry) => (entry.kind ?? 'r3f') === section.kind,
        );
        if (entries.length === 0) return null;

        return (
          <section key={section.kind} className="mb-16">
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
