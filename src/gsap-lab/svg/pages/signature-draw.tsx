"use client";

import { useRef } from "react";
import { useDrawSvgPaths } from "@/gsap-lab/primitives";
import { DemoShell } from "@/gsap-lab/demo-shell";

/**
 * 필기체 서명 path (여러 획). 실무에서는 디자이너가 준 `.svg`의 `<path d>`를
 * 그대로 붙여넣거나 빌드 타임에 추출한다 — 이 배열이 그 결과물에 해당한다.
 * 획 순서 = 그려지는 순서이므로 export 시 순서를 맞춰야 한다.
 */
const STROKES = [
  "M20 90 C 30 40, 50 40, 55 80 S 70 120, 85 70",
  "M95 55 C 95 90, 100 100, 115 95",
  "M120 60 L 120 100 M120 75 C 130 60, 150 60, 150 100",
  "M165 70 C 155 70, 155 95, 170 95 S 185 70, 170 70 Z",
  "M195 45 L 195 100 M195 75 C 205 62, 225 62, 225 100",
  "M240 70 C 232 70, 232 96, 246 96 S 262 72, 248 70",
  "M270 50 L 270 100",
  "M285 72 C 285 96, 292 100, 305 94 M285 80 L 305 74",
];

/**
 * `/gsap-lab/signature-draw` — 손글씨 서명이 써지듯 그려진다.
 *
 * 각 획의 `getTotalLength()`로 `strokeDasharray`를 세팅하고, 타임라인이
 * `strokeDashoffset`을 길이 → 0으로 순차(stagger) 트윈한다. 뷰포트 진입 시 재생.
 */
export function SignatureDrawPage() {
  const container = useRef<HTMLDivElement>(null);

  useDrawSvgPaths(container, {
    target: ".sig-stroke",
    trigger: ".sig-stage",
    mode: "stagger",
    duration: 0.5,
    stagger: 0.18,
  });

  return (
    <DemoShell
      title="서명 그리기"
      summary="필기체 서명이 한 획씩 써지듯 그려진다 (getTotalLength + strokeDashoffset 스태거)"
    >
      <div ref={container}>
      {/* 스크롤 유도: 서명이 뷰포트 밖에서 시작하도록 */}
      <div className="flex min-h-[70vh] items-center justify-center px-6 text-white/60">
        아래로 스크롤하세요
      </div>
      <div
        className="sig-stage flex min-h-[70vh] items-center justify-center px-6"
      >
        <svg viewBox="0 0 330 130" className="w-full max-w-xl" aria-label="서명 애니메이션">
          {STROKES.map((d, i) => (
            <path
              key={i}
              className="sig-stroke"
              d={d}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
      <p className="pb-10 text-center text-sm text-white/50">
        스크롤해 뷰포트에 들어오면 그려집니다. 되감으면 지워집니다.
      </p>
      </div>
    </DemoShell>
  );
}
