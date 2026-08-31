import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { MetadataRoute } from "next";

const SITE_URL = "https://interactive-showcase-public.vercel.app";

/**
 * `src/showcases/{category}/{slug}/index.tsx`의 slug를 파일시스템에서 읽는다.
 *
 * `src/showcases/registry.ts`는 `"use client"` + `import.meta.glob`이라
 * 빌드 타임 서버(sitemap 생성)에서는 빈 값을 준다. sitemap은 slug만
 * 필요하므로 디렉토리를 직접 걷는다.
 */
function readShowcaseSlugs(): string[] {
  const root = join(process.cwd(), "src", "showcases");
  const slugs: string[] = [];

  for (const category of readdirSync(root, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    const categoryDir = join(root, category.name);
    for (const showcase of readdirSync(categoryDir, { withFileTypes: true })) {
      if (showcase.isDirectory()) slugs.push(showcase.name);
    }
  }

  return slugs.sort();
}

/**
 * `/sitemap.xml`을 생성한다 (Next App Router 파일 규약).
 * 홈 + 38개 쇼케이스 상세 페이지.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...readShowcaseSlugs().map((slug) => ({
      url: `${SITE_URL}/showcase/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
