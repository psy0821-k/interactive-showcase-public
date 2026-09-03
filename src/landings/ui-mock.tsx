import type { ReactNode } from "react";

/** 목업 종류. 랜딩 주제에 맞춰 고른다. */
export type UiMockKind =
  | "dashboard"
  | "note"
  | "chart"
  | "sync"
  | "roadmap"
  | "grid";

interface UiMockProps {
  kind: UiMockKind;
  /** 강조색. 기본 파랑. */
  accent?: string;
  /** 추가 클래스 (크기·여백). */
  className?: string;
}

/**
 * 이미지 에셋 없이 인라인 SVG로 그린 "제품 스크린샷 자리" 목업.
 * `viewBox` 기반이라 어떤 크기로도 늘어난다. 장식이므로 `aria-hidden`.
 */
export function UiMock({ kind, accent = "#38bdf8", className = "" }: UiMockProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-neutral-900 ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 320 200" className="h-full w-full" role="presentation">
        {renderMock(kind, accent)}
      </svg>
    </div>
  );
}

function renderMock(kind: UiMockKind, accent: string): ReactNode {
  switch (kind) {
    case "dashboard":
      return (
        <>
          <rect width="320" height="200" fill="#0f172a" />
          <rect width="56" height="200" fill="#111c33" />
          <rect x="10" y="14" width="36" height="12" rx="3" fill={accent} />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x="10"
              y={40 + i * 18}
              width="36"
              height="10"
              rx="2"
              fill="#25344d"
            />
          ))}
          <rect x="68" y="12" width="90" height="12" rx="3" fill="#334155" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={68 + i * 84}
              y={36}
              width="76"
              height="52"
              rx="6"
              fill="#1b2a42"
            />
          ))}
          <rect x="72" y="44" width="30" height="8" rx="2" fill={accent} />
          <rect x="68" y="100" width="244" height="88" rx="6" fill="#1b2a42" />
          <polyline
            points="80,160 110,130 140,145 170,110 200,135 230,100 260,120 296,95"
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
        </>
      );
    case "note":
      return (
        <>
          <rect width="320" height="200" fill="#0b1220" />
          <rect x="40" y="16" width="240" height="168" rx="10" fill="#f8fafc" />
          <rect x="60" y="34" width="150" height="14" rx="3" fill="#0f172a" />
          <rect x="60" y="60" width="44" height="10" rx="2" fill={accent} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x="60"
              y={84 + i * 16}
              width={i % 3 === 2 ? 110 : 200}
              height="8"
              rx="2"
              fill="#cbd5e1"
            />
          ))}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={60 + i * 70}
              y="166"
              width="10"
              height="10"
              rx="2"
              fill="none"
              stroke={accent}
              strokeWidth="2"
            />
          ))}
        </>
      );
    case "chart":
      return (
        <>
          <rect width="320" height="200" fill="#0f172a" />
          <rect x="16" y="16" width="288" height="168" rx="8" fill="#1b2a42" />
          {[0.4, 0.7, 0.5, 0.9, 0.6, 1, 0.75, 0.55].map((v, i) => (
            <rect
              key={i}
              x={32 + i * 34}
              y={168 - v * 130}
              width="20"
              height={v * 130}
              rx="3"
              fill={i === 5 ? accent : "#3b5170"}
            />
          ))}
        </>
      );
    case "sync":
      return (
        <>
          <rect width="320" height="200" fill="#0b1220" />
          {[70, 250].map((cx) => (
            <g key={cx}>
              <rect x={cx - 34} y={64} width="68" height="72" rx="8" fill="#1b2a42" />
              <rect x={cx - 24} y={78} width="48" height="8" rx="2" fill={accent} />
              <rect x={cx - 24} y={94} width="40" height="6" rx="2" fill="#475569" />
              <rect x={cx - 24} y={106} width="44" height="6" rx="2" fill="#475569" />
            </g>
          ))}
          <path
            d="M104 100 h112"
            stroke={accent}
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <circle cx="160" cy="100" r="14" fill="#0b1220" stroke={accent} strokeWidth="3" />
          <path d="M154 100 l4 4 l8 -8" stroke={accent} strokeWidth="3" fill="none" />
        </>
      );
    case "roadmap":
      return (
        <>
          <rect width="320" height="200" fill="#0f172a" />
          <path d="M24 100 h272" stroke="#334155" strokeWidth="3" />
          {[60, 160, 260].map((cx, i) => (
            <g key={cx}>
              <circle
                cx={cx}
                cy="100"
                r="12"
                fill={i === 0 ? accent : "#1b2a42"}
                stroke={accent}
                strokeWidth="3"
              />
              <rect
                x={cx - 30}
                y={i % 2 ? 128 : 48}
                width="60"
                height="24"
                rx="5"
                fill="#1b2a42"
              />
            </g>
          ))}
        </>
      );
    case "grid":
      return (
        <>
          <rect width="320" height="200" fill="#0f172a" />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => {
              const v = 0.3 + 0.7 * Math.abs(Math.sin(r * 2 + c));
              return (
                <rect
                  key={`${r}-${c}`}
                  x={24 + c * 46}
                  y={40 + r * 38}
                  width="34"
                  height="26"
                  rx="4"
                  fill={accent}
                  opacity={v}
                />
              );
            }),
          )}
        </>
      );
  }
}
