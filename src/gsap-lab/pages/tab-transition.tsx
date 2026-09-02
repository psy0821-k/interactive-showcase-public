"use client";

import { useEffect, useRef, useState } from "react";
import { useGsapDom } from "@/hooks/use-gsap-dom";

interface TabDef {
  id: string;
  label: string;
  heading: string;
  body: string;
  background: string;
}

const TABS: TabDef[] = [
  {
    id: "capture",
    label: "빠른 캡처",
    heading: "생각을 놓치기 전에",
    body: "단축키 한 번으로 어디서든 노트를 띄웁니다. 저장은 자동입니다.",
    background: "#7c2d12",
  },
  {
    id: "organize",
    label: "자동 정리",
    heading: "폴더는 그만",
    body: "백링크와 태그로 노트가 스스로 연결됩니다. AI가 관련 노트를 제안합니다.",
    background: "#831843",
  },
  {
    id: "share",
    label: "공유",
    heading: "링크 하나면 끝",
    body: "노트를 웹 페이지로 즉시 게시하거나, 팀 워크스페이스로 초대합니다.",
    background: "#4c1d95",
  },
];

/** 제목을 글자 단위 <span>으로 쪼갠다. 공백은 pre로 보존. */
function SplitHeading({ text }: { text: string }) {
  return (
    <h2 className="panel-heading text-3xl font-semibold sm:text-4xl" aria-label={text}>
      {text.split("").map((ch, index) => (
        <span
          key={`${ch}-${index}`}
          aria-hidden
          className="char inline-block"
          style={{ whiteSpace: "pre" }}
        >
          {ch}
        </span>
      ))}
    </h2>
  );
}

/**
 * `/gsap-lab/tab-transition` — 전환 이펙트 랜딩.
 *
 * 시연 항목:
 * - 페이지 진입 오버레이(위→아래로 걷힘)
 * - 활성 탭 패널의 글자 단위 stagger 제목
 * - 탭 전환 시 패널 크로스페이드(이전 패널 out → 새 패널 in)
 * - 탭 상태는 state, 애니메이션은 `useGsapDom` deps로 재실행
 */
export function TabTransitionPage() {
  const container = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(TABS[0].id);
  const isFirstRun = useRef(true);
  /** 사용자가 탭을 눌러 전환했을 때만 true. 최초 마운트에는 포커스를 옮기지 않는다. */
  const shouldFocusPanel = useRef(false);

  // 탭 전환 시 새 패널로 포커스를 옮겨 스크린리더가 바뀐 내용을 읽게 한다(스킬 6절).
  useEffect(() => {
    if (!shouldFocusPanel.current) return;
    shouldFocusPanel.current = false;
    panelRef.current?.focus();
  }, [activeId]);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      if (reduced) {
        g.set(".enter-overlay", { autoAlpha: 0 });
        g.set([".panel-body", ".char"], { autoAlpha: 1, y: 0, yPercent: 0 });
        return;
      }

      const tl = g.timeline({ defaults: { ease: "power3.out" } });

      // 최초 실행에만 진입 오버레이를 걷는다.
      if (isFirstRun.current) {
        tl.to(".enter-overlay", {
          yPercent: -100,
          duration: 0.7,
          ease: "power4.inOut",
        });
        isFirstRun.current = false;
      } else {
        g.set(".enter-overlay", { autoAlpha: 0 });
      }

      // 활성 패널 등장: 본문 페이드업 + 제목 글자 스태거.
      // `.panel-body`는 SSR 요소 + `.gsap-reveal`(opacity:0)이라 set + to로 짠다.
      g.set(".panel-body", { autoAlpha: 0, y: 24 });
      tl.to(".panel-body", { y: 0, autoAlpha: 1, duration: 0.5 }, ">-0.2")
        .from(
          ".char",
          {
            yPercent: 120,
            autoAlpha: 0,
            duration: 0.5,
            stagger: { amount: 0.4 },
          },
          "<0.05",
        );
    },
    container,
    [activeId],
  );

  const activeTab = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <div ref={container} className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* 진입 오버레이 */}
      <div
        className="enter-overlay pointer-events-none absolute inset-0 z-40 bg-neutral-900"
        aria-hidden
      />

      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">
          Fluxnote 둘러보기
        </p>

        {/* 탭 목록 */}
        <div role="tablist" aria-label="기능 탭" className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={tab.id === activeId}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => {
                shouldFocusPanel.current = true;
                setActiveId(tab.id);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab.id === activeId
                  ? "bg-white text-neutral-900"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 활성 패널 */}
        <div
          key={activeTab.id}
          ref={panelRef}
          role="tabpanel"
          id={`panel-${activeTab.id}`}
          aria-labelledby={`tab-${activeTab.id}`}
          tabIndex={-1}
          className="mt-8 overflow-hidden rounded-3xl p-10 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ background: activeTab.background }}
        >
          <SplitHeading text={activeTab.heading} />
          <div className="panel-body gsap-reveal mt-6">
            <div
              className="mb-6 h-56 w-full rounded-2xl bg-white/15"
              aria-hidden
            />
            <p className="max-w-lg text-lg text-white/85">{activeTab.body}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
