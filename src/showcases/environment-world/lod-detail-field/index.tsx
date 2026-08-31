"use client";

import { useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Detailed, PerspectiveCamera } from "@react-three/drei";
import type { ShowcaseMeta } from "@/domain/showcase";
import { SceneReadout } from "@/components/scene-label";

export const meta: ShowcaseMeta = {
  title: "LOD 디테일 필드",
  category: "environment-world",
  usedSkills: [
    "standard-scene-setup",
    "camera-rig",
    "procedural-geometry",
    "lod-and-frustum",
  ],
  description:
    "같은 자리에 놓인 기둥 60개가 카메라 거리에 따라 고·중·저 디테일로 갈아탄다. 단계마다 색이 달라 전환 순간이 눈에 보이고, 화면 위 계기가 드로우콜과 삼각형 수를 실시간으로 보여준다. 줌아웃하면 삼각형이 줄고, 카메라를 돌려 오브젝트가 화면 밖으로 나가면 프러스텀 컬링이 드로우콜까지 깎아낸다.",
};

/** 필드 한 변의 기둥 개수. 총 기둥은 FIELD_SIZE^2 개다. */
const FIELD_SIZE = 8;
/** 기둥 간격(월드 단위) */
const FIELD_GAP = 3.2;
/** 기둥 반지름 */
const PILLAR_RADIUS = 0.55;
/** 기둥 높이의 기준값. 실제 높이는 위치로 흔들어 변화를 준다. */
const PILLAR_BASE_HEIGHT = 1.6;

/**
 * LOD 단계별 원통 둘레 세그먼트 수.
 * 고→저로 갈수록 삼각형 수가 대략 4분의 1씩 줄어든다.
 */
const LEVEL_SEGMENTS = [48, 16, 6] as const;

/**
 * LOD 전환 거리(월드 단위). `<Detailed>`의 자식 순서와 1:1로 대응한다.
 * 첫 값이 0이어야 최근접 단계가 항상 존재한다 — 0이 아니면 그보다 가까울 때
 * 아무 단계도 고를 수 없다.
 *
 * **거리는 카메라와 씬 중심이 아니라 카메라와 LOD 오브젝트 각각 사이**로 잰다.
 * 필드 폭이 약 22유닛이라, 카메라가 중심에서 10유닛 떨어져 있어도 반대편
 * 기둥은 이미 25유닛 밖이다. 임계값이 너무 촘촘하면 "가까이 있는데도 필드
 * 대부분이 저디테일"이 되므로, 필드 크기를 고려해 22/46으로 벌렸다.
 *
 * 실측(64개 기둥, 헤드리스 크롬):
 *   거리 10 → 삼각형 8,642 (레벨0 52개 / 레벨1 12개)
 *   거리 80 → 삼각형 2,014 (전부 레벨2) — 약 77% 감소
 */
const LEVEL_DISTANCES = [0, 22, 46];

/**
 * 단계별 색. 실무에서는 단계가 티나지 않게 만드는 것이 목표지만,
 * 이 쇼케이스는 전환이 언제 일어나는지 보여야 하므로 일부러 다르게 둔다.
 */
const LEVEL_COLORS = ["#ff8f5e", "#7bd88f", "#5e8bff"] as const;

/**
 * 히스테리시스. 전환 거리의 비율(0.1 = 10%)만큼 되돌아와야 이전 단계로 복귀한다.
 * 임계값 경계에서 카메라가 미세하게 떨릴 때 단계가 깜빡이는 것을 막는다.
 */
const LEVEL_HYSTERESIS = 0.12;

/** 계기 텍스트 크기와 색 */
const HUD_FONT_SIZE = 0.44;
const HUD_COLOR = "#e8edf5";

/** 계기 갱신 주기(초). 매 프레임 갱신하면 숫자가 읽히지 않는다. */
const HUD_INTERVAL = 0.25;

/** 바닥 색 */
const GROUND_COLOR = "#141821";

interface PillarCell {
  id: number;
  position: [number, number, number];
  height: number;
}

/** 격자 좌표에서 기둥 위치와 높이를 만든다. 결정적이라 매 렌더 같은 필드가 나온다. */
function buildField(): PillarCell[] {
  const cells: PillarCell[] = [];
  const offset = ((FIELD_SIZE - 1) * FIELD_GAP) / 2;

  for (let iz = 0; iz < FIELD_SIZE; iz += 1) {
    for (let ix = 0; ix < FIELD_SIZE; ix += 1) {
      // 사인 두 개를 곱해 높이에 완만한 기복을 준다. 난수가 아니라 재현 가능하다.
      const height =
        PILLAR_BASE_HEIGHT * (1 + 0.5 * Math.sin(ix * 0.9) * Math.cos(iz * 0.7));

      cells.push({
        id: iz * FIELD_SIZE + ix,
        position: [ix * FIELD_GAP - offset, height / 2, iz * FIELD_GAP - offset],
        height,
      });
    }
  }

  return cells;
}

/** 단계별 머티리얼 하나를 만든다. 색만 다르고 나머지 속성은 공통이다. */
function createLevelMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 });
}

interface LodPillarProps {
  position: [number, number, number];
  height: number;
  material: THREE.Material[];
}

/**
 * 거리에 따라 세 단계로 갈아타는 기둥 하나.
 *
 * `<Detailed>`는 three의 `LOD`를 감싼 것이고, **자식의 순서가 곧 단계 순서**다.
 * distances[i]가 i번째 자식이 나타나기 시작하는 거리다. 순서를 뒤집으면
 * 가까이서 저디테일, 멀리서 고디테일이 나오는 정반대 결과가 된다.
 *
 * 세 단계가 같은 머티리얼을 공유하면 전환이 눈에 안 보이므로 단계별 색을 쓴다.
 * 머티리얼 인스턴스는 상위에서 한 번만 만들어 60개 기둥이 공유한다 —
 * 기둥마다 새로 만들면 머티리얼 60x3개가 되어 셰이더 프로그램 전환이 늘어난다.
 */
function LodPillar({ position, height, material }: LodPillarProps) {
  return (
    <Detailed
      position={position}
      distances={LEVEL_DISTANCES}
      hysteresis={LEVEL_HYSTERESIS}
    >
      {LEVEL_SEGMENTS.map((segments, index) => (
        <mesh key={segments} material={material[index]} castShadow receiveShadow>
          <cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, height, segments]} />
        </mesh>
      ))}
    </Detailed>
  );
}

/**
 * 카메라와 함께 움직이는 계기판.
 *
 * `gl.info.render`는 **직전에 실제로 그려진 것**의 통계다. 프러스텀 컬링에
 * 걸린 오브젝트는 여기 잡히지 않으므로, 카메라를 돌려 기둥을 화면 밖으로
 * 보내면 drawCalls가 즉시 떨어지는 것을 확인할 수 있다.
 *
 * 값을 React 상태에 담지 않는다. useFrame 안에서 setState를 부르면 매 프레임
 * 리렌더가 나고, 그 리렌더 자체가 측정 대상인 렌더 비용을 바꿔 버린다
 * (troubleshooting 12-J).
 */

/**
 * 카메라와 거리·렌더 통계를 보여주는 계기판.
 *
 * `gl.info.render`는 **직전에 실제로 그려진 것**의 통계다. 프러스텀 컬링에
 * 걸린 오브젝트는 여기 잡히지 않으므로, 카메라를 돌려 기둥을 화면 밖으로
 * 보내면 drawCalls가 즉시 떨어지는 것을 확인할 수 있다.
 *
 * 값을 React 상태에 담지 않는다. useFrame 안에서 setState를 부르면 매 프레임
 * 리렌더가 나고, 그 리렌더 자체가 측정 대상인 렌더 비용을 바꾼다
 * (troubleshooting 12-J).
 */
function RenderStats() {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  const getText = useCallback(() => {
    const { calls, triangles } = gl.info.render;
    const distance = camera.position.length();
    return (
      `거리 ${distance.toFixed(1)}  ·  ` +
      `드로우콜 ${calls}  ·  ` +
      `삼각형 ${triangles.toLocaleString("ko-KR")}`
    );
  }, [gl, camera]);

  return (
    <SceneReadout
      getText={getText}
      interval={HUD_INTERVAL}
      position={[0, 7.2, 0]}
      fontSize={HUD_FONT_SIZE}
      color={HUD_COLOR}
    />
  );
}

export function Scene() {
  const cells = useMemo(() => buildField(), []);

  /**
   * 단계별 머티리얼을 한 번만 만들어 기둥 64개가 공유한다.
   * 기둥마다 JSX로 `<meshStandardMaterial>`을 두면 192개가 생겨
   * LOD로 아낀 삼각형만큼을 머티리얼 관리 비용으로 도로 내주게 된다.
   *
   * React Compiler가 `.map()` 안의 생성자 호출은 메모이제이션을 보존하지
   * 못한다고 판단하므로(lint 에러), 단계별로 하나씩 만든다.
   */
  const nearMaterial = useMemo(() => createLevelMaterial(LEVEL_COLORS[0]), []);
  const midMaterial = useMemo(() => createLevelMaterial(LEVEL_COLORS[1]), []);
  const farMaterial = useMemo(() => createLevelMaterial(LEVEL_COLORS[2]), []);

  const levelMaterials = [nearMaterial, midMaterial, farMaterial];

  // useMemo로 만든 머티리얼은 R3F가 관리하지 않으므로 언마운트 시 직접 해제한다.
  useEffect(
    () => () => {
      nearMaterial.dispose();
      midMaterial.dispose();
      farMaterial.dispose();
    },
    [nearMaterial, midMaterial, farMaterial],
  );

  return (
    <>
      {/*
        필드 전체가 약 22유닛이므로 far는 여유 있게 120,
        near는 0.5로 둬 far/near = 240 — depth 정밀도에 문제가 없는 범위다.
        초기 위치를 가깝게 둬야 줌아웃하며 단계가 바뀌는 것을 볼 수 있다.
      */}
      <PerspectiveCamera makeDefault fov={50} near={0.5} far={120} position={[0, 6, 12]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 14, 6]} intensity={2.1} castShadow />
      <directionalLight position={[-6, 4, -8]} intensity={0.6} color="#8fb4ff" />

      {/*
        바닥은 하나뿐이고 항상 화면을 채우므로 컬링 이득이 없다.
        레이캐스팅에서만 빼 둔다.
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={GROUND_COLOR} roughness={0.95} />
      </mesh>

      {cells.map((cell) => (
        <LodPillar
          key={cell.id}
          position={cell.position}
          height={cell.height}
          material={levelMaterials}
        />
      ))}

      <RenderStats />
    </>
  );
}
