'use client';

import { LandingShell, LandingSection, LandingCard } from '../landing-shell';
import { findLanding } from '../registry';
import { PrismPricingScene } from '../scenes/prism-pricing-scene';

const PLANS = [
  {
    name: 'Free',
    price: '₩0',
    body: '개인용. 노트 무제한, 기기 2대, 7일 히스토리.',
  },
  {
    name: 'Team',
    price: '₩9,000',
    body: '1인/월. 무제한 기기, 30일 히스토리, 문단 단위 권한.',
  },
  {
    name: 'Enterprise',
    price: '문의',
    body: 'SSO, 감사 로그, 온프레미스, 전담 지원.',
  },
];

export function PrismPricingPage() {
  const entry = findLanding('prism-pricing')!;
  return (
    <LandingShell
      entry={entry}
      renderScene={(ctx) => <PrismPricingScene {...ctx} />}
    >
      <LandingSection align="center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">
          Fluxnote Pricing
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">
          하나의 빛, 세 갈래 스펙트럼
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          스크롤하면 프리즘이 요금제를 가릅니다.
        </p>
      </LandingSection>

      {PLANS.map((plan) => (
        <LandingSection key={plan.name} align="center">
          <LandingCard className="mx-auto max-w-sm">
            <h2 className="text-2xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold text-emerald-300">
              {plan.price}
            </p>
            <p className="mt-3 text-white/75">{plan.body}</p>
          </LandingCard>
        </LandingSection>
      ))}

      <LandingSection align="center">
        <h2 className="text-3xl font-semibold">지금 Team으로 시작</h2>
        <p className="mt-4 text-white/70">언제든 Free로 되돌릴 수 있습니다</p>
      </LandingSection>
    </LandingShell>
  );
}
