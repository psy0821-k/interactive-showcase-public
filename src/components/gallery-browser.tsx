"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TECHNIQUE_CATEGORIES,
  TECHNIQUE_CATEGORY_LABELS,
} from "@/domain/technique-category";
import type { ShowcaseEntry } from "@/domain/showcase";
import { SHOWCASE_ENTRIES } from "@/showcases/registry";

const ALL = "all";

/** 제목·설명·사용 skill을 대소문자 무시 부분일치로 검색한다. */
function matchesQuery(entry: ShowcaseEntry, query: string): boolean {
  if (!query) return true;
  const haystack = [
    entry.meta.title,
    entry.meta.description,
    ...entry.meta.usedSkills,
  ]
    .join(" ")
    .toLowerCase();

  // 공백으로 나눈 토큰을 전부 만족해야 한다 (AND).
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

/**
 * 갤러리 목록 + 필터/검색.
 *
 * `useSearchParams`를 쓰므로 호출부는 반드시 `<Suspense>`로 감싸야 한다.
 * 감싸지 않으면 개발 서버는 통과하고 프로덕션 빌드에서 실패한다.
 */
export function GalleryBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? ALL;
  const query = searchParams.get("q") ?? "";

  const visible = useMemo(() => {
    return SHOWCASE_ENTRIES.filter((entry) => {
      const categoryMatched = category === ALL || entry.meta.category === category;
      return categoryMatched && matchesQuery(entry, query);
    });
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
    router.replace(queryString ? `/?${queryString}` : "/", { scroll: false });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
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
          {TECHNIQUE_CATEGORIES.map((value) => (
            <FilterChip
              key={value}
              label={TECHNIQUE_CATEGORY_LABELS[value]}
              active={category === value}
              onClick={() => updateParam("category", value)}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState hasFilter={category !== ALL || query !== ""} />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <ShowcaseCard key={entry.slug} entry={entry} />
          ))}
        </ul>
      )}
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

/** 갤러리 카드. 라이브 캔버스 없이 정적 썸네일만 보여준다 (PRD 13절). */
function ShowcaseCard({ entry }: { entry: ShowcaseEntry }) {
  const { slug, meta, thumbnail } = entry;

  // 썸네일 상태: 로딩 중(스켈레톤) → 로드됨 / 실패(이니셜 플레이스홀더, PRD 16절).
  const [thumbStatus, setThumbStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );

  return (
    <li>
      <Link
        href={`/showcase/${slug}`}
        className="group flex h-full flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-neutral-800 dark:hover:border-neutral-600"
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-neutral-100 text-2xl font-semibold text-neutral-400 dark:bg-neutral-900">
          {thumbStatus === "failed" ? (
            meta.title.slice(0, 1)
          ) : (
            <>
              {thumbStatus === "loading" && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-pulse bg-neutral-200 motion-reduce:animate-none dark:bg-neutral-800"
                />
              )}
              {/*
                썸네일은 이미 800x450 최적 크기 webp라 next/image 리사이징
                이득이 없고, 정적 자산이라 네이티브 loading="lazy"가 더
                단순하고 예측 가능하다.
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                width={800}
                height={450}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                // 캐시된 이미지는 onLoad가 안 불릴 수 있으므로 마운트 시
                // complete를 직접 확인한다. 렌더 중 setState를 피하려 rAF로 미룬다.
                ref={(img) => {
                  if (img?.complete && img.naturalWidth > 0) {
                    requestAnimationFrame(() => setThumbStatus("loaded"));
                  }
                }}
                onLoad={() => setThumbStatus("loaded")}
                onError={() => setThumbStatus("failed")}
              />
            </>
          )}
        </div>

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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  if (!hasFilter) {
    return (
      <p className="py-16 text-center text-neutral-500">
        아직 등록된 데모가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-neutral-500">일치하는 결과가 없습니다.</p>
      <Link href="/" className="text-sm underline">
        필터 초기화
      </Link>
    </div>
  );
}
