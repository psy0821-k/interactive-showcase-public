'use client';

import type { ReactNode } from 'react';

interface DemoShellProps {
  /** 데모 제목 */
  title: string;
  /** 이 데모가 시연하는 것 한 줄 설명 */
  summary: string;
  /** 본문 */
  children: ReactNode;
}

/**
 * 스크롤이 주가 아닌 데모(모션·포인터·SVG)의 공통 레이아웃.
 *
 * `ScrollDemoShell`은 "아래로 스크롤" 안내와 한 화면 높이 여백이 있어
 * 스크롤 데모용이다. 이 셸은 상단 정보 배너 + 본문만 담는다.
 */
export function DemoShell({ title, summary, children }: DemoShellProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10 bg-neutral-950/85 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-3">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="text-sm text-white/60">{summary}</p>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-neutral-950 px-6 py-16 text-center text-sm text-neutral-400">
        GSAP Lab · 모든 이미지 자리는 색 블록으로 대체
      </footer>
    </div>
  );
}
