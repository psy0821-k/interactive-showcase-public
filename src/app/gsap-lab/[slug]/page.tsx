import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findLabEntry, LAB_ENTRIES } from "@/gsap-lab/registry";
import { ScrollStoryPage } from "@/gsap-lab/pages/scroll-story";
import { PricingRevealPage } from "@/gsap-lab/pages/pricing-reveal";
import { PointerPlayPage } from "@/gsap-lab/pages/pointer-play";
import { TabTransitionPage } from "@/gsap-lab/pages/tab-transition";
import { ParallaxLayersPage } from "@/gsap-lab/scroll/pages/parallax-layers";
import { HeroToSectionPage } from "@/gsap-lab/scroll/pages/hero-to-section";
import { RevealSequencePage } from "@/gsap-lab/scroll/pages/reveal-sequence";
import { RevealTogetherPage } from "@/gsap-lab/scroll/pages/reveal-together";
import { PinProgressPage } from "@/gsap-lab/scroll/pages/pin-progress";
import { HorizontalScrollPage } from "@/gsap-lab/scroll/pages/horizontal-scroll";
import { ProgressIndicatorPage } from "@/gsap-lab/scroll/pages/progress-indicator";
import { KineticTypographyPage } from "@/gsap-lab/scroll/pages/kinetic-typography";
import { ImageMaskRevealPage } from "@/gsap-lab/scroll/pages/image-mask-reveal";
import { CounterOnScrollPage } from "@/gsap-lab/scroll/pages/counter-on-scroll";
import { StickyStackCardsPage } from "@/gsap-lab/scroll/pages/sticky-stack-cards";
import { LineMaskTextPage } from "@/gsap-lab/scroll/pages/line-mask-text";
import { BgColorTransitionPage } from "@/gsap-lab/scroll/pages/bg-color-transition";
import { SvgPathDrawPage } from "@/gsap-lab/scroll/pages/svg-path-draw";
import { ScrollDirectionHeaderPage } from "@/gsap-lab/scroll/pages/scroll-direction-header";
import { ParallaxImageGridPage } from "@/gsap-lab/scroll/pages/parallax-image-grid";
import { ChartBarGrowPage } from "@/gsap-lab/scroll/pages/chart-bar-grow";
import { SectionSnapPanelsPage } from "@/gsap-lab/scroll/pages/section-snap-panels";
import { PinnedCaptionSwapPage } from "@/gsap-lab/scroll/pages/pinned-caption-swap";
import { ZoomOutRevealPage } from "@/gsap-lab/scroll/pages/zoom-out-reveal";
import { WordRotatorPage } from "@/gsap-lab/motion/pages/word-rotator";
import { LoaderSequencePage } from "@/gsap-lab/motion/pages/loader-sequence";
import { StaggerGridFromPage } from "@/gsap-lab/motion/pages/stagger-grid-from";
import { ResponsiveMotionSwitchPage } from "@/gsap-lab/motion/pages/responsive-motion-switch";
import { MagneticNavPage } from "@/gsap-lab/pointer/pages/magnetic-nav";
import { CursorSpotlightPage } from "@/gsap-lab/pointer/pages/cursor-spotlight";
import { TiltCardGridPage } from "@/gsap-lab/pointer/pages/tilt-card-grid";
import { SignatureDrawPage } from "@/gsap-lab/svg/pages/signature-draw";
import { MorphBlobPage } from "@/gsap-lab/svg/pages/morph-blob";
import { IconLineTracePage } from "@/gsap-lab/svg/pages/icon-line-trace";

/** slug → 페이지 컴포넌트. registry와 1:1 대응. */
const PAGE_COMPONENTS: Record<string, () => React.JSX.Element> = {
  // 랜딩페이지
  "scroll-story": ScrollStoryPage,
  "pricing-reveal": PricingRevealPage,
  "pointer-play": PointerPlayPage,
  "tab-transition": TabTransitionPage,
  // 스크롤 효과 데모
  "parallax-layers": ParallaxLayersPage,
  "hero-to-section": HeroToSectionPage,
  "reveal-sequence": RevealSequencePage,
  "reveal-together": RevealTogetherPage,
  "pin-progress": PinProgressPage,
  "horizontal-scroll": HorizontalScrollPage,
  "progress-indicator": ProgressIndicatorPage,
  "kinetic-typography": KineticTypographyPage,
  "image-mask-reveal": ImageMaskRevealPage,
  "counter-on-scroll": CounterOnScrollPage,
  "sticky-stack-cards": StickyStackCardsPage,
  "line-mask-text": LineMaskTextPage,
  "bg-color-transition": BgColorTransitionPage,
  "svg-path-draw": SvgPathDrawPage,
  "scroll-direction-header": ScrollDirectionHeaderPage,
  "parallax-image-grid": ParallaxImageGridPage,
  "chart-bar-grow": ChartBarGrowPage,
  "section-snap-panels": SectionSnapPanelsPage,
  "pinned-caption-swap": PinnedCaptionSwapPage,
  "zoom-out-reveal": ZoomOutRevealPage,
  // 모션
  "word-rotator": WordRotatorPage,
  "loader-sequence": LoaderSequencePage,
  "stagger-grid-from": StaggerGridFromPage,
  "responsive-motion-switch": ResponsiveMotionSwitchPage,
  // 포인터
  "magnetic-nav": MagneticNavPage,
  "cursor-spotlight": CursorSpotlightPage,
  "tilt-card-grid": TiltCardGridPage,
  // SVG
  "signature-draw": SignatureDrawPage,
  "morph-blob": MorphBlobPage,
  "icon-line-trace": IconLineTracePage,
};

export function generateStaticParams(): { slug: string }[] {
  return LAB_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/gsap-lab/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = findLabEntry(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: `/gsap-lab/${entry.slug}` },
  };
}

export default async function LabDetailPage({
  params,
}: PageProps<"/gsap-lab/[slug]">) {
  const { slug } = await params;
  const entry = findLabEntry(slug);
  const PageComponent = PAGE_COMPONENTS[slug];
  if (!entry || !PageComponent) notFound();

  return (
    <div className="flex-1">
      <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/gsap-lab"
            className="text-neutral-600 hover:underline dark:text-neutral-400"
          >
            ← GSAP Lab
          </Link>
          <span className="text-neutral-600 dark:text-neutral-400">/</span>
          <span className="font-medium">{entry.title}</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            {entry.usedSkills.map((skill) => (
              <code
                key={skill}
                className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {skill}
              </code>
            ))}
          </span>
        </div>
        {entry.caveat && (
          <p className="mx-auto mt-2 max-w-6xl text-xs text-amber-700 dark:text-amber-500">
            <span className="font-semibold">적용 한계</span> · {entry.caveat}
          </p>
        )}
      </div>
      <PageComponent />
    </div>
  );
}
