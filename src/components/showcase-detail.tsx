"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveTrack } from "@/domain/showcase";
import { findShowcase } from "@/showcases/registry";
import { ShowcaseCanvas } from "./showcase-canvas";

/** 트랙별 갤러리 경로. */
const GALLERY_PATH = { "3d": "/", gsap: "/gsap" } as const;

interface Props {
  slug: string;
  /** 서버에서 렌더한 제목·설명. 캔버스 대체 텍스트 조립에 쓴다. */
  title: string;
  description: string;
}

/**
 * 쇼케이스 상세의 인터랙티브 영역.
 *
 * 텍스트 콘텐츠(제목·설명·태그)는 SEO·접근성을 위해 서버 컴포넌트인
 * `page.tsx`가 렌더한다. 이 클라이언트 컴포넌트는 three.js 캔버스와
 * 뒤로가기만 담당한다. registry는 클라이언트 전용(glob thunk 보유)이라
 * slug 유효성도 여기서 한 번 더 본다 — 없으면 안내 후 갤러리로 유도한다.
 */
export function ShowcaseDetail({ slug, title, description }: Props) {
  const router = useRouter();
  const entry = findShowcase(slug);

  if (!entry) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-neutral-500">요청한 데모를 찾을 수 없습니다.</p>
        <Link href="/" className="text-sm underline">
          갤러리로 돌아가기
        </Link>
      </div>
    );
  }

  const galleryPath = GALLERY_PATH[resolveTrack(entry.meta)];

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/*
        갤러리에서 진입했으면 router.back()이 스크롤 위치까지 복원한다.
        직접 URL로 들어온 경우를 위해 트랙에 맞는 갤러리로 폴백한다.
      */}
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push(galleryPath);
        }}
        className="self-start text-sm text-neutral-500 underline"
      >
        ← 갤러리로 돌아가기
      </button>

      {/*
        touch-pan-y: 모바일에서 캔버스 위 한 손가락 세로 스와이프를 브라우저
        스크롤로 넘긴다. <OrbitControls>의 touches가 한 손가락을 비워두므로
        (showcase-canvas.tsx) 씬 조작과 경합하지 않는다. (ISSUE-44)
      */}
      <div className="h-[60vh] w-full touch-pan-y overflow-hidden rounded-lg bg-neutral-900 lg:h-[70vh]">
        {/* key={slug}: 다른 상세로 이동 시 캔버스를 재마운트해 로딩 상태를
            깨끗이 되돌린다 (showcase-canvas.tsx의 sceneLoading). */}
        <ShowcaseCanvas
          key={slug}
          slug={slug}
          label={`${title} — ${description}`}
        />
      </div>
    </div>
  );
}
