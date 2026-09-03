import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_ENTRIES, type LandingEntry } from "@/landings/registry";

export const metadata: Metadata = {
  title: "Landings",
  description:
    "3D 히어로 + 스크롤 연동 랜딩페이지 예시 6선. R3F Canvas와 GSAP ScrollTrigger를 " +
    "셸 밖 독립 라우트에서 직접 접합해, 가상 SaaS Fluxnote를 소재로 시연한다. " +
    "각 페이지는 만들 때 쓴 예시 프롬프트를 함께 담는다.",
  alternates: { canonical: "/landings" },
  openGraph: {
    type: "website",
    url: "/landings",
    title: "Landings",
    description: "3D 히어로 + 스크롤 연동 랜딩페이지 예시 6선.",
  },
};

function LandingCard({ entry }: { entry: LandingEntry }) {
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
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {entry.tag}
          </span>
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
          R3F 3D 히어로에 GSAP ScrollTrigger를 물린 랜딩페이지 예시입니다. 쇼케이스
          셸을 거치지 않고 <strong>독립 라우트</strong>에서 <code>&lt;Canvas&gt;</code>와
          스크롤 컨테이너를 직접 구성합니다. 소재는 가상 SaaS{" "}
          <strong>Fluxnote</strong>이며, 각 페이지 상단에는 그 페이지를 만들 때 쓴{" "}
          <strong>예시 프롬프트</strong>가 함께 있습니다.
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_ENTRIES.map((entry) => (
          <LandingCard key={entry.slug} entry={entry} />
        ))}
      </ul>
    </main>
  );
}
