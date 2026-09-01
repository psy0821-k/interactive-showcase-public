import type { MetadataRoute } from "next";
import { SITE_URL, IS_INDEXABLE } from "@/lib/site";

/**
 * `/robots.txt`를 생성한다 (Next App Router 파일 규약).
 *
 * 프로덕션 배포만 전면 색인 허용. preview·development 배포는 전면 차단해
 * 중복 도메인이 색인되지 않게 한다.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
