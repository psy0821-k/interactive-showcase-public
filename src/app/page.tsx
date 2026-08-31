import { Suspense } from "react";
import { GalleryBrowser } from "@/components/gallery-browser";

export default function GalleryPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">3D Skill Showcase</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Claude Code skill로 만든 3D 결과물 모음입니다.
        </p>
      </header>

      {/*
        GalleryBrowser가 useSearchParams를 쓰므로 Suspense 경계가 필요하다.
        없으면 개발 서버는 통과하지만 프로덕션 빌드가 실패한다.
      */}
      <Suspense fallback={<p className="text-neutral-500">불러오는 중…</p>}>
        <GalleryBrowser />
      </Suspense>
    </main>
  );
}
