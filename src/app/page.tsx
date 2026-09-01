import { Suspense } from "react";
import { GalleryBrowser } from "@/components/gallery-browser";
import { ShowcaseCard } from "@/components/showcase-card";
import { getShowcaseEntries } from "@/showcases/server-registry";
import { SITE_URL } from "@/lib/site";

export default async function GalleryPage() {
  const entries = await getShowcaseEntries();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": SITE_URL,
    name: "3D Skill Showcase",
    url: SITE_URL,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/showcase/${entry.slug}`,
        name: entry.meta.title,
      })),
    },
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">3D Skill Showcase</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Claude Code skill로 만든 3D 결과물 모음입니다.
        </p>
      </header>

      {/*
        GalleryBrowser가 useSearchParams를 쓰므로 Suspense 경계가 필요하다.
        카드 목록(children)은 서버에서 렌더돼 초기 HTML에 38개가 전부 담긴다 —
        GalleryBrowser는 검색·필터 시 표시/숨김만 토글한다.
      */}
      <Suspense fallback={<p className="text-neutral-500">불러오는 중…</p>}>
        <GalleryBrowser>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry, index) => (
              <ShowcaseCard key={entry.slug} entry={entry} eager={index < 6} />
            ))}
          </ul>
        </GalleryBrowser>
      </Suspense>
    </main>
  );
}
