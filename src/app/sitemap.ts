import type { MetadataRoute } from "next";
import { getShowcaseEntries } from "@/showcases/server-registry";
import { SITE_URL } from "@/lib/site";

/**
 * `/sitemap.xml`을 생성한다 (Next App Router 파일 규약).
 * 홈 + 38개 쇼케이스 상세 페이지.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getShowcaseEntries();
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...entries.map((entry) => ({
      url: `${SITE_URL}/showcase/${entry.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
