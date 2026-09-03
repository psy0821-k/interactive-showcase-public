import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findLanding, LANDING_ENTRIES } from '@/landings/registry';
import { LandingDomHeader } from '@/landings/landing-dom-header';
import { LandingRenderer } from './landing-renderer';

/**
 * 공통 헤더(breadcrumb·caveat·요구사항 패널)를 페이지 컴포넌트가 아니라
 * 이 래퍼가 제공하는 slug 목록.
 *
 * - `kind: "r3f"` 페이지는 `LandingShell`이 내부에서 `LandingDomHeader`를 렌더한다.
 * - `forest`는 히어로 레이아웃상 헤더 높이를 계산에 넣어야 해서 자체 렌더한다.
 * - 나머지 `kind: "dom"` 페이지(gsap-lab에서 이관)는 여기서 씌운다.
 */
const DOM_PAGES_NEEDING_HEADER = new Set([
  'scroll-story',
  'pricing-reveal',
  'pointer-play',
  'tab-transition',
]);

export function generateStaticParams(): { slug: string }[] {
  return LANDING_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/landings/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const entry = findLanding(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: `/landings/${entry.slug}` },
  };
}

export default async function LandingDetailPage({
  params,
}: PageProps<'/landings/[slug]'>) {
  const { slug } = await params;
  const entry = findLanding(slug);
  if (!entry) notFound();

  if (DOM_PAGES_NEEDING_HEADER.has(slug)) {
    return (
      <main className="flex-1">
        <LandingDomHeader entry={entry} />
        <LandingRenderer slug={slug} />
      </main>
    );
  }

  return <LandingRenderer slug={slug} />;
}
