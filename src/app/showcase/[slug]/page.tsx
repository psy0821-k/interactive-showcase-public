import { ShowcaseDetail } from "@/components/showcase-detail";

/** Next 16에서 params는 Promise이므로 await 한다. */
export default async function ShowcasePage({
  params,
}: PageProps<"/showcase/[slug]">) {
  const { slug } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <ShowcaseDetail slug={slug} />
    </main>
  );
}
