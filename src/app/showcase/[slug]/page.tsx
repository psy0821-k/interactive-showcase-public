import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillEntry } from "@/domain/skill-catalog";
import { TECHNIQUE_CATEGORY_LABELS } from "@/domain/technique-category";
import {
  findShowcaseOnServer,
  getShowcaseEntries,
} from "@/showcases/server-registry";
import { resolveTrack } from "@/domain/showcase";
import { BackButton } from "@/components/back-button";
import { CopyButton } from "@/components/copy-button";
import { ShowcaseDetail } from "@/components/showcase-detail";
import { SITE_URL } from "@/lib/site";

/** 트랙별 갤러리 경로. 직접 URL 진입 시 뒤로가기 폴백에 쓴다. */
const GALLERY_PATH = { "3d": "/", gsap: "/gsap" } as const;

/** 모든 쇼케이스 상세 페이지를 빌드 타임에 정적 생성한다. */
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
  const galleryPath = GALLERY_PATH[resolveTrack(meta)];

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
        뒤로가기 — 제목 위에 둔다(gsap-lab 상세와 통일). 갤러리에서 진입했으면
        router.back()이 스크롤 위치까지 복원하고, 직접 URL이면 트랙에 맞는
        갤러리로 폴백한다. router를 쓰므로 클라이언트 컴포넌트다.
      */}
      <div className="mb-4">
        <BackButton fallbackHref={galleryPath} />
      </div>

      {/*
        SEO·접근성을 위해 텍스트 콘텐츠(제목·설명·분류·사용 기법)는 서버에서
        렌더한다. 클라이언트 컴포넌트인 ShowcaseDetail은 three.js 캔버스만
        담당한다.
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
          {meta.usedSkills.map((skill) => {
            // 카탈로그에 등록된 기법은 상세 문서로 링크한다.
            // 미등록 skill(기존 3D 쇼케이스)은 링크 없이 표시한다.
            const entry = getSkillEntry(skill);
            return entry ? (
              <Link
                key={skill}
                href={`/skills/${skill}`}
                className="rounded bg-neutral-100 px-2 py-1 text-neutral-700 underline-offset-2 hover:underline dark:bg-neutral-800 dark:text-neutral-300"
              >
                {skill}
              </Link>
            ) : (
              <span
                key={skill}
                className="rounded bg-neutral-100 px-2 py-1 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {skill}
              </span>
            );
          })}
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

      <ShowcaseDetail slug={slug} title={meta.title} />

      {/*
        스킬 활용 & 프롬프트 — 이 쇼케이스를 만들 때 각 skill을 어떻게 썼는지,
        그리고 Claude Code로 재현한다면 던질 법한 자연어 요청. 텍스트는 서버에서
        렌더하고 복사 버튼만 클라이언트 컴포넌트다. 두 필드는 선택이라 하나라도
        있을 때만 섹션을 그린다.
      */}
      {(meta.skillUsage || meta.promptExample) && (
        <section className="mt-12 flex flex-col gap-6">
          <h2 className="text-lg font-semibold">스킬 활용 &amp; 프롬프트</h2>

          {meta.skillUsage && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-neutral-500">
                  스킬을 어떻게 썼나
                </h3>
                <CopyButton
                  text={meta.skillUsage}
                  label="스킬 활용 설명 복사"
                />
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                {meta.skillUsage}
              </p>
            </div>
          )}

          {meta.promptExample && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-neutral-500">
                  프롬프트 예시
                </h3>
                <CopyButton
                  text={meta.promptExample}
                  label="프롬프트 예시 복사"
                />
              </div>
              <p className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-white p-4 font-mono text-sm leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                {meta.promptExample}
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
