import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveTrack,
  type ShowcaseEntry,
  type ShowcaseMeta,
  type ShowcaseTrack,
} from '@/domain/showcase';
import { isTechniqueCategory } from '@/domain/technique-category';

/**
 * 서버(RSC·generateMetadata·generateStaticParams·sitemap) 전용 쇼케이스 목록.
 *
 * 클라이언트 registry(`registry.ts`)는 `import.meta.glob`으로 meta를 걷지만,
 * 그 glob은 빌드 타임 서버 컨텍스트에서 빈 값을 준다(sitemap.ts 주석 참조).
 * 서버 코드에서는 디렉토리를 직접 걷어 slug를 얻고, 각 `meta.ts`를
 * 동적 import 한다. `meta.ts`는 순수 객체만 담으므로(three/drei import 없음)
 * 서버 그래프에 들어와도 무해하다.
 *
 * 모든 진입점(generateMetadata·generateStaticParams·sitemap)이 async이므로
 * 동적 import로 충분하다.
 */

const SHOWCASES_ROOT = join(process.cwd(), 'src', 'showcases');

/** `src/showcases/{category}/{slug}` 를 걷어 (category, slug) 쌍을 만든다. */
function readShowcasePaths(): { category: string; slug: string }[] {
  const paths: { category: string; slug: string }[] = [];

  for (const category of readdirSync(SHOWCASES_ROOT, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const showcase of readdirSync(join(SHOWCASES_ROOT, category.name), {
      withFileTypes: true,
    })) {
      if (showcase.isDirectory()) {
        paths.push({ category: category.name, slug: showcase.name });
      }
    }
  }

  return paths;
}

/** meta.ts를 동적 import 해 검증한다. 경로와 meta.category의 일치도 본다. */
async function loadMeta(category: string, slug: string): Promise<ShowcaseMeta> {
  const mod = (await import(`./${category}/${slug}/meta.ts`)) as {
    meta?: ShowcaseMeta;
  };
  const meta = mod.meta;

  if (
    !meta ||
    !meta.title?.trim() ||
    !meta.description?.trim() ||
    !Array.isArray(meta.usedSkills) ||
    meta.usedSkills.length === 0 ||
    !isTechniqueCategory(meta.category) ||
    (meta.track !== undefined && meta.track !== '3d' && meta.track !== 'gsap')
  ) {
    throw new Error(
      `[server-registry] ${category}/${slug}/meta.ts 형태가 올바르지 않다.`,
    );
  }
  if (meta.category !== category) {
    throw new Error(
      `[server-registry] ${slug}: 경로 카테고리 '${category}'와 meta.category '${meta.category}'가 다르다.`,
    );
  }

  return meta;
}

/**
 * 서버 컨텍스트에서 쓰는 쇼케이스 목록. 제목 가나다순.
 *
 * `track`을 주면 해당 트랙만 (생략된 meta.track은 `"3d"`로 취급).
 * 무인자 호출은 전체를 돌려준다 — 상세 페이지·sitemap이 그대로 쓴다.
 */
export async function getShowcaseEntries(options?: {
  track?: ShowcaseTrack;
}): Promise<ShowcaseEntry[]> {
  const entries = await Promise.all(
    readShowcasePaths().map(async ({ category, slug }) => {
      const meta = await loadMeta(category, slug);
      return {
        slug,
        meta,
        thumbnail: meta.thumbnail ?? `/thumbnails/${slug}.webp`,
      } satisfies ShowcaseEntry;
    }),
  );

  const sorted = entries.sort((a, b) =>
    a.meta.title.localeCompare(b.meta.title, 'ko'),
  );

  return options?.track
    ? sorted.filter((entry) => resolveTrack(entry.meta) === options.track)
    : sorted;
}

/** slug로 서버 쪽 항목을 찾는다. 없으면 undefined. */
export async function findShowcaseOnServer(
  slug: string,
): Promise<ShowcaseEntry | undefined> {
  const entries = await getShowcaseEntries();
  return entries.find((entry) => entry.slug === slug);
}
