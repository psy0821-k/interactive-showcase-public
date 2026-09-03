'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { useParallax } from '@/gsap-lab/primitives';
import { refreshAfterLayout, ScrollTrigger } from '@/gsap-lab/scroll/scroll-trigger-setup';
import { findLanding } from '../registry';

const KINETIC_TEXT1 = 'LANDING';
const KINETIC_TEXT2 = 'FOREST';

/**
 * 키네틱 제목 한 줄을 글자 <span>으로 쪼갠다. 공백은 `white-space: pre`로
 * 보존한다(kinetic-typography 쇼케이스와 동일). 원문은 `aria-label`,
 * 쪼갠 글자는 `aria-hidden`이라 스크린리더는 원문만 읽는다.
 *
 * 데모와 동일하게 `gsap-reveal`(opacity:0 폴백)을 붙이지 않는다 — 이 제목은
 * `fromTo`의 `immediateRender`로 시작 상태가 즉시 그려지고, reduced-motion·
 * no-script에서도 글자 자체는 보여야 한다(위치만 흩어진 상태).
 *
 * `.char`에 `data-line` 속성을 달아, GSAP 쪽에서 줄 단위로 글자를 묶어
 * 흩어짐 중심(mid)을 각 줄 안에서 따로 계산할 수 있게 한다. 여러 줄을 한
 * 배열로 보면 mid가 줄 경계에 걸려 계산이 뒤엉킨다.
 */
function SplitKineticLine({ text, line }: { text: string; line: number }) {
  return (
    <p
      className="kinetic-heading text-[14vw] font-black leading-[1.05] tracking-tight text-neutral-900 sm:text-[12vw] sm:leading-none"
      aria-label={text}
    >
      {text.split('').map((ch, index) => (
        <span key={`${ch}-${index}`} aria-hidden data-line={line} className="char inline-block" style={{ whiteSpace: 'pre' }}>
          {ch}
        </span>
      ))}
    </p>
  );
}

export function ForestPage() {
  const container = useRef<HTMLDivElement>(null);
  // 프롬프트·스킬·적용 한계는 registry가 단일 소스. 페이지에 다시 쓰지 않는다.
  const entry = findLanding('forest')!;

  // hero 레이어 패럴랙스 — parallax-layers 쇼케이스와 동일한 프리미티브.
  //
  // "속도"는 스크롤을 따라 요소가 아래로 처지는 정도다. hero 한 화면을
  // 스크롤하는 동안(=innerHeight):
  // - 나무 0   → y 트윈 없음. 화면에서 스크롤과 1:1로 위로 = 고정처럼 붙어감
  // - 산 0.5   → data-speed +0.5 → y +innerHeight*0.5. 스크롤의 절반만 따라가
  //              나머지 절반은 화면에서 "아래로 처지는" 것처럼 보인다
  // - 텍스트 0.8 → 아래 g.to로 y +innerHeight*0.8 (가장 많이 처짐)
  // data-speed 양수 = 아래로. useParallax가 y: innerHeight*speed로 트윈한다.
  useParallax(container, {
    target: '.forest-layer',
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom top',
  });

  useGsapDom(({ gsap: g, reduced }) => {
    // 폰트 로드로 레이아웃이 밀리면 트리거 위치가 어긋난다(refreshAfterLayout).
    // hero의 <Image>는 next/image라 <img> 위에서 로드되므로 폰트 ready만으로는
    // 부족하다 — hero 이미지가 모두 decode된 뒤 한 번 더 refresh해, 이미지가
    // 늦게 뜨든 캐시돼 있든 트리거 위치가 항상 같은 지점에 오게 한다.
    refreshAfterLayout();
    const heroImages = Array.from(container.current?.querySelectorAll<HTMLImageElement>('.hero-section img') ?? []);
    void Promise.all(heroImages.map(img => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined)))).then(() =>
      ScrollTrigger.refresh()
    );

    // 진행 인디케이터: 문서 전체 스크롤 진행률을 바 scaleX로.
    // width가 아니라 transform이라 매 프레임 리플로우가 없다.
    g.set('.forest-progress', { scaleX: 0, transformOrigin: 'left center' });
    g.to('.forest-progress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
      },
    });

    // story 섹션의 등장 대상은 모션과 무관하게 항상 보이게 먼저 확정.
    // (.kinetic-heading은 gsap-reveal이 없으므로 여기서 다루지 않는다 — 데모와 동일)
    g.set(['.story-copy', '.story-video'], { autoAlpha: 1 });

    if (reduced) {
      // 모션 축소: 스크럽을 걸지 않고 모든 대상을 최종(시작) 상태로 고정.
      g.set(['.forest-title', '.forest-layer'], { y: 0, autoAlpha: 1 });
      g.set(['.story-copy', '.story-video'], { x: 0 });
      g.set(['.kinetic-heading', '.char'], {
        scale: 1,
        xPercent: 0,
        x: 0,
        y: 0,
        rotation: 0,
      });
      return;
    }

    // ── 1. hero 제목 — 스크롤을 따라 아래로 처진다(속도 0.8) ──────
    // hero 한 화면 스크롤 동안 y +innerHeight*0.8만큼 아래로. 스크롤은
    // 콘텐츠를 위로 올리므로, 실제로는 화면에서 innerHeight*0.2만 위로 =
    // 스크롤을 80% 놓친 채 뒤따라오는 느낌. 산(0.5)보다 더 많이 처진다.
    // 함수형 값 + invalidateOnRefresh로 리사이즈·refresh 시 재계산.
    g.to('.forest-title', {
      y: () => window.innerHeight * 0.8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    // ── 2. story 섹션 좌우 페이드인 ───────────────────────────────
    g.from('.story-copy', {
      x: -48,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });
    g.from('.story-video', {
      x: 48,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.story-section',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    // ── 3. 키네틱 타이포 ─────────────────────────────────────────
    // kinetic-typography 쇼케이스의 구조(긴 섹션 스크럽 + 제목 전체 트윈 +
    // 글자 단위 트윈)를 따르되, 글자 흩어짐 형태만 이 페이지 전용이다(b 참고).
    // (a) 제목 전체 — scale·xPercent (transform이라 리플로우 없음)
    g.fromTo(
      '.kinetic-heading',
      { scale: 0.7, xPercent: 8 },
      {
        scale: 1.05,
        xPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.kinetic-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );

    // (b) 글자 단위 — 각 줄이 통째로 한 방향으로 기울었다가, 섹션이 중앙에
    // 올 때까지 제자리로 모인다. per-char x/y/rotation (letterSpacing 아님).
    //
    // 흩어짐 형태(데모의 `offset * 상수` 부채꼴이 아니라):
    // - 줄 진행률 t = index / (len - 1)  → 첫 글자 0, 마지막 글자 1
    // - factor = 1 - t                   → 첫 글자가 가장 크게, 뒤로 갈수록 완만(0)
    // - dir: 짝수 줄 -1(왼쪽 기울기), 홀수 줄 +1(오른쪽 기울기) — 줄마다 반대
    // 텍스트 길이와 무관하게 `factor`가 0~1이라, 줄이 길든 짧든 첫 글자의
    // 기울기·이동량은 항상 같다(데모와 다른, 이 페이지의 의도된 연출).
    // 모바일은 화면이 좁아 x(가로 이동)가 크면 글자끼리, y가 크면 줄끼리
    // 겹친다. x·y는 억제하고 rotation은 겹침에 덜 민감하니 어느 정도 살려
    // "기울었다 모임"이 보이게 한다.
    const isMobile = window.innerWidth < 640;
    const MAX_X = isMobile ? 36 : 200;
    const MAX_Y = isMobile ? 12 : 60;
    const MAX_ROTATION = isMobile ? 20 : 24;
    const allChars = container.current?.querySelectorAll<HTMLElement>('.char');
    if (allChars) {
      // 줄 단위로 글자를 묶는다 — 진행률·방향을 각 줄 안에서 따로 계산한다.
      const byLine = new Map<string, HTMLElement[]>();
      allChars.forEach(char => {
        const key = char.dataset.line ?? '0';
        const group = byLine.get(key) ?? [];
        group.push(char);
        byLine.set(key, group);
      });

      byLine.forEach((lineChars, lineKey) => {
        // 짝수 줄은 왼쪽(-1), 홀수 줄은 오른쪽(+1)으로 기운다.
        const dir = Number(lineKey) % 2 === 0 ? -1 : 1;
        const lastIndex = Math.max(lineChars.length - 1, 1);
        lineChars.forEach((char, index) => {
          // factor: 첫 글자 1(최대), 마지막 글자 0(제자리) — 뒤로 갈수록 완만.
          const factor = 1 - index / lastIndex;
          g.fromTo(
            char,
            {
              x: dir * factor * MAX_X,
              y: factor * MAX_Y,
              rotation: dir * factor * MAX_ROTATION,
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: '.kinetic-section',
                start: 'top center',
                end: 'center center',
                scrub: 1,
              },
            }
          );
        });
      });
    }
  }, container);

  return (
    <main ref={container} className="bg-white text-neutral-900">
      {/* 스크롤 진행 인디케이터 */}
      <div className="fixed left-0 top-0 z-50 h-1 w-full bg-neutral-900/10">
        <div className="forest-progress h-full w-full origin-left scale-x-0 bg-emerald-600" />
      </div>

      {/* breadcrumb — 다른 landings와 동일한 상단 맥락 */}
      <nav aria-label="탐색 위치" className="relative z-40 border-b border-neutral-200 bg-white/90 px-6 py-3 text-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/landings" className="text-neutral-500 hover:underline">
            ← Landings
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="font-medium">FOREST</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {entry.usedSkills.map(skill => (
              <code key={skill} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                {skill}
              </code>
            ))}
          </span>
        </div>
      </nav>

      {entry.caveat && (
        // 모바일에서 hero 상단을 덜 잠식하도록 2줄로 제한(전문은 아래 프롬프트
        // 패널 옆 맥락에서 확인). sm 이상은 제한 해제.
        <p className="relative z-40 mx-auto line-clamp-2 max-w-6xl border-b border-neutral-200 bg-white px-6 pb-3 text-xs text-amber-700 sm:line-clamp-none">
          <span className="font-semibold">적용 한계</span> · {entry.caveat}
        </p>
      )}

      {/* ── 1. HERO ─────────────────────────────────────────────────
          breadcrumb(~3rem)·caveat(모바일 2줄 ~4rem)가 hero 위에 쌓이므로,
          hero 최소 높이에서 그만큼(7rem) 빼 첫 화면이 hero로 꽉 차게 한다.
          콘텐츠가 넘치면 min-h가 늘어나 잘리지 않는다. */}
      <section
        aria-label="히어로"
        className="hero-section relative flex min-h-[calc(100svh-7rem)] items-center justify-center overflow-hidden bg-white py-16 text-center"
      >
        {/* 중앙: 제목 — 산(z-0)보다 앞, 나무(z-20)보다 뒤(z-10). 스크롤하면
            아래로 처지며(속도 0.8) 하단의 나무 뒤로 파고든다. */}
        <h1 className="forest-title relative z-10 px-6 text-6xl font-semibold tracking-tight text-neutral-900 sm:text-8xl md:text-9xl">FOREST</h1>

        {/* 산 레이어 — hero 전체를 덮는 배경(z-0), 낮은 opacity. data-speed
            +0.5로 아래로 처지므로 위로 60% 여유를 둬 상단에 빈틈이 없게 한다. */}
        <div className="forest-layer pointer-events-none absolute -top-[60%] bottom-0 left-0 right-0 z-0 opacity-20" data-speed={0.5} aria-hidden>
          <Image src="/forest/mountain-demo.webp" alt="" fill priority sizes="100vw" className="object-cover object-bottom" />
        </div>

        {/* 나무 레이어 — 가장 앞(z-20). 제목이 스크롤로 내려오면 이 나무 뒤로
            숨는다. 속도 0이라 패럴랙스를 걸지 않는다. 섹션 하단에 붙어 스크롤과
            1:1로 움직인다.
            원본(480×291)은 위쪽 절반이 하늘(빈 공간)이고 나무는 하단부에만
            있다. 폭을 100%로 채우고(object-cover) object-bottom으로 정렬하면
            세로로 넘치는 만큼은 위쪽 하늘부터 잘리므로 나무 자체는 잘리지 않는다.
            높이는 45vh — 좌우 큰 나무 꼭대기까지 들어오는 값. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[100vh]" aria-hidden>
          <Image src="/forest/trees-demo.webp" alt="" fill priority sizes="100vw" className="object-cover object-bottom" />
        </div>

        {/* 스크롤 유도 큐 */}
        <span
          className="scroll-cue absolute bottom-6 left-1/2 z-40 block h-10 w-6 -translate-x-1/2 rounded-full border-2 border-neutral-900/40"
          aria-hidden
        />
      </section>

      {/* ── 2. STORY ────────────────────────────────────────────── */}
      <section
        aria-labelledby="story-heading"
        className="story-section mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center gap-10 px-6 py-20 text-center md:flex-row md:text-left"
      >
        <div className="story-copy gsap-reveal md:flex-1">
          <h2 id="story-heading" className="text-2xl font-semibold sm:text-3xl">
            숲의 하루를 담다
          </h2>
          <p className="mx-auto mt-4 max-w-md text-neutral-600 md:mx-0">
            아침 안개가 걷히고 능선을 따라 빛이 번지는 순간을 그대로 옮겼습니다. 스크롤을 내리면 왼쪽 이야기와 오른쪽 영상이 각각 자리로 미끄러져
            들어옵니다.
          </p>
        </div>

        <div className="story-video gsap-reveal w-full overflow-hidden rounded-2xl border border-neutral-200 md:flex-1">
          <video
            className="aspect-video h-full w-full object-cover"
            src="/forest/forest-demo.mp4"
            poster="/forest/mountain-demo.webp"
            playsInline
            muted
            loop
            autoPlay
            preload="metadata"
            aria-hidden
          />
        </div>
      </section>

      {/* ── 3. KINETIC TYPO ─────────────────────────────────────── */}
      {/* kinetic-typography 데모와 동일하게 긴 섹션이 스크럽 구간을 만든다.
          제목은 2줄 — flex-col로 세로로 쌓고, 각 줄의 글자가 흩어졌다 모인다
          (data-line으로 줄 구분). 모바일은 스크럽 구간(섹션 높이)을 50rem으로
          고정해 빈 여백을 줄인다(min-height가 max-height를 이기므로 min만 씀).
          데스크탑은 데모대로 180vh. */}
      <section
        aria-label="타이포그래피"
        className="kinetic-section flex min-h-200 flex-col items-center justify-center gap-2 overflow-hidden bg-amber-50 px-6 text-center sm:min-h-[180vh] sm:gap-0"
      >
        <SplitKineticLine text={KINETIC_TEXT1} line={0} />
        <SplitKineticLine text={KINETIC_TEXT2} line={1} />
      </section>

      {/* ── 4. 이 페이지를 만들 때 정의한 요구사항 ───────────────── */}
      <section aria-labelledby="prompt-heading" className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 id="prompt-heading" className="text-2xl font-semibold sm:text-3xl">
          이 페이지를 만들 때 정의한 요구사항
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600">
          섹션별 연출과 제약(모바일 레이아웃, 접근성, 스크롤 트리거 안정성)을 아래처럼
          명세로 정리하고, 참고할{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">/gsap-lab</code> 데모를 지정해 지금 화면을 구현했습니다.
        </p>
        <pre className="mt-8 overflow-x-auto whitespace-pre-wrap rounded-xl bg-neutral-100 p-6 text-left text-xs leading-relaxed text-neutral-800">
          {entry.prompt}
        </pre>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-16 text-center text-sm text-neutral-500">
        Landings · FOREST · 순수 DOM + GSAP ScrollTrigger
      </footer>
    </main>
  );
}
