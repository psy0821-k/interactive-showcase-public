/**
 * skeletal-animation(ISSUE-19) 예제용 .glb 생성 스크립트.
 *
 * 왜 스크립트로 만드는가
 * ----------------------
 * 스켈레탈 애니메이션을 보이려면 **본(Bone) + SkinnedMesh + AnimationClip**이 든
 * 모델이 필요하다. 외부 CDN이나 원격 URL을 런타임에 받아오면 오프라인에서
 * 빌드가 깨지고 재현성이 사라지므로(PRD 03절: 대용량 에셋 파이프라인 없음),
 * three가 이미 갖고 있는 `GLTFExporter`로 **코드에서 만들어 public/에 커밋**한다.
 * 같은 저장소의 `lantern.glb`도 GLTFExporter로 만들어졌다(asset.generator 확인).
 *
 * 만드는 것
 * ---------
 * - 5마디 본 체인(root → spine → chest → neck → head)에 스킨 웨이트를 칠한
 *   원통형 SkinnedMesh 한 개
 * - 클립 2개
 *   - "idle" — 제자리에서 느리게 좌우로 흔들린다 (LoopRepeat, 4초)
 *   - "march" — 크게 굽혔다 펴며 행진하듯 움직인다 (LoopRepeat, 1.2초)
 *
 * 실행
 * ----
 *   node scripts/generate-marcher-glb.mjs
 *   → public/models/marcher.glb
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/**
 * GLTFExporter는 브라우저 API인 `FileReader`로 Blob을 ArrayBuffer로 바꾼다.
 * Node에는 없으므로 `Blob.arrayBuffer()`로 같은 일을 하는 최소 폴리필을 둔다.
 * (three가 쓰는 것은 `readAsArrayBuffer` + `onloadend`뿐이지만, 버전에 따라
 * `onload`를 보는 코드 경로도 있어 둘 다 호출한다.)
 */
if (typeof globalThis.FileReader === "undefined") {
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
const OUTPUT_PATH = resolve(SCRIPT_DIR, "../public/models/marcher.glb");

/** 본 개수. 루트를 포함한다. */
const BONE_COUNT = 5;
/** 본 한 마디의 길이(월드 유닛). 전체 높이 = BONE_COUNT-1 마디. */
const BONE_LENGTH = 0.42;
/** 몸통 원통의 반지름. */
const BODY_RADIUS = 0.22;
/** 원통을 세로로 몇 등분할지. 세그먼트가 적으면 스키닝이 각져 보인다. */
const HEIGHT_SEGMENTS = 24;
const RADIAL_SEGMENTS = 16;

/**
 * 본 체인을 만든다.
 *
 * 각 본은 부모 기준 y로 BONE_LENGTH만큼 올라간 곳에 놓인다. 루트만 y=0.
 * `Bone.name`은 클립의 트랙 이름(`본이름.quaternion`)과 묶이므로 안정적으로
 * 유지해야 한다 — 이름이 어긋나면 클립이 조용히 아무 일도 하지 않는다.
 */
function createBoneChain() {
  const bones = [];

  for (let index = 0; index < BONE_COUNT; index += 1) {
    const bone = new THREE.Bone();
    bone.name = `Joint${index}`;
    bone.position.y = index === 0 ? 0 : BONE_LENGTH;

    if (index > 0) bones[index - 1].add(bone);
    bones.push(bone);
  }

  return bones;
}

/**
 * 원통 지오메트리에 스킨 인덱스/웨이트 속성을 칠한다.
 *
 * 정점의 높이 y를 마디 단위로 나눠 아래 본과 위 본에 선형 분배한다.
 * (웨이트 합은 항상 1 — 합이 1이 아니면 메시가 늘어나거나 쪼그라든다.)
 */
function applySkinWeights(geometry) {
  const position = geometry.attributes.position;
  const totalHeight = BONE_LENGTH * (BONE_COUNT - 1);

  const skinIndices = [];
  const skinWeights = [];

  for (let i = 0; i < position.count; i += 1) {
    // 지오메트리는 원점 중심이므로 바닥이 0이 되도록 올린다.
    const y = position.getY(i) + totalHeight / 2;
    const normalized = Math.min(Math.max(y / BONE_LENGTH, 0), BONE_COUNT - 1.001);

    const lowerBone = Math.floor(normalized);
    const upperWeight = normalized - lowerBone;

    skinIndices.push(lowerBone, lowerBone + 1, 0, 0);
    skinWeights.push(1 - upperWeight, upperWeight, 0, 0);
  }

  geometry.setAttribute(
    "skinIndex",
    new THREE.Uint16BufferAttribute(skinIndices, 4),
  );
  geometry.setAttribute(
    "skinWeight",
    new THREE.Float32BufferAttribute(skinWeights, 4),
  );
}

/** 관절 하나의 quaternion 키프레임 트랙을 만든다. */
function createJointTrack(boneName, times, anglesZ, anglesX) {
  const values = [];
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();

  for (let i = 0; i < times.length; i += 1) {
    euler.set(anglesX[i], 0, anglesZ[i]);
    quaternion.setFromEuler(euler);
    values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }

  return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values);
}

/**
 * "idle" — 4초 주기로 아주 얕게 좌우로 흔들린다.
 *
 * 첫 키와 마지막 키를 같은 값으로 두어 LoopRepeat에서 이음매가 튀지 않게 한다.
 */
function createIdleClip(bones) {
  const times = [0, 1, 2, 3, 4];
  const tracks = bones.slice(1).map((bone, index) => {
    const amplitude = 0.035 + index * 0.012;
    const anglesZ = [0, amplitude, 0, -amplitude, 0];
    const anglesX = times.map(() => 0);
    return createJointTrack(bone.name, times, anglesZ, anglesX);
  });

  return new THREE.AnimationClip("idle", 4, tracks);
}

/**
 * "march" — 1.2초 주기로 크게 앞뒤로 굽혔다 편다.
 *
 * idle과 관절·트랙 이름이 같아야 크로스페이드가 부드럽게 섞인다.
 * (서로 다른 본을 건드리는 두 클립은 페이드해도 "섞이지" 않는다.)
 */
function createMarchClip(bones) {
  const times = [0, 0.3, 0.6, 0.9, 1.2];
  const tracks = bones.slice(1).map((bone, index) => {
    const amplitude = 0.3 - index * 0.05;
    const anglesX = [0, amplitude, 0, -amplitude, 0];
    const anglesZ = times.map((_, i) => Math.sin(i * 1.6) * 0.08);
    return createJointTrack(bone.name, times, anglesZ, anglesX);
  });

  return new THREE.AnimationClip("march", 1.2, tracks);
}

function buildScene() {
  const bones = createBoneChain();
  const skeleton = new THREE.Skeleton(bones);

  const geometry = new THREE.CylinderGeometry(
    BODY_RADIUS * 0.7,
    BODY_RADIUS,
    BONE_LENGTH * (BONE_COUNT - 1),
    RADIAL_SEGMENTS,
    HEIGHT_SEGMENTS,
  );
  applySkinWeights(geometry);

  const material = new THREE.MeshStandardMaterial({
    name: "MarcherBody",
    color: new THREE.Color("#c9d4e6"),
    metalness: 0.15,
    roughness: 0.55,
  });

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = "MarcherBody";
  // 지오메트리 중심이 원점이므로 바닥(y=0)에 세우려면 절반만큼 올린다.
  mesh.position.y = (BONE_LENGTH * (BONE_COUNT - 1)) / 2;
  mesh.add(bones[0]);
  mesh.bind(skeleton);

  const root = new THREE.Group();
  root.name = "Marcher";
  root.add(mesh);

  return { root, bones };
}

async function main() {
  const { root, bones } = buildScene();
  const animations = [createIdleClip(bones), createMarchClip(bones)];

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root, {
    binary: true,
    animations,
    // 본/스킨 정보를 보존하려면 필수. 끄면 SkinnedMesh가 정적 메시가 된다.
    onlyVisible: false,
  });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, Buffer.from(glb));

  console.log(`생성 완료: ${OUTPUT_PATH} (${Buffer.from(glb).length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
