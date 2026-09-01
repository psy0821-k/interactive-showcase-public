"use client";

export { meta } from "./meta";

import { useRef } from "react";
import * as THREE from "three";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { SceneLabel } from "@/components/scene-label";
import { useGsapScene } from "@/hooks/use-gsap-scene";

/** 진열대 위에 오르는 제품 개수. 타임라인에서 stagger로 차례 등장한다. */
const PRODUCT_COUNT = 3;
/** 제품 사이 간격(월드 단위) */
const PRODUCT_GAP = 1.1;
/** 제품 큐브 한 변 */
const PRODUCT_SIZE = 0.6;

/** 진열대 상판 높이(바닥 기준) */
const PLINTH_TOP_Y = 0;

const PRODUCT_COLORS = ["#4dd4ac", "#6ba6ff", "#ffb454"];
const PLINTH_COLOR = "#2c3440";
const LABEL_COLOR = "#e8edf5";

/** 제품의 최종 x 좌표. 가운데 정렬. */
function productX(index: number): number {
  return (index - (PRODUCT_COUNT - 1) / 2) * PRODUCT_GAP;
}

/**
 * 하나의 제품 큐브.
 *
 * ref만 부모에 넘기고, 등장 애니메이션은 부모의 타임라인이 일괄 제어한다.
 * (개별 컴포넌트가 트윈을 만들면 stagger를 못 준다.)
 */
interface ProductProps {
  meshRef: (el: THREE.Mesh | null) => void;
  index: number;
}

function Product({ meshRef, index }: ProductProps) {
  return (
    <mesh
      ref={meshRef}
      position={[productX(index), PLINTH_TOP_Y + PRODUCT_SIZE / 2, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[PRODUCT_SIZE, PRODUCT_SIZE, PRODUCT_SIZE]} />
      <meshStandardMaterial
        color={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
        roughness={0.35}
        metalness={0.15}
      />
    </mesh>
  );
}

export function Scene() {
  const plinthRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  const productsRef = useRef<THREE.Mesh[]>([]);

  useGsapScene(({ gsap, reduced }) => {
    const plinth = plinthRef.current;
    const label = labelRef.current;
    const products = productsRef.current.filter(Boolean);
    if (!plinth || !label || products.length === 0) return;

    const productPositions = products.map((mesh) => mesh.position);
    const productScales = products.map((mesh) => mesh.scale);

    if (reduced) {
      // 모션 축소: 타임라인을 만들지 않고 최종 상태만 즉시 찍는다.
      gsap.set(plinth.scale, { x: 1, y: 1, z: 1 });
      gsap.set(label.position, { y: 1.55 });
      products.forEach((mesh, index) => {
        gsap.set(mesh.position, {
          y: PLINTH_TOP_Y + PRODUCT_SIZE / 2,
        });
        gsap.set(mesh.scale, { x: 1, y: 1, z: 1 });
        // x는 렌더 시 이미 최종값이라 건드리지 않는다.
        void index;
      });
      return;
    }

    // 자식 트윈 공통값은 생성자 duration이 아니라 defaults로 준다.
    const tl = gsap.timeline({
      defaults: { duration: 0.6, ease: "power3.out" },
    });

    tl
      // 1. 진열대가 바닥에서 솟아오른다.
      .from(plinth.scale, { x: 0.001, y: 0.001, z: 0.001, ease: "back.out(1.6)" })
      // 2. 제품들이 진열대 위로 차례로(stagger) 떨어져 자리 잡는다.
      //    position/scale은 중첩 객체라 Vector3 배열로 펴서 넘긴다.
      .from(
        productPositions,
        { y: PLINTH_TOP_Y + PRODUCT_SIZE / 2 + 1.4, stagger: 0.12 },
        "-=0.15",
      )
      .from(
        productScales,
        { x: 0.4, y: 0.4, z: 0.4, ease: "back.out(1.7)", stagger: 0.12 },
        "<",
      )
      // 3. 라벨이 위에서 내려온다.
      .from(label.position, { y: 2.6, ease: "power2.out" }, "-=0.3");
  });

  return (
    <>
      {/*
        진열대(폭 약 3.5유닛)와 상단 라벨을 담아야 한다. 상세 캔버스는
        정사각형에 가까워 가로가 제약이므로 기본보다 좁은 화각으로 물러난다.
      */}
      <PerspectiveCamera
        makeDefault
        fov={38}
        near={0.5}
        far={40}
        position={[0, 1.7, 6.4]}
      />

      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer
          form="rect"
          intensity={4}
          scale={[10, 5]}
          position={[0, 6, -4]}
          color="#dce8ff"
        />
      </Environment>

      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 4]} intensity={2.1} castShadow />

      {/* 바닥 */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#161a21" roughness={0.95} />
      </mesh>

      {/* 진열대 상판. 위쪽 면이 y=0에 오도록 배치. */}
      <mesh ref={plinthRef} position={[0, -0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[PRODUCT_GAP * PRODUCT_COUNT + 0.6, 0.7, 1.6]} />
        <meshStandardMaterial
          color={PLINTH_COLOR}
          roughness={0.5}
          metalness={0.35}
        />
      </mesh>

      {Array.from({ length: PRODUCT_COUNT }, (_, index) => (
        <Product
          key={index}
          index={index}
          meshRef={(el) => {
            if (el) productsRef.current[index] = el;
          }}
        />
      ))}

      <group ref={labelRef} position={[0, 1.55, 0]}>
        <SceneLabel fontSize={0.26} color={LABEL_COLOR} outlineWidth={0.01}>
          NEW ARRIVALS
        </SceneLabel>
      </group>
    </>
  );
}
