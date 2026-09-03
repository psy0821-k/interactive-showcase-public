/**
 * decal-and-projection(ISSUE-40) 예제용 머그컵 .glb 생성 스크립트.
 *
 * 왜 스크립트로 만드는가
 * ----------------------
 * 데칼(`<Decal>`)은 **부모 메시의 지오메트리**가 있어야 투영 지오메트리를
 * 만든다. 제품 룩이 필요하지만 대용량 glb는 커밋 금지(asset-optimization)이고
 * 저장소에 제품 모델이 없다. three가 이미 갖고 있는 `GLTFExporter`로
 * **코드에서 머그컵을 만들어 public/에 커밋**한다. `lantern.glb`·`marcher.glb`도
 * 같은 방식이다(asset.generator 확인).
 *
 * 만드는 것
 * ---------
 * - 단일 메시 "mug" — 원통 몸통 + 토러스 호 손잡이를 병합한 것
 *   - 몸통: 곡률이 매끄럽도록 radialSegments 크게. 바닥 있음(모서리 곡률로
 *     곡면 데칼 bleeding을 시연한다)
 *   - 손잡이: TorusGeometry 호(arc). TubeGeometry보다 정점이 적고 곡률이 균일
 * - 세라믹 느낌의 MeshStandardMaterial (데칼이 조명을 받는 대조에 쓰인다)
 *
 * 데칼 배치 지점(쇼케이스에서 사용)
 * --------------------------------
 * - 원통 옆면(곡률 작음)      → 시나리오 A: 깨끗한 정적 배치
 * - 바닥 모서리(곡률 큼)      → 시나리오 B: 투영 상자 관통 → bleeding
 * - 손잡이 반대편 옆면        → 시나리오 C′: map 축약형(조명 안 받음) 대조
 *
 * 실행
 * ----
 *   node scripts/generate-mug-glb.mjs
 *   → public/models/mug.glb
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * GLTFExporter는 브라우저 API인 `FileReader`로 Blob을 ArrayBuffer로 바꾼다.
 * Node에는 없으므로 최소 폴리필을 둔다(generate-marcher-glb.mjs와 동일).
 */
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    constructor() {
      this.result = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
    }

    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buffer) => {
          this.result = buffer;
          this.onload?.({ target: this });
          this.onloadend?.({ target: this });
        })
        .catch((error) => this.onerror?.(error));
    }
  };
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(SCRIPT_DIR, '../public/models/mug.glb');

/** 몸통 원통 치수. */
const BODY_RADIUS = 0.85;
const BODY_HEIGHT = 1.7;
/** radialSegments — 곡면 데칼이 매끄럽게 투영되려면 충분히 커야 한다.
 *  40이면 육안상 매끄럽고 glb는 40KB 아래로 유지된다. */
const BODY_RADIAL_SEGMENTS = 40;
const BODY_HEIGHT_SEGMENTS = 2;

/** 바닥 필렛 링 — 모서리에 곡률을 줘서 곡면 데칼(B)이 걸치게 한다.
 *  둘레 방향은 몸통 절반만 있어도 육안상 충분하다. */
const FILLET_TUBE_RADIUS = 0.14;
const FILLET_RADIAL_SEGMENTS = 24;

/** 손잡이 토러스 호. */
const HANDLE_RADIUS = 0.62;
const HANDLE_TUBE_RADIUS = 0.13;
const HANDLE_ARC = Math.PI * 1.15;

/** 컵 벽 두께. 안쪽 벽을 이만큼 안으로 들여 만든다. */
const WALL_THICKNESS = 0.06;

/**
 * 몸통을 만든다 — 바깥 벽 + 안쪽 벽 + 위 테두리 링 + 바닥.
 *
 * 안쪽 벽을 두는 이유: 데칼은 표면 일부만 덮으므로 카메라를 돌리면 컵
 * 뒷면 안쪽이 보인다. 바깥 벽 하나(openEnded)만 두면 backface culling으로
 * "속 빈 반쪽"처럼 보인다. 양면 렌더(DoubleSide)로 때우면 데칼 polygonOffset과
 * 겹쳐 z-fighting이 난다. 그래서 얇은 벽을 실제로 만든다.
 */
function createBody() {
  const parts = [];

  const outerTop = BODY_RADIUS;
  const outerBottom = BODY_RADIUS * 0.94; // 아래로 살짝 좁아지는 실루엣
  const innerTop = outerTop - WALL_THICKNESS;
  const innerBottom = outerBottom - WALL_THICKNESS;

  const outerWall = new THREE.CylinderGeometry(
    outerTop,
    outerBottom,
    BODY_HEIGHT,
    BODY_RADIAL_SEGMENTS,
    BODY_HEIGHT_SEGMENTS,
    true,
  );
  parts.push(outerWall);

  // 안쪽 벽 — 법선이 안을 향하도록 뒤집는다.
  const innerWall = new THREE.CylinderGeometry(
    innerTop,
    innerBottom,
    BODY_HEIGHT - WALL_THICKNESS, // 바닥 두께만큼 짧게
    BODY_RADIAL_SEGMENTS,
    BODY_HEIGHT_SEGMENTS,
    true,
  );
  innerWall.scale(-1, 1, 1); // 법선 반전
  innerWall.translate(0, WALL_THICKNESS / 2, 0);
  parts.push(innerWall);

  // 위 테두리 링 — 바깥 벽 상단과 안쪽 벽 상단을 잇는다.
  const rim = new THREE.RingGeometry(innerTop, outerTop, BODY_RADIAL_SEGMENTS);
  rim.rotateX(-Math.PI / 2);
  rim.translate(0, BODY_HEIGHT / 2, 0);
  parts.push(rim);

  // 바닥 원판(안쪽에서 보이므로 위를 향하게).
  const base = new THREE.CircleGeometry(innerBottom, BODY_RADIAL_SEGMENTS);
  base.rotateX(-Math.PI / 2);
  base.translate(0, -BODY_HEIGHT / 2 + WALL_THICKNESS, 0);
  parts.push(base);

  // 바깥 바닥 원판(아래에서 보이므로 아래를 향하게).
  const baseUnder = new THREE.CircleGeometry(outerBottom, BODY_RADIAL_SEGMENTS);
  baseUnder.rotateX(Math.PI / 2);
  baseUnder.translate(0, -BODY_HEIGHT / 2, 0);
  parts.push(baseUnder);

  // 바닥 모서리 필렛 — 반쪽 토러스(원환의 아래 절반)로 근사.
  const fillet = new THREE.TorusGeometry(
    BODY_RADIUS * 0.94 - FILLET_TUBE_RADIUS * 0.2,
    FILLET_TUBE_RADIUS,
    6,
    FILLET_RADIAL_SEGMENTS,
    Math.PI * 2,
  );
  fillet.rotateX(-Math.PI / 2);
  fillet.translate(0, -BODY_HEIGHT / 2 + FILLET_TUBE_RADIUS * 0.4, 0);
  parts.push(fillet);

  return parts;
}

/**
 * 손잡이를 만든다. 토러스 호를 컵 옆(+x)에 D자로 붙인다.
 *
 * TorusGeometry는 xy 평면에 놓이고 구멍이 +z를 향한다. 회전 없이 +x로
 * 옮기면 손잡이 구멍이 정면(+z)을 향하는 D자 손잡이가 된다. 호 열린 쪽이
 * 컵을 향하도록 z축으로 반 바퀴 돌린다.
 */
function createHandle() {
  const handle = new THREE.TorusGeometry(
    HANDLE_RADIUS,
    HANDLE_TUBE_RADIUS,
    12,
    36,
    HANDLE_ARC,
  );

  // 호(arc)는 +x축에서 시작해 반시계로 그려진다. 호를 절반 각도만큼
  // 시계 방향으로 돌리면 열린 구간이 -x(컵 쪽)를 향하고 위아래로 대칭이 된다.
  handle.rotateZ(-HANDLE_ARC / 2);
  handle.translate(BODY_RADIUS * 0.7, 0, 0);

  return handle;
}

function buildMesh() {
  const geometries = [...createBody(), createHandle()];

  // 병합 전 모든 지오메트리의 속성 세트를 맞춘다(uv 유무가 섞이면 병합 실패).
  for (const geometry of geometries) {
    geometry.deleteAttribute('uv');
    geometry.deleteAttribute('uv1');
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  }

  const merged = mergeGeometries(geometries, false);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    name: 'MugCeramic',
    color: new THREE.Color('#f2ede3'), // 아이보리 세라믹
    metalness: 0.0,
    roughness: 0.38,
  });

  const mesh = new THREE.Mesh(merged, material);
  // `useGLTF(...).nodes.mug` 로 접근하기 위한 이름.
  mesh.name = 'mug';

  const root = new THREE.Group();
  root.name = 'Mug';
  root.add(mesh);

  return root;
}

async function main() {
  const root = buildMesh();

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root, {
    binary: true,
    onlyVisible: false,
  });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const buffer = Buffer.from(glb);
  writeFileSync(OUTPUT_PATH, buffer);

  console.log(`생성 완료: ${OUTPUT_PATH} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
