"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";

/**
 * 스크롤 진행률(0~1)을 지수 감쇠로 부드럽게 뒤따르는 값을 매 프레임 계산한다.
 *
 * ScrollTrigger의 `scrub`이 원본 진행률에 이미 고무줄을 주므로, 대부분의 씬은
 * `smooth: false`로 원본을 그대로 쓴다(감쇠를 한 겹 더 걸면 스크롤을 멈춘 뒤에도
 * 3D가 한참 움직여 굼뜨고, 감쇠가 목표에 정확히 닿지 못해 "스크롤 끝인데 3D는
 * 덜 진행된" 상태가 남는다).
 *
 * 카메라를 경로로 모는 씬(리본 등)만 `smooth: true`로 감쇠를 켠다.
 *
 * @param source 원본 진행률 ref (LandingShell이 ScrollTrigger로 갱신).
 * @param options.smooth true면 지수 감쇠, false(기본)면 원본 그대로.
 * @param options.stiffness 감쇠 세기(smooth일 때만). 기본 6.
 * @returns 씬의 useFrame 콜백에서 `.current`로 읽을 진행률 ref.
 */
export function useEasedProgress(
  source: RefObject<number>,
  options: { smooth?: boolean; stiffness?: number } = {},
): RefObject<number> {
  const { smooth = false, stiffness = 6 } = options;
  const value = useRef(0);

  useFrame((_, delta) => {
    if (!smooth) {
      value.current = source.current;
      return;
    }
    // delta 클램프 — 탭 복귀 시 큰 delta로 순간이동하는 것 방지.
    const step = 1 - Math.exp(-stiffness * Math.min(delta, 0.1));
    value.current += (source.current - value.current) * step;
  });

  return value;
}
