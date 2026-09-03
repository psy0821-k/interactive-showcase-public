"use client";

import { useRef } from "react";
import { useGsapDom } from "@/hooks/use-gsap-dom";

const FEATURES = [
  { title: "무제한 노트", background: "#065f46" },
  { title: "팀 워크스페이스", background: "#0e7490" },
  { title: "API 접근", background: "#1d4ed8" },
  { title: "감사 로그", background: "#6d28d9" },
  { title: "SSO / SAML", background: "#a21caf" },
  { title: "우선 지원", background: "#be123c" },
];

// 카드 배경은 어둡게 — 위에 얹는 흰 텍스트(text-white/85 목록 포함)가
// WCAG AA(4.5:1)를 넘도록. teal-700(#0f766e)은 흰색과 4.4:1로 경계선이었다.
const PLANS = [
  {
    name: "Starter",
    price: "무료",
    background: "#134e48",
    points: ["개인 사용", "노트 100개", "커뮤니티 지원"],
  },
  {
    name: "Team",
    price: "₩12,000 / 월",
    background: "#1e3a8a",
    points: ["무제한 노트", "팀 워크스페이스", "이메일 지원"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "문의",
    background: "#581c87",
    points: ["SSO / SAML", "감사 로그", "전담 매니저"],
  },
];

const FAQS = [
  {
    q: "언제든 해지할 수 있나요?",
    a: "네. 구독은 매월 자동 갱신되며 대시보드에서 즉시 해지할 수 있습니다.",
  },
  {
    q: "무료 플랜에 기간 제한이 있나요?",
    a: "없습니다. Starter 플랜은 영구 무료이며 노트 100개까지 사용할 수 있습니다.",
  },
  {
    q: "팀 요금은 어떻게 계산되나요?",
    a: "활성 멤버 1인당 월 ₩12,000이며, 비활성 멤버는 청구되지 않습니다.",
  },
];

/**
 * `/gsap-lab/pricing-reveal` — 타임라인 시퀀스 + stagger 등장 랜딩.
 *
 * 시연 항목:
 * - 마스터 타임라인 `defaults`로 자식 공통 길이·이징
 * - position parameter 겹침(`"-=0.3"`)과 라벨(`"cards"`) 병용
 * - `stagger: { amount }`로 항목 수와 무관하게 전체 시간 고정
 * - `reduced`에서 타임라인 대신 `gsap.set`으로 최종 상태만
 */
export function PricingRevealPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      const revealTargets = [
        ".hero-eyebrow",
        ".hero-title",
        ".hero-sub",
        ".feature-card",
        ".plan-card",
        ".faq-item",
      ];

      if (reduced) {
        g.set(revealTargets, { autoAlpha: 1, y: 0 });
        return;
      }

      // SSR로 렌더된 요소라 `from`이 아니라 `set`(시작 상태) + `to`(등장)로 짠다.
      // CSS가 `.gsap-reveal`에 opacity:0을 걸어 두므로 `from`은 0→0이 된다.
      g.set(revealTargets, { autoAlpha: 0, y: 24 });
      g.set(".plan-card", { scale: 0.96 });

      const tl = g.timeline({
        defaults: { duration: 0.6, ease: "power3.out" },
      });

      tl.to(".hero-eyebrow", { y: 0, autoAlpha: 1, duration: 0.4 })
        .to(".hero-title", { y: 0, autoAlpha: 1 }, "-=0.15")
        .to(".hero-sub", { y: 0, autoAlpha: 1 }, "-=0.35")
        .addLabel("features", "-=0.1")
        .to(
          ".feature-card",
          { y: 0, autoAlpha: 1, stagger: { amount: 0.5 } },
          "features",
        )
        .addLabel("cards", ">-0.1")
        .to(
          ".plan-card",
          { y: 0, autoAlpha: 1, scale: 1, stagger: 0.12 },
          "cards",
        )
        .to(
          ".faq-item",
          { y: 0, autoAlpha: 1, stagger: { amount: 0.4 } },
          ">-0.1",
        );
    },
    container,
  );

  return (
    <main ref={container} className="bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* 히어로 */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <p className="hero-eyebrow gsap-reveal text-sm font-medium uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
          Fluxnote Pricing
        </p>
        <h1 className="hero-title gsap-reveal mt-4 text-4xl font-semibold sm:text-5xl">
          팀에 맞는 요금제를 고르세요
        </h1>
        <p className="hero-sub gsap-reveal mx-auto mt-6 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          제목 → 부제 → 기능 → 요금제 → FAQ 순서로 하나의 타임라인이 페이지를
          펼칩니다.
        </p>
      </section>

      {/* 기능 그리드 */}
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="feature-card gsap-reveal flex items-center gap-3 rounded-xl p-4 text-white"
            style={{ background: feature.background }}
          >
            <div className="h-10 w-10 shrink-0 rounded-md bg-white/25" aria-hidden />
            <span className="text-sm font-medium">{feature.title}</span>
          </div>
        ))}
      </section>

      {/* 요금제 카드 */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`plan-card gsap-reveal rounded-2xl p-6 text-white ${
              plan.featured ? "ring-4 ring-white/40" : ""
            }`}
            style={{ background: plan.background }}
          >
            <div className="mb-4 h-20 w-full rounded-lg bg-white/15" aria-hidden />
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 text-2xl font-bold">{plan.price}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-white/85">
              {plan.points.map((point) => (
                <li key={point}>· {point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <h2 className="mb-6 text-2xl font-semibold">자주 묻는 질문</h2>
        <dl className="space-y-4">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="faq-item gsap-reveal rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <dt className="font-medium">{faq.q}</dt>
              <dd className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
