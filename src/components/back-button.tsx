"use client";

import { useRouter } from "next/navigation";

interface Props {
  /** history가 없을 때(직접 URL 진입) 이동할 갤러리 경로. */
  fallbackHref: string;
  /** 버튼 텍스트. 기본 "← 갤러리로 돌아가기". */
  label?: string;
}

/**
 * 상세 페이지의 "뒤로가기" 버튼.
 *
 * 갤러리에서 진입했으면 router.back()이 스크롤 위치까지 복원한다.
 * 직접 URL로 들어온 경우를 위해 fallbackHref로 폴백한다.
 */
export function BackButton({
  fallbackHref,
  label = "← 갤러리로 돌아가기",
}: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="self-start text-sm text-neutral-500 underline"
    >
      {label}
    </button>
  );
}
