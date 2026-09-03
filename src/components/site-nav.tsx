"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 갤러리 트랙 링크. 상세 페이지(`/showcase/*`)에서도 맥락이 유지된다. */
const LINKS = [
  { href: "/", label: "3D" },
  { href: "/gsap-lab", label: "GSAP Lab" },
  { href: "/landings", label: "Landings" },
] as const;

/**
 * 사이트 상단 네비게이션. 3D 갤러리와 GSAP 갤러리를 오간다.
 *
 * `layout.tsx`의 `<body>` 최상단에 놓여 모든 페이지에 표시된다.
 * 현재 경로가 어느 트랙에 속하는지는 pathname 접두사로 판단한다.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-6 py-3">
        <span className="mr-3 text-sm font-semibold">Skill Showcase</span>
        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3 py-1 text-sm ${
                active
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
