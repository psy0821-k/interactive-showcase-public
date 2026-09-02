"use client";

import { useRef } from "react";
import { usePinnedTimeline } from "@/gsap-lab/primitives";
import { ScrollDemoShell } from "@/gsap-lab/scroll/scroll-demo-shell";

/**
 * `/gsap-lab/hero-to-section` — 히어로 이미지가 축소되며 다음 섹션 카드로.
 *
 * 기법:
 * - 스테이지를 길게(`h-[300vh]`) 만들고 그 안에 `sticky`로 붙은 창을 둔다.
 *   이 창은 스테이지가 스크롤되는 내내 화면에 남는다 → 이미지가 사라지지 않음.
 * - 창 안에서 이미지가 전체 화면 → 좌상단 작은 썸네일로 `scrub` 축소·이동.
 * - 동시에 카드 본문(제목·설명)이 페이드인해 "썸네일이 붙은 카드"가 완성된다.
 * - `Flip` 같은 유료 플러그인 없이 transform 트윈만 사용.
 *
 * 성능(gsap-dom-performance 3절): DOM 박스는 최종 썸네일 크기(THUMB×THUMB)로
 * **고정**하고, 크기 변화는 `width`/`height`가 아니라 `scaleX`/`scaleY`로 준다.
 * width/height 트윈은 매 프레임 레이아웃 재계산을 일으키지만 scale은 컴포지터
 * 처리라 리플로우가 없다. 시작·끝의 종횡비가 다르므로 x·y 축 스케일을 분리한다.
 */
export function HeroToSectionPage() {
  const container = useRef<HTMLDivElement>(null);

  // GSAP은 `min(88vw, 56rem)` 같은 CSS 함수값을 보간하지 못한다 —
  // 시작 크기를 **px 실측값** 함수형으로 넘겨 refresh 때 재계산한다.
  const isMobile = () => window.innerWidth < 768;
  const THUMB = 160; // 10rem — DOM 박스의 고정 크기
  const startW = () =>
    isMobile()
      ? window.innerWidth * 0.92
      : Math.min(window.innerWidth * 0.88, 896); // 56rem = 896px
  const startH = () => window.innerHeight * (isMobile() ? 0.44 : 0.62);
  // 시작 시 THUMB 박스를 큰 화면 크기로 보이게 하는 축별 배율.
  const startScaleX = () => startW() / THUMB;
  const startScaleY = () => startH() / THUMB;
  const endInset = () => (isMobile() ? 24 : 40);
  // 스케일된 박스가 화면 중앙에 오도록 좌상단 좌표를 유도한다
  // (transformOrigin: left top 기준).
  const startX = () => window.innerWidth / 2 - startW() / 2;
  const startY = () => window.innerHeight / 2 - startH() / 2;

  usePinnedTimeline(
    container,
    {
      trigger: ".morph-stage",
      // 고정은 CSS `position: sticky`가 담당한다 → GSAP pin 끔.
      pin: false,
      length: "bottom bottom",
      defaults: { ease: "none" },
    },
    ({ tl }) => {
      tl.fromTo(
        ".morph-image",
        {
          scaleX: startScaleX,
          scaleY: startScaleY,
          x: startX,
          y: startY,
          transformOrigin: "left top",
          // 시작 시 x축이 startScaleX배 확대되므로 radius를 그만큼 나눠
          // 화면에서 12px로 보이게 한다.
          "--r": () => 12 / startScaleX() + "px",
        },
        {
          scaleX: 1,
          scaleY: 1,
          x: endInset,
          y: endInset,
          "--r": "12px",
          duration: 0.7,
        },
      )
        .fromTo(
          ".hero-copy",
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -40, duration: 0.35 },
          0,
        )
        .fromTo(
          ".card-body",
          { autoAlpha: 0, x: 30 },
          { autoAlpha: 1, x: 0, duration: 0.3 },
          0.45,
        )
        .to({}, { duration: 0.25 });
    },
    (g) => {
      // 모션 축소: 이미지를 최종(썸네일) 상태로 고정.
      const inset = window.innerWidth < 768 ? 24 : 40;
      g.set(".morph-image", {
        scaleX: 1,
        scaleY: 1,
        x: inset,
        y: inset,
        transformOrigin: "left top",
        "--r": "12px",
      });
      g.set(".card-body", { autoAlpha: 1, x: 0 });
    },
  );

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="히어로 → 섹션 이동"
        summary="전체 화면 이미지가 축소되며 카드의 썸네일 자리로 이동 (sticky 창 + scrub)"
      >
        <section className="morph-stage relative h-[200vh]">
          <div className="sticky top-0 h-screen w-full overflow-hidden bg-neutral-900">
            {/* 축소·이동하는 이미지. DOM 박스는 최종 썸네일 크기(160×160)로
                고정하고 크기 변화는 GSAP `scaleX`/`scaleY`가 준다. 위치도 GSAP이
                x/y(px)로 제어하므로 left/top은 0에 고정.
                border-radius는 GSAP `--r`(px) 변수를 scale에 반비례로 트윈해
                화면에서 항상 12px로 보이도록 역보정한다. */}
            <div
              className="morph-image absolute left-0 top-0"
              style={{
                width: 160,
                height: 160,
                borderRadius: "var(--r, 12px)",
                background: "linear-gradient(135deg, #1e1b4b, #be185d)",
              }}
              aria-hidden
            />

            {/* 히어로 카피 (초반) */}
            <div className="hero-copy absolute inset-0 z-10 flex items-center justify-center">
              <div className="max-w-xl px-6 text-center">
                <h2 className="text-4xl font-semibold sm:text-5xl">
                  하나의 이미지, 두 개의 역할
                </h2>
                <p className="mt-4 text-white/75">
                  스크롤하면 이 이미지가 왼쪽 위 카드 썸네일 자리로 축소되어
                  들어갑니다.
                </p>
              </div>
            </div>

            {/* 완성되는 카드 본문 (후반). 모바일은 썸네일 아래, 데스크탑은 오른쪽. */}
            <div className="card-body absolute left-6 top-44 max-w-md pr-6 sm:left-[13rem] sm:top-8">
              <h3 className="text-2xl font-semibold">아티클 카드</h3>
              <p className="mt-3 text-white/75">
                히어로에서 넘어온 이미지가 이 카드의 썸네일이 됩니다. 크기·위치가
                스크롤 진행에 직결되어 있어, 되감으면 다시 전체 화면으로
                커집니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          스테이지를 벗어나면 이미지는 축소된 상태로 남고, 이후 콘텐츠가 이어서
          스크롤됩니다.
        </section>
      </ScrollDemoShell>
    </div>
  );
}
