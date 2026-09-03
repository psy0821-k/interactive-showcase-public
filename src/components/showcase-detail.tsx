'use client';

import Link from 'next/link';
import { findShowcase } from '@/showcases/registry';
import { ShowcaseCanvas } from './showcase-canvas';

interface Props {
  slug: string;
  /** 서버에서 렌더한 제목. 캔버스 대체 텍스트 폴백에 쓴다. */
  title: string;
}

/**
 * 쇼케이스 상세의 인터랙티브 영역.
 *
 * 텍스트 콘텐츠(제목·설명·태그)와 뒤로가기 버튼은 SEO·접근성·레이아웃을
 * 위해 서버 컴포넌트인 `page.tsx`가 렌더한다(뒤로가기는 `BackButton`).
 * 이 클라이언트 컴포넌트는 three.js 캔버스만 담당한다. registry는 클라이언트
 * 전용(glob thunk 보유)이라 slug 유효성도 여기서 한 번 더 본다 — 없으면
 * 안내 후 갤러리로 유도한다.
 */
export function ShowcaseDetail({ slug, title }: Props) {
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

  // 캔버스 스크린리더 라벨: meta.a11yLabel이 있으면 그것을,
  // 없으면 제목만 쓴다. description은 코드 식별자가 섞여 낭독에 부적합하다.
  const canvasLabel = entry.meta.a11yLabel ?? `${title} 3D 씬`;

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/*
        touch-pan-y: 모바일에서 캔버스 위 한 손가락 세로 스와이프를 브라우저
        스크롤로 넘긴다. <OrbitControls>의 touches가 한 손가락을 비워두므로
        (showcase-canvas.tsx) 씬 조작과 경합하지 않는다. (ISSUE-44)
      */}
      <div className="h-[60vh] w-full touch-pan-y overflow-hidden rounded-lg bg-neutral-900 lg:h-[70vh]">
        {/* key={slug}: 다른 상세로 이동 시 캔버스를 재마운트해 로딩 상태를
            깨끗이 되돌린다 (showcase-canvas.tsx의 sceneLoading). */}
        <ShowcaseCanvas key={slug} slug={slug} label={canvasLabel} />
      </div>
    </div>
  );
}
