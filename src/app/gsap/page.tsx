import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery-page";

export const metadata: Metadata = {
  title: "GSAP Showcase",
  description:
    "GSAP로 만든 애니메이션 쇼케이스. 타임라인 시퀀스·스크롤 연동·DOM 모션을 " +
    "React Three Fiber 셸 위에서 구현하고, 각 기법의 함정과 회피법을 정리했다.",
  alternates: { canonical: "/gsap" },
  openGraph: {
    type: "website",
    url: "/gsap",
    title: "GSAP Showcase",
    description: "GSAP 애니메이션 쇼케이스 — 타임라인·스크롤·DOM 모션.",
  },
};

export default function GsapGalleryPage() {
  return (
    <GalleryPage
      track="gsap"
      basePath="/gsap"
      title="GSAP Showcase"
      description="GSAP로 만든 애니메이션 결과물 모음입니다. 구현에 쓴 기법은 각 상세의 '사용 기법'에서 볼 수 있습니다."
      collectionName="GSAP Showcase"
    />
  );
}
