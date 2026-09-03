'use client';

import { useRef } from 'react';
import { useDrawSvgPaths } from '@/gsap-lab/primitives';
import { DemoShell } from '@/gsap-lab/demo-shell';

/** 라인 아이콘 4종. 각 아이콘은 여러 path/circle로 구성. */
const ICONS = [
  {
    label: '빠른 캡처',
    color: '#818cf8',
    paths: ['M12 4 L12 20', 'M4 12 L20 12'],
  },
  {
    label: '동기화',
    color: '#38bdf8',
    paths: [
      'M5 8 A7 7 0 0 1 19 8 L19 11 M19 8 L16 11 M19 8 L22 11',
      'M19 16 A7 7 0 0 1 5 16 L5 13 M5 16 L8 13 M5 16 L2 13',
    ],
  },
  {
    label: '완료',
    color: '#34d399',
    paths: ['M4 13 L10 19 L20 5'],
  },
  {
    label: '공유',
    color: '#f472b6',
    paths: [
      'M8 12 L16 7',
      'M8 12 L16 17',
      'M6 12 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
      'M18 7 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
      'M18 17 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0',
    ],
  },
];

/**
 * `/gsap-lab/icon-line-trace` — 라인 아이콘 윤곽이 순서대로 그려진다.
 *
 * 모든 path에 `strokeDasharray = 길이`, `strokeDashoffset = 길이`를 세팅하고,
 * 타임라인이 아이콘 단위로 stagger하며 `strokeDashoffset`을 0으로 트윈한다.
 * 온보딩·기능 소개 화면에 자주 쓰인다.
 */
export function IconLineTracePage() {
  const container = useRef<HTMLDivElement>(null);

  // groupBy: "icon" → data-icon 값이 같은 path들이 한 라벨에 함께 그려지고,
  // 아이콘 그룹끼리는 순서대로. 트리거 예산 = 1.
  useDrawSvgPaths(container, {
    target: '.trace-path',
    trigger: '.trace-stage',
    mode: 'stagger',
    groupBy: 'icon',
    duration: 0.6,
  });

  return (
    <DemoShell
      title="아이콘 라인 트레이스"
      summary="여러 라인 아이콘의 stroke가 순서대로 그려진다 (strokeDashoffset stagger)"
    >
      <div ref={container}>
        <div className="flex min-h-[70vh] items-center justify-center px-6 text-white/60">
          아래로 스크롤하세요
        </div>
        <div className="trace-stage mx-auto grid max-w-3xl gap-8 px-6 py-24 sm:grid-cols-4">
          {ICONS.map((icon, iconIndex) => (
            <div key={icon.label} className="flex flex-col items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-20 w-20" aria-hidden>
                {icon.paths.map((d, i) => (
                  <path
                    key={i}
                    className="trace-path"
                    data-icon={iconIndex}
                    d={d}
                    fill="none"
                    stroke={icon.color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
              <span className="text-sm text-white/70">{icon.label}</span>
            </div>
          ))}
        </div>
        <p className="pb-10 text-center text-sm text-white/50">
          스크롤해 뷰포트에 들어오면 아이콘이 순서대로 그려집니다.
        </p>
      </div>
    </DemoShell>
  );
}
