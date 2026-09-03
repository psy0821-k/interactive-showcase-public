import { Suspense } from 'react';
import type { ShowcaseTrack } from '@/domain/showcase';
import { GalleryBrowser } from '@/components/gallery-browser';
import { ShowcaseCard } from '@/components/showcase-card';
import { getShowcaseEntries } from '@/showcases/server-registry';
import { SITE_URL } from '@/lib/site';

interface Props {
  /** 이 갤러리가 보여줄 트랙. */
  track: ShowcaseTrack;
  /** 필터·검색 쿼리를 붙일 경로. `/` 또는 `/gsap`. */
  basePath: string;
  /** 페이지 제목 (h1). */
  title: string;
  /** 페이지 설명. */
  description: string;
  /** JSON-LD CollectionPage 이름. */
  collectionName: string;
}

/**
 * 트랙별 갤러리 목록 페이지의 공통 렌더.
 *
 * `/`(3d)와 `/gsap`(gsap)가 이 컴포넌트를 track만 바꿔 호출한다. 카드 목록은
 * 서버에서 렌더돼 초기 HTML에 전부 담기고, GalleryBrowser가 검색·필터 시
 * 표시/숨김만 토글한다.
 */
export async function GalleryPage({
  track,
  basePath,
  title,
  description,
  collectionName,
}: Props) {
  const entries = await getShowcaseEntries({ track });
  const pageUrl = `${SITE_URL}${basePath === '/' ? '' : basePath}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl,
    name: collectionName,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        '@type': 'ListItem',
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
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
      </header>

      {/*
        GalleryBrowser가 useSearchParams를 쓰므로 Suspense 경계가 필요하다.
        카드 목록(children)은 서버에서 렌더돼 초기 HTML에 전부 담긴다 —
        GalleryBrowser는 검색·필터 시 표시/숨김만 토글한다.
      */}
      <Suspense fallback={<p className="text-neutral-500">불러오는 중…</p>}>
        <GalleryBrowser basePath={basePath}>
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
