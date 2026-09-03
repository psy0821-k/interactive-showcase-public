import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findLanding, LANDING_ENTRIES } from "@/landings/registry";
import { LandingRenderer } from "./landing-renderer";

export function generateStaticParams(): { slug: string }[] {
  return LANDING_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/landings/[slug]">): Promise<Metadata> {
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
}: PageProps<"/landings/[slug]">) {
  const { slug } = await params;
  const entry = findLanding(slug);
  if (!entry) notFound();

  return <LandingRenderer slug={slug} />;
}
