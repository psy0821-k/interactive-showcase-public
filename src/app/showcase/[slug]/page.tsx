import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TECHNIQUE_CATEGORY_LABELS } from "@/domain/technique-category";
import {
  findShowcaseOnServer,
  getShowcaseEntries,
} from "@/showcases/server-registry";
import { ShowcaseDetail } from "@/components/showcase-detail";
import { SITE_URL } from "@/lib/site";

/** 38개 상세 페이지를 빌드 타임에 정적 생성한다. */
export async function generateStaticParams() {
  const entries = await getShowcaseEntries();
  return entries.map((entry) => ({ slug: entry.slug }));
}

/** 쇼케이스별 title·description·OG·canonical. */
export async function generateMetadata({
  params,
}: PageProps<"/showcase/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = await findShowcaseOnServer(slug);
  if (!entry) return {};

  const { meta } = entry;
  const canonical = `/showcase/${slug}`;
  const ogImage = meta.thumbnail ?? `/thumbnails/${slug}.webp`;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.usedSkills,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${canonical}`,
      title: meta.title,
      description: meta.description,
      images: [{ url: ogImage, width: 800, height: 450, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [ogImage],
    },
  };
}

/** Next 16에서 params는 Promise이므로 await 한다. */
export default async function ShowcasePage({
  params,
}: PageProps<"/showcase/[slug]">) {
  const { slug } = await params;
  const entry = await findShowcaseOnServer(slug);
  if (!entry) notFound();

  const { meta } = entry;
  const categoryLabel = TECHNIQUE_CATEGORY_LABELS[meta.category];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}/showcase/${slug}`,
    image: `${SITE_URL}${meta.thumbnail ?? `/thumbnails/${slug}.webp`}`,
    genre: categoryLabel,
    keywords: meta.usedSkills.join(", "),
    isPartOf: { "@type": "CollectionPage", "@id": SITE_URL },
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <script
        type="application/ld+json"
        // 정적 데이터라 XSS 위험 없음. Next 권장 패턴.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*
        SEO·접근성을 위해 텍스트 콘텐츠(제목·설명·분류·사용 기법)는 서버에서
        렌더한다. 클라이언트 컴포넌트인 ShowcaseDetail은 three.js 캔버스와
        뒤로가기 인터랙션만 담당한다.
      */}
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">{meta.title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {meta.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
            {categoryLabel}
          </span>
          {meta.usedSkills.map((skill) => (
            <span
              key={skill}
              className="rounded bg-neutral-100 px-2 py-1 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {skill}
            </span>
          ))}
        </div>
      </header>

      {/*
        캔버스 로드 전 프리뷰이자 이미지 검색 대상인 정적 썸네일.
        크롤러·JS 비활성 환경에서 이 씬이 무엇인지 보여주는 유일한 시각 자료다.
        eslint-disable: 정적 800x450 webp라 next/image 리사이징 이득이 없다.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={meta.thumbnail ?? `/thumbnails/${slug}.webp`}
        alt={`${meta.title} (${categoryLabel}) 3D 씬 미리보기`}
        width={800}
        height={450}
        fetchPriority="high"
        className="mt-6 aspect-video w-full rounded-lg bg-neutral-100 object-cover dark:bg-neutral-900"
      />

      <ShowcaseDetail
        slug={slug}
        title={meta.title}
        description={meta.description}
      />
    </main>
  );
}
