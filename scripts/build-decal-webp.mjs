/**
 * decal-and-projection(ISSUE-40) 예제 데칼 텍스처 빌드 스크립트.
 *
 * `public/decals/*.svg`(사람이 그린 원본)를 256x256 WebP(알파 채널 유지)로
 * 변환한다. WebP를 쓰는 이유: 알파를 지원하면서 같은 품질에서 PNG보다 작다
 * (asset-optimization의 텍스처 기본).
 *
 * 커밋 대상: `*.svg`(원본)와 `*.webp`(산출물) 둘 다. WebP만으로는 나중에
 * 수정이 어렵고, SVG만으로는 런타임에 못 쓴다.
 *
 * 실행
 * ----
 *   node scripts/build-decal-webp.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DECAL_DIR = resolve(SCRIPT_DIR, "../public/decals");

/** 변환할 파일 이름(확장자 제외). */
const NAMES = ["logo-mark", "sticker"];

/** 출력 한 변의 픽셀. 데칼은 표면 일부에만 얹히므로 256이면 충분하다. */
const SIZE = 256;

async function main() {
  for (const name of NAMES) {
    const svg = readFileSync(resolve(DECAL_DIR, `${name}.svg`));
    const out = resolve(DECAL_DIR, `${name}.webp`);

    const buffer = await sharp(svg, { density: 384 })
      .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90, alphaQuality: 100 })
      .toBuffer();

    writeFileSync(out, buffer);
    console.log(`생성 완료: ${out} (${buffer.length} bytes)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
