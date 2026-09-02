"use client";

import { useRef, useState } from "react";
import type gsap from "gsap";
import { useGsapDom } from "@/hooks/use-gsap-dom";
import { DemoShell } from "@/gsap-lab/demo-shell";

/**
 * 블롭 모양들. **네 path 모두 커맨드 구조가 동일**하다 —
 * `M` + `C`×4 + `Z`, 좌표 개수도 같다. GSAP 기본 AttrPlugin은 이 조건에서만
 * `d` 문자열의 숫자들을 짝지어 보간한다.
 *
 * ⚠️ 적용 한계: 커맨드 개수·종류가 다른 두 모양(예: 별 → 원) 사이 모핑은
 * 이 방식으로 안 된다. 그 경우 유료 MorphSVG 또는 `flubber` 같은
 * 경로 리샘플링 라이브러리가 필요하다.
 */
const SHAPES = [
  "M100,20 C140,20 175,55 175,100 C175,150 140,180 100,180 C55,180 25,150 25,100 C25,55 60,20 100,20 Z",
  "M100,30 C155,15 180,70 165,110 C150,160 110,175 75,165 C30,150 20,95 40,60 C55,30 75,40 100,30 Z",
  "M100,25 C130,35 170,50 170,105 C170,145 135,170 95,175 C50,180 30,140 30,95 C30,50 65,15 100,25 Z",
  "M100,20 C150,30 165,65 175,110 C180,155 130,180 90,175 C45,170 25,135 30,90 C35,45 55,10 100,20 Z",
];

/**
 * `/gsap-lab/morph-blob` — 유기적 도형이 흐물거린다.
 *
 * `attr: { d }` 트윈으로 여러 블롭 모양 사이를 무한 보간(`repeat: -1, yoyo`).
 * CSS 애니메이션·SMIL과 달리 **재생 제어**(일시정지/재개)가 가능한 것이
 * GSAP를 쓰는 이유다.
 */
export function MorphBlobPage() {
  const container = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [paused, setPaused] = useState(false);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      const path = container.current?.querySelector<SVGPathElement>(".blob-path");
      if (!path) return;

      if (reduced) {
        g.set(path, { attr: { d: SHAPES[0] } });
        return;
      }

      const tl = g.timeline({
        repeat: -1,
        yoyo: true,
        defaults: { duration: 1.6, ease: "sine.inOut" },
      });
      SHAPES.slice(1).forEach((d) => {
        tl.to(path, { attr: { d } });
      });
      tlRef.current = tl;
    },
    container,
  );

  const toggle = () => {
    const tl = tlRef.current;
    if (!tl) return;
    tl.paused(!tl.paused());
    setPaused(tl.paused());
  };

  return (
    <DemoShell
      title="블롭 모핑"
      summary="SVG path의 d 속성을 여러 모양 사이로 무한 보간 (attr: { d } 트윈, 재생 제어 가능)"
    >
      <div
        ref={container}
        className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6"
      >
        <svg viewBox="0 0 200 200" className="w-64 sm:w-80" aria-hidden>
          <defs>
            <linearGradient id="blob-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          <path className="blob-path" d={SHAPES[0]} fill="url(#blob-grad)" />
        </svg>

        <button
          type="button"
          onClick={toggle}
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-medium hover:bg-white/10"
        >
          {paused ? "재개" : "일시정지"}
        </button>
      </div>
      <p className="pb-10 text-center text-sm text-white/50">
        커맨드 구조가 같은 path끼리만 유료 플러그인 없이 `d`를 직접 트윈할 수
        있습니다. 별 → 원처럼 구조가 다르면 MorphSVG나 flubber가 필요합니다.
      </p>
    </DemoShell>
  );
}
