import { GalleryPage } from "@/components/gallery-page";

export default function HomePage() {
  return (
    <GalleryPage
      track="3d"
      basePath="/"
      title="3D Skill Showcase"
      description="Claude Code skill로 만든 3D 결과물 모음입니다."
      collectionName="3D Skill Showcase"
    />
  );
}
