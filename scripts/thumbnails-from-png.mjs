// 캡처한 캔버스 PNG를 16:9 중앙 크롭 + 800x450 webp로 변환한다.
//
// 입력: <scratchpad>/thumb-src/{slug}.png  (MCP 브라우저가 canvas.toDataURL로 저장)
// 출력: public/thumbnails/{slug}.webp
//
// 캡처 자체는 scripts/capture-thumbnails.md 절차대로 MCP 브라우저로 수행한다
// (Playwright/Puppeteer를 dev 의존성에 추가하지 않기 위함).
//
// 사용: node scripts/thumbnails-from-png.mjs [srcDir]

import { readdir, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import sharp from "sharp";

const SRC_DIR =
  process.argv[2] ??
  "C:/temp/claude/C--Users-psy-portfolio-3d-skill/7cd73d7d-540b-4e27-9f17-387f466cf646/scratchpad/thumb-src";
const OUT_DIR = "public/thumbnails";

const TARGET_W = 800;
const TARGET_H = 450; // 16:9

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR)).filter((f) => f.endsWith(".png"));
  if (files.length === 0) {
    console.error(`PNG가 없습니다: ${SRC_DIR}`);
    process.exit(1);
  }

  for (const file of files) {
    const slug = basename(file, ".png");
    const src = join(SRC_DIR, file);
    const out = join(OUT_DIR, `${slug}.webp`);

    const img = sharp(src);
    const meta = await img.metadata();
    const { width, height } = meta;

    // 16:9로 중앙 크롭 — 원본이 세로로 길면 위아래를, 가로로 길면 좌우를 자른다.
    const targetRatio = 16 / 9;
    const srcRatio = width / height;

    let cropW;
    let cropH;
    if (srcRatio > targetRatio) {
      // 가로가 넘침 → 높이에 맞추고 좌우 자름
      cropH = height;
      cropW = Math.round(height * targetRatio);
    } else {
      // 세로가 넘침 → 폭에 맞추고 위아래 자름
      cropW = width;
      cropH = Math.round(width / targetRatio);
    }
    const left = Math.round((width - cropW) / 2);
    const top = Math.round((height - cropH) / 2);

    await img
      .extract({ left, top, width: cropW, height: cropH })
      .resize(TARGET_W, TARGET_H, { fit: "fill" })
      .webp({ quality: 80 })
      .toFile(out);

    console.log(
      `${slug}: ${width}x${height} → crop ${cropW}x${cropH} @ (${left},${top}) → ${TARGET_W}x${TARGET_H} webp`,
    );
  }

  console.log(`\n완료: ${files.length}개 → ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
