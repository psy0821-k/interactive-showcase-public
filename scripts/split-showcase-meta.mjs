// 각 쇼케이스의 meta를 index.tsx에서 별도 meta.ts로 분리한다.
//
// 왜: registry.ts의 `import.meta.glob("./*/*/index.tsx", { import: "meta" })`가
// Turbopack에서 트리셰이킹되지 않아, 38개 index.tsx의 three/drei/rapier import가
// 갤러리 홈 번들 그래프에 전부 연결된다 (홈에 ~4MB preload). meta를 순수
// 객체만 담은 meta.ts로 빼면 홈은 그것만 로드한다.
//
// 변환:
//   meta.ts (신규):
//     import type { ShowcaseMeta } from "@/domain/showcase";
//     export const meta: ShowcaseMeta = { ... };   ← index.tsx에서 옮김
//
//   index.tsx:
//     "use client";                                ← 유지 (맨 위)
//     export { meta } from "./meta";               ← 추가
//     ...나머지 (meta 블록·ShowcaseMeta import 제거)
//
// 사용: node scripts/split-showcase-meta.mjs
// 멱등: index.tsx가 이미 re-export 하고 있으면 건너뛴다.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src', 'showcases');

/** "export const meta ... };" 블록을 중괄호 균형으로 잘라낸다. */
function extractMetaBlock(source) {
  const start = source.indexOf('export const meta');
  if (start === -1) return null;

  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  let end = i + 1;
  while (end < source.length && source[end] !== ';') end += 1;
  end += 1;

  return { block: source.slice(start, end), start, end };
}

let changed = 0;
let skipped = 0;

for (const category of readdirSync(ROOT, { withFileTypes: true })) {
  if (!category.isDirectory()) continue;

  for (const showcase of readdirSync(join(ROOT, category.name), {
    withFileTypes: true,
  })) {
    if (!showcase.isDirectory()) continue;

    const dir = join(ROOT, category.name, showcase.name);
    const indexPath = join(dir, 'index.tsx');
    const metaPath = join(dir, 'meta.ts');
    if (!existsSync(indexPath)) continue;

    let src = readFileSync(indexPath, 'utf8');

    // 줄바꿈을 LF로 정규화해 처리 (파일 쓸 때도 LF로 통일).
    src = src.replace(/\r\n/g, '\n');

    if (src.includes('export { meta } from "./meta"')) {
      skipped += 1;
      continue;
    }

    const extracted = extractMetaBlock(src);
    if (!extracted) {
      console.warn(`meta 블록 못 찾음: ${indexPath}`);
      continue;
    }

    // 1. meta.ts 작성
    writeFileSync(
      metaPath,
      `import type { ShowcaseMeta } from "@/domain/showcase";\n\n${extracted.block}\n`,
      'utf8',
    );

    // 2. index.tsx에서 meta 블록 제거
    let body = src.slice(0, extracted.start) + src.slice(extracted.end);

    // 3. 이제 안 쓰는 ShowcaseMeta 타입 import 제거 (홑/겹따옴표·줄바꿈 허용)
    body = body.replace(
      /import type \{\s*ShowcaseMeta\s*\} from ["']@\/domain\/showcase["'];\n?/g,
      '',
    );

    // 4. "use client" 지시어를 걷어내고, 맨 위에 use client + re-export 재구성
    body = body.replace(/^\s*["']use client["'];\s*\n/, '');
    body = body.replace(/^\n+/, '');
    body = `"use client";\n\nexport { meta } from "./meta";\n\n${body}`;
    body = body.replace(/\n{3,}/g, '\n\n');

    writeFileSync(indexPath, body, 'utf8');
    changed += 1;
    console.log(`분리: ${category.name}/${showcase.name}`);
  }
}

console.log(`\n완료: ${changed}개 분리, ${skipped}개 건너뜀`);
