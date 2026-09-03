import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SKILL_CATEGORY_LABELS } from '@/domain/skill-category';
import { getSkillEntry, SKILL_CATALOG } from '@/domain/skill-catalog';
import { getShowcaseEntries } from '@/showcases/server-registry';
import { SITE_URL } from '@/lib/site';

/** 카탈로그에 등록된 skill 상세 페이지를 빌드 타임에 정적 생성한다. */
export function generateStaticParams() {
  return Object.keys(SKILL_CATALOG).map((name) => ({ name }));
}

export async function generateMetadata({
  params,
}: PageProps<'/skills/[name]'>): Promise<Metadata> {
  const { name } = await params;
  const skill = getSkillEntry(name);
  if (!skill) return {};

  const canonical = `/skills/${name}`;
  return {
    title: `${skill.title} — 사용 기법`,
    description: skill.summary,
    keywords: [skill.name, skill.category, '3D', '웹 개발'],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}${canonical}`,
      title: skill.title,
      description: skill.summary,
    },
  };
}

export default async function SkillPage({
  params,
}: PageProps<'/skills/[name]'>) {
  const { name } = await params;
  const skill = getSkillEntry(name);
  if (!skill) notFound();

  const categoryLabel = SKILL_CATEGORY_LABELS[skill.category];

  // 이 skill을 usedSkills에 담은 쇼케이스 (개발자 뷰 ← 사용자 쇼케이스 역링크).
  const entries = await getShowcaseEntries();
  const usedBy = entries.filter((entry) =>
    entry.meta.usedSkills.includes(skill.name),
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: skill.title,
    description: skill.summary,
    url: `${SITE_URL}/skills/${name}`,
    keywords: skill.name,
    isPartOf: { '@type': 'CollectionPage', '@id': SITE_URL },
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        // 정적 데이터라 XSS 위험 없음. Next 권장 패턴.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="text-sm text-neutral-500">
        <Link href="/" className="underline">
          갤러리
        </Link>
        <span aria-hidden> / </span>
        사용 기법
      </p>

      <header className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{skill.title}</h1>
          <span className="rounded bg-neutral-100 px-2 py-1 text-sm dark:bg-neutral-800">
            {categoryLabel}
          </span>
        </div>
        <code className="text-sm text-neutral-500">{skill.name}</code>
        <p className="text-neutral-600 dark:text-neutral-400">
          {skill.summary}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          핵심 함정
        </h2>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {skill.pitfall}
        </p>
      </section>

      {skill.requires && skill.requires.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            먼저 익힐 것
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {skill.requires.map((req) => {
              const target = getSkillEntry(req);
              return target ? (
                <li key={req}>
                  <Link
                    href={`/skills/${req}`}
                    className="rounded bg-neutral-100 px-2 py-1 text-sm text-neutral-700 underline-offset-2 hover:underline dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {target.title}
                  </Link>
                </li>
              ) : (
                <li
                  key={req}
                  className="rounded bg-neutral-100 px-2 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {req}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          이 기법을 쓰는 쇼케이스
        </h2>
        {usedBy.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {usedBy.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/showcase/${entry.slug}`}
                  className="text-sm underline underline-offset-2"
                >
                  {entry.meta.title}
                </Link>
                <span className="ml-2 text-sm text-neutral-500">
                  {entry.meta.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            아직 이 기법을 사용하는 쇼케이스가 없습니다.
          </p>
        )}
      </section>
    </main>
  );
}
