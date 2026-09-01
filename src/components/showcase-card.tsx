import Link from "next/link";
import type { ShowcaseEntry } from "@/domain/showcase";
import { TECHNIQUE_CATEGORY_LABELS } from "@/domain/technique-category";
import { ShowcaseThumbnail } from "./showcase-thumbnail";

interface Props {
  entry: ShowcaseEntry;
  /** above-the-fold 카드(첫 6장)는 썸네일을 즉시 로드해 LCP를 늦추지 않는다. */
  eager?: boolean;
}

/**
 * 갤러리 카드. 서버에서 렌더된다 — 제목·설명·링크·태그가 초기 HTML에 담긴다.
 *
 * 검색·필터 시 클라이언트(`gallery-browser.tsx`)가 이 `<li>`의
 * data-* 속성을 읽어 표시/숨김만 토글한다. 목록 자체는 다시 그리지 않는다.
 */
export function ShowcaseCard({ entry, eager = false }: Props) {
  const { slug, meta, thumbnail } = entry;

  // 클라이언트 필터가 대소문자 무시 부분일치로 검색하는 대상.
  const haystack = [meta.title, meta.description, ...meta.usedSkills]
    .join(" ")
    .toLowerCase();

  return (
    <li data-category={meta.category} data-haystack={haystack}>
      <Link
        href={`/showcase/${slug}`}
        className="group flex h-full flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-neutral-800 dark:hover:border-neutral-600"
      >
        <ShowcaseThumbnail
          src={thumbnail}
          fallbackInitial={meta.title.slice(0, 1)}
          eager={eager}
        />

        <div className="flex flex-col gap-2">
          <h3 className="font-medium group-hover:underline">{meta.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {meta.description}
          </p>
          <p className="text-xs text-neutral-500">
            {TECHNIQUE_CATEGORY_LABELS[meta.category]}
          </p>
          <ul className="flex flex-wrap gap-1">
            {meta.usedSkills.map((skill) => (
              <li
                key={skill}
                className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </Link>
    </li>
  );
}
