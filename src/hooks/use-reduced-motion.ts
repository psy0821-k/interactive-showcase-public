"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** matchMedia 구독을 등록하고 해제 함수를 돌려준다. */
function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** 현재 모션 축소 여부. 클라이언트에서만 호출된다. */
function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** 서버 렌더·하이드레이션 시점 기본값. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * 사용자가 모션 축소를 원하는지 구독한다.
 *
 * `useSyncExternalStore`가 구독·해제와 SSR 불일치 방지를 함께 처리하므로
 * effect 안에서 setState를 부르지 않는다 (react-hooks/set-state-in-effect).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
