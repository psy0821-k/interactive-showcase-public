"use client";

import type { ComponentType } from "react";
import type { ShowcaseEntry, ShowcaseMeta } from "@/domain/showcase";
import { isTechniqueCategory } from "@/domain/technique-category";

/** 쇼케이스 모듈이 반드시 named export 해야 하는 형태. */
interface ShowcaseModule {
  Scene: ComponentType;
}

/**
 * 갤러리는 meta만 필요하므로 eager로 걷는다.
 * `import: "meta"`가 named export 하나만 정적 import 하므로 Scene 코드는
 * 트리셰이킹되어 갤러리 번들에 포함되지 않는다.
 *
 * Turbopack의 glob 타입은 제네릭을 받지 않고 `unknown`을 돌려주므로
 * (node_modules/next/types/global.d.ts), 값은 아래 타입 가드로 좁힌다.
 */
const metaModules: Record<string, unknown> = import.meta.glob(
  "./*/*/index.tsx",
  { eager: true, import: "meta" },
);

/** Scene은 상세 진입 시에만 필요하므로 lazy. 각 항목이 개별 청크가 된다. */
const sceneModules: Record<string, () => Promise<unknown>> =
  import.meta.glob("./*/*/index.tsx");

/** eager glob이 돌려준 값이 ShowcaseMeta 형태인지 확인한다. */
function isShowcaseMeta(value: unknown): value is ShowcaseMeta {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ShowcaseMeta>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.description === "string" &&
    Array.isArray(candidate.usedSkills)
  );
}

/** './{category}/{slug}/index.tsx' 에서 두 세그먼트를 뽑는다. */
const PATH_PATTERN = /^\.\/([^/]+)\/([^/]+)\/index\.tsx$/;

/**
 * meta 자체의 유효성을 본다. 경로와의 대조는 호출부가 담당한다.
 * 위반 사유를 모아 반환하며, 빈 배열이면 통과다.
 */
function collectMetaViolations(meta: ShowcaseMeta): string[] {
  const violations: string[] = [];

  if (!meta.title?.trim()) {
    violations.push("title이 비어 있다");
  }
  if (!meta.description?.trim()) {
    violations.push("description이 비어 있다");
  }
  if (!Array.isArray(meta.usedSkills) || meta.usedSkills.length === 0) {
    violations.push("usedSkills가 비어 있다 (최소 1개)");
  }
  if (!isTechniqueCategory(meta.category)) {
    violations.push(`category '${meta.category}'가 기법 카테고리 목록에 없다`);
  }
  if (
    meta.frameloop !== undefined &&
    meta.frameloop !== "always" &&
    meta.frameloop !== "demand"
  ) {
    violations.push(
      `frameloop '${meta.frameloop}'는 "always" | "demand" 중 하나여야 한다`,
    );
  }
  if (
    meta.controlsMode !== undefined &&
    meta.controlsMode !== "orbit" &&
    meta.controlsMode !== "none"
  ) {
    violations.push(
      `controlsMode '${meta.controlsMode}'는 "orbit" | "none" 중 하나여야 한다`,
    );
  }

  return violations;
}

/**
 * glob 결과를 검증하며 ShowcaseEntry 배열로 만든다.
 *
 * ADR-001(안 A)에 따라 위반은 조용히 넘기지 않고 throw 한다.
 * 개발 서버에서는 오버레이 에러로, 프로덕션 빌드에서는 빌드 실패로 드러난다.
 */
function buildRegistry(): ShowcaseEntry[] {
  const entries: ShowcaseEntry[] = [];
  const seenSlugs = new Map<string, string>();

  for (const [path, rawMeta] of Object.entries(metaModules)) {
    const matched = PATH_PATTERN.exec(path);
    if (!matched) {
      throw new Error(
        `[showcase] 경로 규칙 위반: ${path}\n` +
          "  src/showcases/{기법-카테고리}/{slug}/index.tsx 형태여야 한다.",
      );
    }

    const [, pathCategory, slug] = matched;

    // meta 자체가 없거나(named export 누락) 형태가 다르면 여기서 걸린다.
    if (!isShowcaseMeta(rawMeta)) {
      throw new Error(
        `[showcase] ${path}\n` +
          "  - meta를 named export 하지 않았거나 형태가 다르다.\n" +
          "    export const meta: ShowcaseMeta = { title, category, usedSkills, description }",
      );
    }

    const meta = rawMeta;
    const violations = collectMetaViolations(meta);

    // 경로와 meta.category가 어긋나면 등록 실패 (PRD 10절).
    if (isTechniqueCategory(meta.category) && meta.category !== pathCategory) {
      violations.push(
        `경로의 카테고리 '${pathCategory}'와 meta.category '${meta.category}'가 다르다`,
      );
    }

    if (violations.length > 0) {
      throw new Error(
        `[showcase] ${path}\n` + violations.map((v) => `  - ${v}`).join("\n"),
      );
    }

    // slug는 카테고리를 넘어 전역 유일해야 한다.
    const duplicatedIn = seenSlugs.get(slug);
    if (duplicatedIn) {
      throw new Error(
        `[showcase] slug '${slug}'가 중복됐다.\n` +
          `  ${duplicatedIn}\n  ${path}\n` +
          "  slug는 URL 키이므로 전역에서 유일해야 한다.",
      );
    }
    seenSlugs.set(slug, path);

    // 썸네일은 slug로 유도한다. meta.thumbnail이 명시돼 있으면 그것을 쓴다.
    // 파일 존재 여부는 런타임에 <img onError>가 처리한다.
    const thumbnail = meta.thumbnail ?? `/thumbnails/${slug}.webp`;

    entries.push({ slug, meta, thumbnail });
  }

  return entries.sort((a, b) => a.meta.title.localeCompare(b.meta.title, "ko"));
}

/** 갤러리·상세·검색이 모두 이 배열 하나를 소비한다. */
export const SHOWCASE_ENTRIES: ShowcaseEntry[] = buildRegistry();

/** slug로 항목을 찾는다. 없으면 undefined — 호출부가 404를 결정한다. */
export function findShowcase(slug: string): ShowcaseEntry | undefined {
  return SHOWCASE_ENTRIES.find((entry) => entry.slug === slug);
}

/**
 * slug에 해당하는 Scene 로더를 돌려준다.
 *
 * 반환값이 함수이므로 Server -> Client prop으로 넘기면 안 된다.
 * 반드시 클라이언트 컴포넌트 내부에서 호출해 소비한다.
 */
export function getSceneLoader(
  slug: string,
): (() => Promise<ShowcaseModule>) | undefined {
  const path = Object.keys(sceneModules).find(
    (candidate) => PATH_PATTERN.exec(candidate)?.[2] === slug,
  );
  if (!path) return undefined;

  const load = sceneModules[path];
  return async () => {
    const loaded = await load();
    const scene = (loaded as Partial<ShowcaseModule>).Scene;
    if (typeof scene !== "function") {
      throw new Error(
        `[showcase] ${path}\n  - Scene을 named export 하지 않았다 (export function Scene).`,
      );
    }
    return { Scene: scene };
  };
}
