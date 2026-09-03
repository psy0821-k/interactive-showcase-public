'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * 캔버스 자리를 채우는 로딩 표시.
 *
 * 두 곳에서 쓴다 (`showcase-canvas.tsx`):
 * - `dynamic()`의 `loading` — Scene 청크 다운로드 중
 * - `<Suspense>`의 `fallback` — glb/hdr/텍스처 등 에셋 로딩 중
 *
 * `role="status"` + `aria-label`로 스크린리더에 상태를 알린다.
 * `prefers-reduced-motion`이면 회전 애니메이션 대신 정적 텍스트만 보인다
 * (accessible-3d 10단계 — reduced-motion에서 "정지"가 아니라 "의미 유지").
 */
export function SceneLoading() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-label="3D 씬을 불러오는 중"
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-900 text-sm text-neutral-400"
    >
      {!reducedMotion && (
        <span
          aria-hidden="true"
          className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300"
        />
      )}
      <span>불러오는 중…</span>
    </div>
  );
}
