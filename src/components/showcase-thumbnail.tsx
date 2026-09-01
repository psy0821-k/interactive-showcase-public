"use client";

import { useState } from "react";

interface Props {
  src: string;
  /** 로드 실패 시 보여줄 이니셜 (제목 첫 글자). */
  fallbackInitial: string;
  /** above-the-fold 카드는 true — 썸네일을 즉시 + 높은 우선순위로 받는다. */
  eager?: boolean;
}

/**
 * 갤러리 카드 썸네일. 로딩 스켈레톤·실패 플레이스홀더만 담당하는
 * 작은 클라이언트 조각. 카드 본문(제목·설명·링크)은 서버에서 렌더한다.
 */
export function ShowcaseThumbnail({ src, fallbackInitial, eager = false }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );

  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-neutral-100 text-2xl font-semibold text-neutral-400 dark:bg-neutral-900">
      {status === "failed" ? (
        fallbackInitial
      ) : (
        <>
          {status === "loading" && (
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-neutral-200 motion-reduce:animate-none dark:bg-neutral-800"
            />
          )}
          {/* 썸네일은 이미 800x450 최적 크기 webp라 next/image 리사이징
              이득이 없고, 정적 자산이라 네이티브 img가 더 단순하다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            width={800}
            height={450}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            ref={(img) => {
              if (img?.complete && img.naturalWidth > 0) {
                requestAnimationFrame(() => setStatus("loaded"));
              }
            }}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
          />
        </>
      )}
    </div>
  );
}
