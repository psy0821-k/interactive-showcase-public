'use client';

import { useRef } from 'react';
import { useParallax } from '@/gsap-lab/primitives';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

/**
 * 겹쳐 쌓인 레이어. 뒤(배경)일수록 스크롤에 크게 밀려 올라가고 앞일수록
 * 적게 움직인다. 이동량은 **뷰포트 높이 대비 비율**로 정의해 화면 크기와
 * 무관하게 같은 체감을 준다(px 하드코딩 아님).
 */
const LAYERS = [
  { label: '배경', background: '#0f172a', speed: -0.85, bottom: 0 },
  { label: '먼 산', background: '#1e293b', speed: -0.5, bottom: -40 },
  { label: '언덕', background: '#334155', speed: -0.3, bottom: -80 },
  { label: '전경', background: '#475569', speed: -0.06, bottom: -120 },
];

/**
 * `/gsap-lab/parallax-layers` — 레이어별 스크롤 속도차.
 *
 * 하단 정렬로 겹쳐 쌓은 레이어를 `y` 스크럽 + `ease: "none"`으로 서로 다른
 * 양(`innerHeight * speed`)만큼 이동시킨다. 함수형 값이라 리사이즈 후
 * `ScrollTrigger.refresh()` 때 다시 계산된다.
 */
export function ParallaxLayersPage() {
  const container = useRef<HTMLDivElement>(null);

  useParallax(container, {
    target: '.parallax-layer',
    trigger: '.parallax-stage',
  });

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="패럴랙스 레이어"
        summary="겹친 레이어가 스크롤에 서로 다른 양만큼 밀린다 (y = innerHeight × 비율, ease: none)"
      >
        <section className="parallax-stage relative h-[240vh]">
          {/* 뷰포트에 고정된 창. 그 안에서 레이어들이 서로 다른 속도로 이동. */}
          <div className="sticky top-0 flex h-screen items-end justify-center overflow-hidden">
            {LAYERS.map((layer) => (
              <div
                key={layer.label}
                data-speed={layer.speed}
                className="parallax-layer absolute left-1/2 h-[70vh] w-[92vw] max-w-4xl -translate-x-1/2 rounded-t-3xl pt-8 text-center text-sm font-semibold text-white/80"
                style={{
                  bottom: layer.bottom,
                  background: layer.background,
                }}
              >
                {layer.label} · 속도 {layer.speed}
              </div>
            ))}
            <p className="relative z-10 mb-10 rounded-full bg-black/40 px-4 py-2 text-sm text-white">
              스크롤 — 뒤 레이어가 더 빨리 올라갑니다
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/70">
          <p>
            배경 레이어는 뷰포트 높이의 절반 이상 밀려 올라가고, 전경 레이어는
            거의 제자리입니다. 되감으면 역방향으로 움직입니다.
          </p>
        </section>
      </ScrollDemoShell>
    </div>
  );
}
