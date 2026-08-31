/**
 * sdf-text-rendering(ISSUE-39) — 3D 텍스트용 Pretendard 서브셋 빌드.
 *
 * 왜 서브셋인가
 * ------------
 * drei `<Text>`(troika)의 `font` prop은 **단일 폰트 파일 URL**만 받는다.
 * 브라우저 `@font-face`의 `unicode-range` 동적 서브셋(Pretendard dynamic subset
 * CSS)을 쓸 수 없다. 폰트 파일 **전체가 첫 3D 텍스트 렌더 전에 다운로드**되므로,
 * 원본 Pretendard Variable(~2MB)을 그대로 쓰면 로딩 체감이 나쁘다.
 *
 * 무엇을 남기나
 * ------------
 * - KS X 1001 상용 한글 2350자 (EUC-KR 0xB0A1~0xC8FE 완성형 영역)
 *   → 앞으로 어떤 한글 라벨을 써도 빈 네모가 안 나는 게 목표. 매번 재생성 불필요.
 * - 한글 자모(U+3130~U+318F)
 * - 라틴 기본(U+0020~U+007E) + 라틴-1 보충 일부
 * - 일반 문장부호(' ' " " · … – —) · 화살표(→ ← ↔ ⇄ ×) · 수학/통화(≈ ° ± ·)
 *
 * 원본 (사용자가 public/font/ 에 직접 추가)
 * ----------------------------------------
 * - public/font/PretendardVariable.woff2 — Pretendard Variable, SIL OFL
 *   variable 폰트라 wght 100~900 전 구간 포함. 서브셋해도 variable 유지.
 *
 * 산출물 (커밋 대상)
 * ------------------
 * - public/fonts/pretendard-subset.woff — 위 문자 집합만 남긴 WOFF1 (~450KB)
 *   *troika(opentype/Typr 파서)는 **WOFF2를 못 읽는다** — `wOF2` 시그니처를 만나면
 *    `Error: woff2 fonts not supported`를 던진다. WOFF1(`wOFF`)은 내장 woff2otf로
 *    변환해서 파싱하고, TTF/OTF(sfnt)도 직접 읽는다. 그래서 WOFF1로 굽는다.
 *    브라우저 전송은 dev·prod 모두 gzip이 걸려 WOFF2와의 크기 차가 작다.*
 *   *`optimize-assets.mjs` 선례 — 원본은 무겁거나 라이선스 배포물이라 커밋 정책이
 *    다를 수 있고, 재생성 스크립트만 있으면 결정적으로 복원된다*
 *
 * 재실행
 * ------
 *   node scripts/build-font-subset.mjs
 * 원본 public/font/PretendardVariable.woff2 이 있어야 한다. 결정적이다.
 *
 * 필요 패키지 (devDep, 사용자 설치)
 * ---------------------------------
 *   bun add -d subset-font
 * subset-font 는 순수 JS(fontkit + fontverter)라 네이티브 빌드가 없어 CI 친화적이다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import subsetFont from "subset-font";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const SRC = path.join(ROOT, "public", "font", "PretendardVariable.woff2");
const OUT_DIR = path.join(ROOT, "public", "fonts");
const OUT = path.join(OUT_DIR, "pretendard-subset.woff");

/** 바이트를 KB 문자열로. */
function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * KS X 1001 상용 한글 2350자.
 *
 * EUC-KR 완성형 한글 영역(고위 0xB0~0xC8, 저위 0xA1~0xFE)을 순회해
 * TextDecoder("euc-kr")로 디코드한다. 이 영역이 정확히 상용 한글 2350자다.
 * 하드코딩된 2350자 리터럴을 두는 것보다 생성이 검증 가능하고 파일이 깔끔하다.
 */
function ksx1001Hangul() {
  const decoder = new TextDecoder("euc-kr");
  let result = "";
  for (let hi = 0xb0; hi <= 0xc8; hi += 1) {
    for (let lo = 0xa1; lo <= 0xfe; lo += 1) {
      const char = decoder.decode(new Uint8Array([hi, lo]));
      if (char && char !== "�") result += char;
    }
  }
  return result;
}

/** 유니코드 범위 [start, end]를 문자열로 펼친다. */
function range(start, end) {
  let result = "";
  for (let code = start; code <= end; code += 1) result += String.fromCodePoint(code);
  return result;
}

function buildCharacterSet() {
  const hangul = ksx1001Hangul();
  const jamo = range(0x3130, 0x318f); // 한글 호환 자모
  const latin = range(0x0020, 0x007e); // 기본 라틴(공백~틸드)
  const latin1 = " °±·×÷–—"; // NBSP ° ± · × ÷ – —
  const punct = "‘’“”•…※"; // ' ' " " • … ※
  const arrows = "←→↔⇄"; // ← → ↔ ⇄
  const math = "≈≠≤≥∞"; // ≈ ≠ ≤ ≥ ∞

  // Set으로 중복 제거 후 정렬 — 결정적 출력
  const unique = Array.from(
    new Set([...hangul, ...jamo, ...latin, ...latin1, ...punct, ...arrows, ...math]),
  );
  unique.sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
  return unique.join("");
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[font] 원본 없음: ${path.relative(ROOT, SRC)}`);
    console.error("       Pretendard Variable WOFF2를 public/font/ 에 두세요.");
    process.exit(1);
  }

  const characters = buildCharacterSet();
  const source = fs.readFileSync(SRC);
  const beforeBytes = source.length;

  // targetFormat: "woff" — troika 파서가 읽는 포맷. woff2는 던진다(위 주석 참조).
  const subset = await subsetFont(source, characters, { targetFormat: "woff" });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, subset);

  const afterBytes = subset.length;
  console.log(
    `[font] ${path.relative(ROOT, SRC)}  ${kb(beforeBytes)} → ` +
      `${path.relative(ROOT, OUT)}  ${kb(afterBytes)}  ` +
      `(${(beforeBytes / afterBytes).toFixed(1)}×, 글리프 ${characters.length}자)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
