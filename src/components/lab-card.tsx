import Link from 'next/link';
import type { LabEntry } from '@/gsap-lab/registry';

interface Props {
  entry: LabEntry;
}

/**
 * GSAP Lab 갤러리 카드. `ShowcaseCard`와 같은 구조·클래스를 쓰되,
 * 썸네일 이미지가 없으므로 그 자리를 `entry.accent` 그라데이션 블록으로 채운다.
 *
 * 검색·필터 시 `gallery-browser.tsx`가 이 `<li>`의 data-* 속성을 읽어
 * 표시/숨김만 토글한다. 목록 자체는 다시 그리지 않는다.
 */
export function LabCard({ entry }: Props) {
  // 클라이언트 필터가 대소문자 무시 부분일치로 검색하는 대상.
  const haystack = [
    entry.title,
    entry.tag,
    entry.description,
    ...entry.usedSkills,
  ]
    .join(' ')
    .toLowerCase();

  return (
    <li data-category={entry.category} data-haystack={haystack}>
      <Link
        href={`/gsap-lab/${entry.slug}`}
        className="group flex h-full flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-neutral-800 dark:hover:border-neutral-600"
      >
        <div
          className="aspect-video overflow-hidden rounded-md transition-transform duration-300 group-hover:scale-105"
          style={{ background: entry.accent }}
          aria-hidden
        />

        <div className="flex flex-col gap-2">
          <h3 className="font-medium group-hover:underline">{entry.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {entry.description}
          </p>
          <p className="text-xs text-neutral-500">{entry.tag}</p>
          <ul className="flex flex-wrap gap-1">
            {entry.usedSkills.map((skill) => (
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
