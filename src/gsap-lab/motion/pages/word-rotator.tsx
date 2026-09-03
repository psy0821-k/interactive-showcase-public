'use client';

import { useRef } from 'react';
import { useGsapDom } from '@/hooks/use-gsap-dom';
import { DemoShell } from '@/gsap-lab/demo-shell';

const WORDS = ['앱을', '사이트를', '브랜드를', '제품을', '미래를'];

/** 각 단어가 화면에 머무는 시간(초). */
const HOLD = 1.1;
/** 한 단어 → 다음 단어 전환 시간(초). */
const SHIFT = 0.55;

/**
 * `/gsap-lab/word-rotator` — 문장의 한 단어만 계속 교체.
 *
 * 단어들을 세로로 쌓고 `overflow: hidden` 마스크로 한 줄만 보이게 한 뒤,
 * 무한 반복 타임라인이 `y`(px 실측)로 다음 단어를 끌어올린다.
 *
 * 타이밍은 **선언적**으로 짠다 — `.to({}, {duration})` 빈 트윈 대신
 * position parameter의 상대 간격(`"+=HOLD"`)으로 "머무름"을 표현한다.
 * 이동량은 `yPercent`(단어 높이 균등 가정)가 아니라 각 단어의 `offsetTop`
 * 실측값을 쓴다.
 */
export function WordRotatorPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(({ gsap: g, reduced }) => {
    const list = container.current?.querySelector<HTMLElement>('.word-list');
    if (!list) return;

    const items = [...list.children] as HTMLElement[];
    // 각 단어를 마스크 상단에 맞추려면 리스트를 이만큼 위로 올려야 한다.
    const offsets = items.map((el) => -el.offsetTop);

    if (reduced) {
      g.set(list, { y: 0 });
      return;
    }

    const tl = g.timeline({ repeat: -1, defaults: { ease: 'expo.inOut' } });

    // 0번 단어에서 시작해 마지막까지, 그다음 다시 0번으로.
    // 각 전환은 앞 단어가 HOLD만큼 머문 뒤 시작(position parameter `"+="`).
    const sequence = [...offsets.slice(1), offsets[0]];
    for (const y of sequence) {
      tl.to(list, { y, duration: SHIFT }, `+=${HOLD}`);
    }
  }, container);

  return (
    <DemoShell
      title="단어 교체 루프"
      summary="문장의 한 단어가 무한 반복으로 교체된다 (repeat: -1 타임라인 + yPercent 마스크)"
    >
      <div
        ref={container}
        className="flex min-h-[70vh] items-center justify-center px-6"
      >
        {/*
          스크린리더는 회전하는 단어를 하나씩 낭독하면 안 된다(스킬 6절).
          접근성 트리에는 대표 문구 하나만 남기고, 시각적 회전 연출 전체는
          aria-hidden으로 가린다.
        */}
        <p className="sr-only">우리는 더 나은 {WORDS[0]} 만듭니다</p>
        <p
          className="flex flex-wrap items-center justify-center gap-x-4 text-4xl font-bold sm:text-6xl"
          aria-hidden
        >
          <span className="text-white/70">우리는 더 나은</span>
          {/* 한 줄 높이만 보이는 마스크 */}
          <span
            className="relative inline-block overflow-hidden align-bottom"
            style={{ height: '1.1em' }}
          >
            <span className="word-list flex flex-col">
              {WORDS.map((word) => (
                <span
                  key={word}
                  className="flex h-[1.1em] items-center text-indigo-400"
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
          <span className="text-white/70">만듭니다</span>
        </p>
      </div>
    </DemoShell>
  );
}
