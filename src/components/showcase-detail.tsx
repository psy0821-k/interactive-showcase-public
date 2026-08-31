"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TECHNIQUE_CATEGORY_LABELS } from "@/domain/technique-category";
import { findShowcase } from "@/showcases/registry";
import { ShowcaseCanvas } from "./showcase-canvas";

interface Props {
  slug: string;
}

/**
 * 쇼케이스 상세.
 *
 * registry가 클라이언트 전용(glob thunk 보유)이므로 조회도 여기서 한다.
 * 서버에서 찾아 넘기려 하면 함수 prop이 경계를 넘지 못해 예외가 난다.
 */
export function ShowcaseDetail({ slug }: Props) {
  const router = useRouter();
  const entry = findShowcase(slug);

  if (!entry) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <p className="text-neutral-500">요청한 데모를 찾을 수 없습니다.</p>
        <Link href="/" className="text-sm underline">
          갤러리로 돌아가기
        </Link>
      </div>
    );
  }

  const { meta } = entry;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="self-start text-sm text-neutral-500 underline"
        >
          ← 갤러리로 돌아가기
        </button>

        <h1 className="text-2xl font-semibold">{meta.title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{meta.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
            {TECHNIQUE_CATEGORY_LABELS[meta.category]}
          </span>
          {meta.usedSkills.map((skill) => (
            <span
              key={skill}
              className="rounded bg-neutral-100 px-2 py-1 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/*
        touch-pan-y: 모바일에서 캔버스 위 한 손가락 세로 스와이프를 브라우저
        스크롤로 넘긴다. <OrbitControls>의 touches가 한 손가락을 비워두므로
        (showcase-canvas.tsx) 씬 조작과 경합하지 않는다. (ISSUE-44)
      */}
      <div className="h-[60vh] w-full touch-pan-y overflow-hidden rounded-lg bg-neutral-900 lg:h-[70vh]">
        <ShowcaseCanvas slug={slug} label={`${meta.title} — ${meta.description}`} />
      </div>
    </div>
  );
}
