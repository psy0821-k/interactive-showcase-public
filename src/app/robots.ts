import type { MetadataRoute } from "next";

const SITE_URL = "https://interactive-showcase-public.vercel.app";

/**
 * `/robots.txt`를 생성한다 (Next App Router 파일 규약).
 *
 * 포트폴리오 사이트이므로 전면 색인 허용. `/showcase/*` 상세도 색인 대상.
 * sitemap 위치를 명시해 크롤러가 38개 쇼케이스를 찾게 한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
