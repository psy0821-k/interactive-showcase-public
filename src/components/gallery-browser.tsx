"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TECHNIQUE_CATEGORIES,
  TECHNIQUE_CATEGORY_LABELS,
} from "@/domain/technique-category";

const ALL = "all";

/** 필터 chip 하나. `value`는 카드의 `data-category`와 대조된다. */
export interface GalleryCategoryOption {
  value: string;
  label: string;
}

/** R3F 갤러리(`/`, `/gsap`)의 기본 카테고리 목록. */
const TECHNIQUE_CATEGORY_OPTIONS: GalleryCategoryOption[] =
  TECHNIQUE_CATEGORIES.map((value) => ({
    value,
    label: TECHNIQUE_CATEGORY_LABELS[value],
  }));

/**
 * 갤러리 검색·필터 컨트롤.
 *
 * 카드 목록(`children`)은 서버에서 렌더된 `<ul><li>`이며, SEO·접근성을 위해
 * 전부 초기 HTML에 담긴다. 이 컴포넌트는 목록을 다시 그리지 않고,
 * 각 `<li>`의 `data-category`·`data-haystack`을 읽어 표시/숨김만 토글한다.
 *
 * `useSearchParams`를 쓰므로 호출부는 `<Suspense>`로 감싸야 한다.
 *
 * - `basePath`: 필터·검색 쿼리를 붙일 갤러리 경로 (`/`·`/gsap`·`/gsap-lab`).
 * - `categories`: 필터 chip 목록. 생략하면 R3F 기법 카테고리 8종.
 */
export function GalleryBrowser({
  children,
  basePath = "/",
  categories = TECHNIQUE_CATEGORY_OPTIONS,
}: {
  children: ReactNode;
  basePath?: string;
  categories?: GalleryCategoryOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);

  const category = searchParams.get("category") ?? ALL;
  const query = searchParams.get("q") ?? "";

  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  // data 속성 기반으로 카드 표시/숨김을 적용한다. JS가 꺼져 있으면
  // 전체가 그대로 보이므로(진행적 향상) 크롤러·접근성에 문제 없다.
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;

    for (const li of root.querySelectorAll<HTMLLIElement>("li[data-haystack]")) {
      const categoryMatched =
        category === ALL || li.dataset.category === category;
      const haystack = li.dataset.haystack ?? "";
      const queryMatched = tokens.every((token) => haystack.includes(token));
      const visible = categoryMatched && queryMatched;

      li.hidden = !visible;
      if (visible) shown += 1;
    }

    setVisibleCount(shown);
  }, [category, query]);

  /** 현재 쿼리를 유지한 채 한 항목만 바꾼다. 빈 값이면 키를 지운다. */
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const queryString = next.toString();
    router.replace(queryString ? `${basePath}?${queryString}` : basePath, {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section
        className="flex flex-col gap-4"
        aria-labelledby="gallery-filter-heading"
      >
        <h2 id="gallery-filter-heading" className="sr-only">
          검색과 필터
        </h2>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">검색</span>
          <input
            type="search"
            defaultValue={query}
            onChange={(event) => updateParam("q", event.target.value)}
            placeholder="제목, 설명, 사용한 skill"
            className="w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="전체"
            active={category === ALL}
            onClick={() => updateParam("category", ALL)}
          />
          {categories.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              active={category === option.value}
              onClick={() => updateParam("category", option.value)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="gallery-list-heading">
        <h2 id="gallery-list-heading" className="sr-only">
          쇼케이스 목록
        </h2>

        {visibleCount === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-neutral-500">일치하는 결과가 없습니다.</p>
            <button
              type="button"
              onClick={() => router.replace(basePath, { scroll: false })}
              className="text-sm underline"
            >
              필터 초기화
            </button>
          </div>
        )}

        <div ref={listRef} hidden={visibleCount === 0}>
          {children}
        </div>
      </section>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
          : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}
