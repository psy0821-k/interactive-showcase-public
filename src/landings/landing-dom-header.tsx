"use client";

import Link from "next/link";
import { useState } from "react";
import type { LandingEntry } from "./registry";

/**
 * `/landings/{slug}` 상단 공통 헤더 — breadcrumb + caveat + "요구사항" 패널.
 *
 * R3F 랜딩은 `LandingShell`이 내부에서 이 컴포넌트를 렌더하고, 순수 DOM 랜딩
 * (scroll-story 등)은 `landings/[slug]/page.tsx`가 페이지 컴포넌트 앞에 직접
 * 붙인다. 두 경로가 같은 상단 맥락을 공유하도록 한 곳에 모은다.
 */
export function LandingDomHeader({ entry }: { entry: LandingEntry }) {
  // "요구사항" 패널 펼침 상태 (per-viewer 편의, localStorage 불필요).
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <>
      {/* breadcrumb */}
      <nav
        aria-label="탐색 위치"
        className="relative z-30 border-b border-neutral-200 bg-neutral-50 px-6 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/landings"
            className="text-neutral-600 hover:underline dark:text-neutral-400"
          >
            ← Landings
          </Link>
          <span className="text-neutral-600 dark:text-neutral-400">/</span>
          <span className="font-medium">{entry.title}</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {entry.usedSkills.map((skill) => (
              <code
                key={skill}
                className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {skill}
              </code>
            ))}
          </span>
        </div>
      </nav>

      {entry.caveat && (
        <p className="relative z-30 mx-auto max-w-6xl border-b border-neutral-200 bg-neutral-50 px-6 pb-3 text-xs text-amber-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-amber-500">
          <span className="font-semibold">적용 한계</span> · {entry.caveat}
        </p>
      )}

      {/* 요구사항 패널 */}
      <section className="relative z-30 border-b border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => setPromptOpen((v) => !v)}
            aria-expanded={promptOpen}
            className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
          >
            <span aria-hidden>{promptOpen ? "▾" : "▸"}</span>
            이 페이지를 만들 때 정의한 요구사항
          </button>
          {promptOpen && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-100 p-4 text-xs leading-relaxed whitespace-pre-wrap text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              {entry.prompt}
            </pre>
          )}
        </div>
      </section>
    </>
  );
}
