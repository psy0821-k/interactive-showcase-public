'use client';

import type { ComponentType } from 'react';

/** 쇼케이스 모듈이 반드시 named export 해야 하는 형태. */
export interface ShowcaseModule {
  Scene: ComponentType;
}

// Scene 로더 — 상세 페이지(showcase-canvas.tsx)에서만 import 한다.
//
// 아래 glob이 모든 쇼케이스의 three/drei/rapier import를 번들 그래프에
// 연결한다. registry.ts(meta만)와 분리해, 갤러리 홈이 이 파일을 import 하지
// 않도록 한다. lazy glob이므로 각 index.tsx는 개별 청크가 되고, 상세 진입
// 시에만 로드된다.
const sceneModules: Record<string, () => Promise<unknown>> = import.meta.glob(
  './*/*/index.tsx',
);

// './{category}/{slug}/index.tsx' 에서 slug를 뽑는다.
const PATH_PATTERN = /^\.\/[^/]+\/([^/]+)\/index\.tsx$/;

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
    (candidate) => PATH_PATTERN.exec(candidate)?.[1] === slug,
  );
  if (!path) return undefined;

  const load = sceneModules[path];
  return async () => {
    const loaded = await load();
    const scene = (loaded as Partial<ShowcaseModule>).Scene;
    if (typeof scene !== 'function') {
      throw new Error(
        `[showcase] ${path}\n  - Scene을 named export 하지 않았다 (export function Scene).`,
      );
    }
    return { Scene: scene };
  };
}
