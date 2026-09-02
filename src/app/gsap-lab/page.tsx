import type { Metadata } from "next";
import Link from "next/link";
import {
  getLabEntriesByCategory,
  LAB_CATEGORY_META,
  LAB_CATEGORY_ORDER,
  type LabEntry,
} from "@/gsap-lab/registry";

export const metadata: Metadata = {
  title: "GSAP Lab",
  description:
    "순수 DOM GSAP로 만든 스크롤 효과·랜딩페이지 랩. 패럴랙스·스크롤 스크럽·" +
    "순차/동시 등장·핀·가로 스크롤 등을 가상 SaaS 제품 Fluxnote를 소재로 시연한다.",
  alternates: { canonical: "/gsap-lab" },
  openGraph: {
    type: "website",
    url: "/gsap-lab",
    title: "GSAP Lab",
    description: "DOM GSAP 랩 — 스크롤 효과 데모 + 랜딩페이지.",
  },
};

function EntryCard({ entry }: { entry: LabEntry }) {
  return (
    <li>
      <Link
        href={`/gsap-lab/${entry.slug}`}
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
          <h3 className="mt-1 text-base font-semibold">{entry.title}</h3>
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

export default function GsapLabIndexPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">GSAP Lab</h1>
        <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
          캔버스 없이 순수 HTML/CSS + GSAP DOM 애니메이션으로 만든 데모 모음입니다.
          가상 SaaS 제품 <strong>Fluxnote</strong>를 소재로 하며, 이미지가 들어갈
          자리는 배경색만 다른 블록으로 대체했습니다.
        </p>
      </header>

      {LAB_CATEGORY_ORDER.map((category) => {
        const entries = getLabEntriesByCategory(category);
        const meta = LAB_CATEGORY_META[category];
        return (
          <section key={category} className="mb-16">
            <h2 className="text-xl font-semibold">{meta.label}</h2>
            <p className="mt-1 mb-6 text-sm text-neutral-600 dark:text-neutral-400">
              {meta.description}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <EntryCard key={entry.slug} entry={entry} />
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
