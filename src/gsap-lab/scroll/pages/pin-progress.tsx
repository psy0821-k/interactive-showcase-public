'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import {
  pinnedTriggerDefaults,
  refreshAfterLayout,
  viewportScrollLength,
  withResponsiveScroll,
} from '@/gsap-lab/scroll/scroll-trigger-setup';
import { ScrollDemoShell } from '@/gsap-lab/scroll/scroll-demo-shell';

const STEPS = [
  { title: '1. 아이디어를 적는다', background: '#172554' },
  { title: '2. 관련 노트가 자동 연결된다', background: '#1e3a8a' },
  { title: '3. 팀과 공유한다', background: '#1d4ed8' },
  { title: '4. 완성된 문서로 게시한다', background: '#3b82f6' },
];

/**
 * `/gsap-lab/pin-progress` — 섹션 고정 + 내부 단계 진행.
 *
 * `pin: true`로 섹션을 화면에 고정하고, 그 구간(`end: "+=..."`) 동안
 * 하나의 타임라인이 스크럽으로 진행되며 단계 패널이 교체된다.
 * 데스크탑에서만 핀 — 모바일은 일반 순차 등장(스킬 모바일 2절).
 */
export function PinProgressPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    refreshAfterLayout();

    if (reduced) {
      g.set('.pin-step', { autoAlpha: 1, y: 0 });
      return;
    }

    withResponsiveScroll(g, {
      // 데스크탑: 섹션을 핀 고정하고 스크럽으로 단계를 넘긴다.
      desktop: () => {
        g.set('.pin-step', { autoAlpha: 0, y: 30 });
        const tl = g.timeline({
          scrollTrigger: {
            ...pinnedTriggerDefaults,
            trigger: '.pin-stage',
            start: 'top top',
            end: viewportScrollLength(2.4, 1.4),
            pin: true,
            scrub: 1,
          },
        });
        STEPS.forEach((_, index) => {
          tl.to(`.pin-step[data-index="${index}"]`, {
            autoAlpha: 1,
            y: 0,
            duration: 1,
          });
          if (index < STEPS.length - 1) {
            tl.to(`.pin-step[data-index="${index}"]`, {
              autoAlpha: 0,
              y: -30,
              duration: 1,
            });
          }
        });
      },
      // 모바일: 핀 없이 뷰포트 진입 시 순차 등장(iOS 관성 충돌 회피).
      mobile: () => {
        g.set('.pin-step', { autoAlpha: 0, y: 24 });
        g.to('.pin-step', {
          autoAlpha: 1,
          y: 0,
          stagger: 0.2,
          scrollTrigger: {
            trigger: '.pin-stage',
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });
      },
    });
  }, container);

  return (
    <div ref={container}>
      <ScrollDemoShell
        title="핀 스크롤링"
        summary="섹션이 고정된 채 스크롤로 내부 단계가 진행된다 (pin + scrub 타임라인)"
      >
        {/*
          데스크탑: 스텝을 겹쳐 쌓아(sm:absolute) 핀 구간에서 교체.
          모바일: 세로로 흐르게(relative) 순차 등장.
        */}
        <section className="pin-stage relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden py-20 sm:block sm:py-0">
          <div className="relative mx-auto flex w-[80vw] max-w-2xl flex-col gap-6 sm:h-[50vh] sm:block">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                data-index={index}
                className="pin-step gsap-reveal flex min-h-[40vh] items-center justify-center rounded-3xl p-10 text-center text-2xl font-semibold text-white sm:absolute sm:inset-0 sm:min-h-0"
                style={{ background: step.background }}
              >
                {step.title}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 py-32 text-center text-white/60">
          데스크탑에서는 섹션이 고정되고 스크롤이 단계를 넘깁니다. 모바일에서는
          핀 없이 순차 등장으로 대체됩니다(성능·관성 충돌 방지).
        </section>
      </ScrollDemoShell>
    </div>
  );
}
