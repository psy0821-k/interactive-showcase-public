// color-grading-lut(ISSUE-41) — 절차 생성 3D LUT 빌드 스크립트.
//
// identity 16³ LUT 격자를 만들고 "따뜻한 필름" 색변환을 적용해 `.cube`
// 텍스트로 출력한다. 외부 라이브러리 없음 — 순수 문자열 생성이다
// (`generate-mug-glb.mjs`가 three로 지오메트리를 조립한 것과 달리, `.cube`는
// 텍스트 포맷이라 라이브러리가 필요 없다).
//
// ── LUT의 실제 존재 이유: "코드 룩 → .cube 굽기(bake)" ──
// 쇼케이스의 "따뜻" 프리셋은 <HueSaturation> + <BrightnessContrast>를 매 프레임
// GPU에서 계산한다. 같은 룩을 이 스크립트처럼 한 번 계산해 격자에 구워 두면,
// 런타임에는 <LUT> 텍스처 샘플 1회로 끝난다. 이 파일의 applyWarmFilmLook()이
// 바로 그 "구워 넣는 색변환"이고, 색보정 툴(DaVinci 등)이 하는 일의 축소판이다.
//
// 실행: node scripts/build-luts.mjs
// 산출물: public/luts/warm-film.cube (16³ = 4096줄, ~40KB, 커밋 대상)

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** LUT 한 변의 격자 수. 16³ = 4096 항목. 데모용으로 충분하다(밴딩은
 *  tetrahedralInterpolation으로 완화). 프로덕션 룩은 32 이상을 권장한다. */
const LUT_SIZE = 16;

/** 출력 경로. public/ 아래여야 <LUT>가 fetch할 수 있다. */
const OUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/luts/warm-film.cube',
);

/**
 * 0~1 값을 [0, 1]로 자른다. 색변환이 범위를 벗어나면 .cube 파서가 거부하거나
 * GPU에서 아티팩트가 난다.
 */
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * "따뜻한 필름" 색변환. identity 색(r, g, b ∈ [0, 1])을 받아 변환된 색을 돌려준다.
 *
 * 세 가지를 한다:
 *   1. 화이트밸런스 — R을 살짝 올리고 B를 살짝 내려 전체를 따뜻하게 (텅스텐 쪽)
 *   2. 대비 소폭 하강 — 중간 회색(0.5)을 축으로 살짝 눌러 필름의 무른 대비
 *   3. 섀도우 리프트 + 하이라이트 롤오프 — 어두운 쪽을 아주 살짝 들어 올려
 *      "완전한 검정이 없는" 필름 느낌
 *
 * 값은 전부 약하게 잡았다 — LUT는 미세 조정이 어울리고, 과하면 쇼케이스의
 * 다른 프리셋과 구분이 안 되는 게 아니라 오히려 "망가진 색"으로 보인다.
 */
function applyWarmFilmLook(r, g, b) {
  // 1. 화이트밸런스 (채널별 게인)
  let nr = r * 1.06;
  let ng = g * 1.01;
  let nb = b * 0.94;

  // 2. 대비 (중간 회색 0.5 축, 계수 0.92 = 살짝 낮춤)
  const CONTRAST = 0.92;
  nr = (nr - 0.5) * CONTRAST + 0.5;
  ng = (ng - 0.5) * CONTRAST + 0.5;
  nb = (nb - 0.5) * CONTRAST + 0.5;

  // 3. 섀도우 리프트 (검정을 0.02로 들어 올림 → 위쪽은 그대로)
  const LIFT = 0.02;
  nr = LIFT + nr * (1 - LIFT);
  ng = LIFT + ng * (1 - LIFT);
  nb = LIFT + nb * (1 - LIFT);

  return [clamp01(nr), clamp01(ng), clamp01(nb)];
}

/**
 * `.cube` 텍스트를 만든다.
 *
 * 포맷: 헤더(`LUT_3D_SIZE N`) 다음에 N³ 줄의 "R G B"(공백 구분, 0~1 float).
 * 순회 순서는 **R이 가장 빨리 변하고 B가 가장 느리게** 변한다 — .cube 규격이
 * 못 박은 순서다. 이 순서를 틀리면 색이 뒤섞인다.
 */
function buildCubeText(size) {
  const lines = [
    '# color-grading-lut (ISSUE-41) — 절차 생성 warm-film LUT',
    '# scripts/build-luts.mjs 로 재생성. 직접 편집하지 말 것.',
    `LUT_3D_SIZE ${size}`,
    'DOMAIN_MIN 0.0 0.0 0.0',
    'DOMAIN_MAX 1.0 1.0 1.0',
  ];

  const denom = size - 1;
  for (let bi = 0; bi < size; bi += 1) {
    for (let gi = 0; gi < size; gi += 1) {
      for (let ri = 0; ri < size; ri += 1) {
        const [r, g, b] = applyWarmFilmLook(ri / denom, gi / denom, bi / denom);
        // 소수 4자리 — 16³ 격자에서 이보다 정밀해도 tetrahedralInterpolation
        // 앞에서는 의미가 없고, 파일만 커진다.
        lines.push(`${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`);
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

const cubeText = buildCubeText(LUT_SIZE);
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, cubeText, 'utf8');

const byteLength = Buffer.byteLength(cubeText, 'utf8');
console.log(
  `warm-film.cube 생성 완료 — ${LUT_SIZE}³ = ${LUT_SIZE ** 3}개 항목, ` +
    `${(byteLength / 1024).toFixed(1)} KB`,
);
console.log(`  → ${OUT_PATH}`);
