/**
 * 사이트 URL·색인 정책의 단일 출처.
 *
 * 프로덕션 도메인은 Vercel이 주입하는 `VERCEL_PROJECT_PRODUCTION_URL`을
 * 우선 쓴다(프로토콜 없는 host 형태). 로컬·미설정 시 폴백 상수를 쓴다.
 */

const FALLBACK_HOST = 'interactive-showcase-public.vercel.app';

const productionHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? FALLBACK_HOST;

/** 항상 프로덕션(정본) 도메인. canonical·OG·sitemap에 쓴다. */
export const SITE_URL = `https://${productionHost}`;

/**
 * 이 배포를 검색엔진이 색인해도 되는가.
 * Vercel `production` 환경에서만 true. preview·development는 색인 차단.
 */
export const IS_INDEXABLE = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : true;
