/**
 * asset-optimization(ISSUE-29) — 대용량 3D 에셋을 빌드 타임에 줄이는 파이프라인.
 *
 * 원본 (사용자가 public/models/ 에 직접 추가, .gitignore 처리됨)
 * ------------------------------------------------------------
 * - public/models/classroom.hdr  — 93.7 MB, 8192×4096 RADIANCE RGBE (실내 교실 HDRI)
 * - public/models/cloud.glb      — 71.3 MB, 약 116만 정점 구름 모델
 *                                   (Draco 미사용 + 4096² PNG 텍스처 ×2)
 *
 * 용도
 * ----
 * shadow-setup(ISSUE-28)·asset-optimization(ISSUE-30) 쇼케이스가 최적화본을 소비한다.
 * 원본은 GitHub 100MB push 리밋에 근접하고 clone·배포를 무겁게 하므로 커밋하지 않는다.
 *
 * 산출물 (커밋 대상)
 * ------------------
 * - public/models/cloud-opt.glb   — glb 파이프라인 통과본 (목표 < 6MB)
 * - public/hdri/classroom-1k.hdr  — 1024×512로 다운샘플한 RGBE (목표 < 3MB)
 * - public/draco/                 — Draco 디코더 wasm+js (three 번들에서 복사)
 *                                   *왜·어떻게 쓰는지는 gltf-model-loading 6절 소관*
 *
 * 재실행
 * ------
 *   node scripts/optimize-assets.mjs
 * 원본 두 파일이 public/models/ 에 있어야 한다. 결정적(deterministic)이라
 * 같은 입력에서 항상 같은 크기를 낸다.
 *
 * 필요 패키지 (devDep, 사용자 설치)
 * ---------------------------------
 *   @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions
 *   draco3dgltf sharp
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  draco,
  prune,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const MODELS_DIR = path.join(ROOT, "public", "models");
const HDRI_DIR = path.join(ROOT, "public", "hdri");
const DRACO_DEST = path.join(ROOT, "public", "draco");
const DRACO_SRC = path.join(
  ROOT,
  "node_modules",
  "three",
  "examples",
  "jsm",
  "libs",
  "draco",
);

const GLB_INPUT = path.join(MODELS_DIR, "cloud.glb");
const GLB_OUTPUT = path.join(MODELS_DIR, "cloud-opt.glb");
const HDR_INPUT = path.join(MODELS_DIR, "classroom.hdr");
const HDR_OUTPUT = path.join(HDRI_DIR, "classroom-1k.hdr");

/** 바이트를 MB 문자열로. */
function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// 1. glb 파이프라인 — prune → dedup → weld → textureCompress → draco
//
// 순서 근거:
//   - prune/dedup/weld 는 draco **앞**. draco 는 최종 인코딩이라 그 뒤에
//     지오메트리를 만지면 다시 인코딩해야 한다.
//   - textureCompress 는 지오메트리와 독립이지만 weld 뒤에 둬 용접으로 바뀐
//     UV 를 반영한다. 모든 슬롯을 1024/WebP 로.
//   - weld 는 로우폴리 룩을 부드럽게 만들 수 있다(cloud.glb 는 구름이라 무관).
// ---------------------------------------------------------------------------
async function optimizeGlb() {
  if (!fs.existsSync(GLB_INPUT)) {
    console.warn(`[glb] 건너뜀 — 원본 없음: ${path.relative(ROOT, GLB_INPUT)}`);
    return;
  }

  const beforeBytes = fs.statSync(GLB_INPUT).size;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.encoder": await draco3d.createEncoderModule(),
      "draco3d.decoder": await draco3d.createDecoderModule(),
    });

  const document = await io.read(GLB_INPUT);

  await document.transform(
    prune(),
    dedup(),
    weld(),
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [1024, 1024],
      quality: 85,
    }),
    draco({
      method: "edgebreaker",
      // cloud.glb 는 116만 정점이라 quantizePosition 이 곧 파일 크기다.
      // 12 로 낮춰도 구름의 부드러운 실루엣에는 눈에 띄는 손상이 없다.
      // (14 → 6.07MB, 12 → 목표 6MB 이내. 형태가 각지면 13~14 로 올린다.)
      quantizePosition: 12,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    }),
  );

  await io.write(GLB_OUTPUT, document);

  const afterBytes = fs.statSync(GLB_OUTPUT).size;
  console.log(
    `[glb] ${path.relative(ROOT, GLB_INPUT)}  ${mb(beforeBytes)} → ` +
      `${mb(afterBytes)}  (${(beforeBytes / afterBytes).toFixed(1)}×)`,
  );
}

// ---------------------------------------------------------------------------
// 2. hdr 파이프라인 — RGBELoader 읽기 → 박스 필터 다운샘플 → RGBE 재인코딩
//
//   sharp 는 Radiance .hdr 를 못 읽으므로 three 의 RGBELoader 로 float RGB 를
//   얻어, 8×8 블록 평균(HDR 값이라 감마 보정 없이 선형 평균)으로 8192×4096 →
//   1024×512 로 줄인 뒤, 공유 지수 RGBE 바이트로 다시 인코딩한다.
//   RLE 없이 flat RGBE — 파일이 조금 크지만 표준을 만족하고 RGBELoader 가 읽는다.
// ---------------------------------------------------------------------------

/** float RGB(선형) → RGBE 4바이트 (three RGBELoader 의 역연산). */
function floatToRgbe(r, g, b, out, offset) {
  const max = Math.max(r, g, b);
  if (max < 1e-32) {
    out[offset] = 0;
    out[offset + 1] = 0;
    out[offset + 2] = 0;
    out[offset + 3] = 0;
    return;
  }
  // max = mantissa * 2^exponent, mantissa ∈ [0.5, 1)
  let exponent = Math.ceil(Math.log2(max));
  exponent = Math.min(Math.max(exponent, -128), 127);
  const scale = 256 / Math.pow(2, exponent);
  out[offset] = Math.min(255, Math.floor(r * scale));
  out[offset + 1] = Math.min(255, Math.floor(g * scale));
  out[offset + 2] = Math.min(255, Math.floor(b * scale));
  out[offset + 3] = exponent + 128;
}

function optimizeHdr() {
  if (!fs.existsSync(HDR_INPUT)) {
    console.warn(`[hdr] 건너뜀 — 원본 없음: ${path.relative(ROOT, HDR_INPUT)}`);
    return;
  }

  const beforeBytes = fs.statSync(HDR_INPUT).size;
  const buffer = fs.readFileSync(HDR_INPUT);

  // RGBELoader(=HDRLoader) 는 기본이 HalfFloatType 이라 data 가 Uint16(half float
  // 원시 비트)로 온다. 그걸 그대로 float 로 읽으면 값이 수천 배로 뻥튀기된다.
  // setDataType(FloatType) 으로 Float32Array(선형 RGB)를 직접 받는다.
  const loader = new RGBELoader();
  loader.setDataType(THREE.FloatType);
  const parsed = loader.parse(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  );

  const srcW = parsed.width;
  const srcH = parsed.height;
  const src = parsed.data; // RGBA Float32, 채널당 선형 RGB
  const channels = src.length / (srcW * srcH); // 보통 4

  const readChannel = (index) => src[index];

  const dstW = 1024;
  const dstH = 512;
  const blockX = Math.round(srcW / dstW);
  const blockY = Math.round(srcH / dstH);

  const rgbe = Buffer.alloc(dstW * dstH * 4);

  for (let dy = 0; dy < dstH; dy += 1) {
    for (let dx = 0; dx < dstW; dx += 1) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      for (let by = 0; by < blockY; by += 1) {
        const sy = dy * blockY + by;
        if (sy >= srcH) break;
        for (let bx = 0; bx < blockX; bx += 1) {
          const sx = dx * blockX + bx;
          if (sx >= srcW) break;
          const si = (sy * srcW + sx) * channels;
          sumR += readChannel(si);
          sumG += readChannel(si + 1);
          sumB += readChannel(si + 2);
          count += 1;
        }
      }

      const di = (dy * dstW + dx) * 4;
      floatToRgbe(sumR / count, sumG / count, sumB / count, rgbe, di);
    }
  }

  // RADIANCE 헤더 + flat RGBE 스캔라인
  const header =
    "#?RADIANCE\n" +
    "FORMAT=32-bit_rle_rgbe\n" +
    "\n" +
    `-Y ${dstH} +X ${dstW}\n`;

  fs.mkdirSync(HDRI_DIR, { recursive: true });
  fs.writeFileSync(HDR_OUTPUT, Buffer.concat([Buffer.from(header, "ascii"), rgbe]));

  const afterBytes = fs.statSync(HDR_OUTPUT).size;
  console.log(
    `[hdr] ${path.relative(ROOT, HDR_INPUT)}  ${mb(beforeBytes)} ` +
      `(${srcW}×${srcH}) → ${mb(afterBytes)} (${dstW}×${dstH})  ` +
      `(${(beforeBytes / afterBytes).toFixed(1)}×)`,
  );

  // 되읽어 검증 — 해상도·값 범위가 정상인지 (원본과 평균이 비슷해야 한다)
  const checkLoader = new RGBELoader();
  checkLoader.setDataType(THREE.FloatType);
  const check = checkLoader.parse(fs.readFileSync(HDR_OUTPUT).buffer);
  let maxValue = 0;
  let sumValue = 0;
  for (let i = 0; i < check.data.length; i += 4) {
    maxValue = Math.max(maxValue, check.data[i], check.data[i + 1], check.data[i + 2]);
    sumValue += check.data[i] + check.data[i + 1] + check.data[i + 2];
  }
  const avgValue = sumValue / ((check.data.length / 4) * 3);
  console.log(
    `[hdr] 검증 — 되읽기 ${check.width}×${check.height}, ` +
      `최대 ${maxValue.toFixed(2)}, 평균 ${avgValue.toFixed(3)} ` +
      `(정상 실내 HDRI 평균은 대략 0.1~5)`,
  );
}

// ---------------------------------------------------------------------------
// 3. Draco 디코더 복사 (gltf-model-loading 6절 방식 — 설명은 그쪽 소관, 복사만)
// ---------------------------------------------------------------------------
function copyDracoDecoder() {
  if (!fs.existsSync(DRACO_SRC)) {
    console.warn(`[draco] 건너뜀 — 소스 없음: ${path.relative(ROOT, DRACO_SRC)}`);
    return;
  }
  fs.rmSync(DRACO_DEST, { recursive: true, force: true });
  fs.cpSync(DRACO_SRC, DRACO_DEST, { recursive: true });
  console.log(`[draco] 디코더 복사 → ${path.relative(ROOT, DRACO_DEST)}/`);
}

async function main() {
  await optimizeGlb();
  optimizeHdr();
  copyDracoDecoder();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
