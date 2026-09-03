import { Suspense } from "react";
import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/gallery-browser";
import { LabCard } from "@/components/lab-card";
import {
  getLabEntriesInDisplayOrder,
  LAB_CATEGORY_FILTERS,
} from "@/gsap-lab/registry";
import { SITE_URL } from "@/lib/site";

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

/**
 * `/gsap-lab` 목록.
 *
 * 3D 갤러리(`GalleryPage`)와 동일한 레이아웃·컴포넌트를 쓴다. 카드 목록은
 * 서버에서 렌더돼 초기 HTML에 전부 담기고, `GalleryBrowser`가 검색·필터 시
 * 표시/숨김만 토글한다. 카테고리 체계는 3D의 시각결과 8종과 성격이 달라
 * (기법 유형 5종) gsap-lab 고유 목록을 그대로 넘긴다.
 */
export default function GsapLabIndexPage() {
  const entries = getLabEntriesInDisplayOrder();
  const pageUrl = `${SITE_URL}/gsap-lab`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    name: "GSAP Lab",
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/gsap-lab/${entry.slug}`,
        name: entry.title,
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
        <h1 className="text-2xl font-semibold">GSAP Lab</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          캔버스 없이 순수 HTML/CSS + GSAP DOM 애니메이션으로 만든 데모 모음입니다.
          가상 SaaS 제품 <strong>Fluxnote</strong>를 소재로 하며, 이미지가 들어갈
          자리는 배경색만 다른 블록으로 대체했습니다.
        </p>
      </header>

      {/*
        GalleryBrowser가 useSearchParams를 쓰므로 Suspense 경계가 필요하다.
        카드 목록(children)은 서버에서 렌더돼 초기 HTML에 전부 담긴다 —
        GalleryBrowser는 검색·필터 시 표시/숨김만 토글한다.
      */}
      <Suspense fallback={<p className="text-neutral-500">불러오는 중…</p>}>
        <GalleryBrowser basePath="/gsap-lab" categories={LAB_CATEGORY_FILTERS}>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <LabCard key={entry.slug} entry={entry} />
            ))}
          </ul>
        </GalleryBrowser>
      </Suspense>
    </main>
  );
}
