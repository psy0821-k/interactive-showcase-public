"use client";

import type { ReactNode } from "react";

/** 스크롤 데모 공통 셸이 받는 props. */
interface ScrollDemoShellProps {
  /** 데모 제목 */
  title: string;
  /** 이 데모가 시연하는 것 한 줄 설명 */
  summary: string;
  /** 스크롤 안내 문구. 생략 시 기본값. */
  scrollHint?: string;
  /**
   * 본문 배경을 투명하게 둔다. 데모가 자체 fixed 배경 레이어를 쓸 때
   * (예: 배경색 전환) 셸의 불투명 배경이 그것을 덮지 않도록.
   */
  transparent?: boolean;
  /**
   * 셸 상단 정보 헤더를 sticky로 두지 않고 함께 스크롤되게 한다.
   * 데모가 자체 fixed/sticky 상단 바를 쓸 때(예: 스크롤 방향 헤더) 두 헤더가
   * 겹치지 않도록.
   */
  stickyHeader?: boolean;
  /** 데모 본문(스크롤되는 섹션들) */
  children: ReactNode;
}

/**
 * `/gsap-lab/{scroll 데모}` 공통 레이아웃.
 *
 * 상단에 제목·설명 배너, 그 아래 "아래로 스크롤" 안내, 이어서 데모 본문.
 * 스크롤 데모들이 이 셸을 공유해 boilerplate를 없앤다.
 */
export function ScrollDemoShell({
  title,
  summary,
  scrollHint = "아래로 스크롤해 효과를 확인하세요",
  transparent = false,
  stickyHeader = true,
  children,
}: ScrollDemoShellProps) {
  return (
    <div className={transparent ? "text-neutral-100" : "bg-neutral-950 text-neutral-100"}>
      <header
        className={`${
          stickyHeader ? "sticky top-0 z-40" : "relative"
        } border-b border-white/10 bg-neutral-950/85 px-6 py-3 backdrop-blur`}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-3">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="text-sm text-white/60">{summary}</p>
        </div>
      </header>

      {/* 스크롤 유도 안내. 뒤 콘텐츠가 뷰포트 밖에 있도록 한 화면 높이를 채운다. */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-white/70">{scrollHint}</p>
        <span
          className="scroll-cue block h-10 w-6 rounded-full border-2 border-white/40"
          aria-hidden
        />
      </section>

      {children}

      <footer className="px-6 py-24 text-center text-sm text-neutral-500">
        GSAP Lab · 스크롤 효과 데모 · 모든 이미지 자리는 색 블록으로 대체
      </footer>
    </div>
  );
}
