'use client';

export { meta } from './meta';

import { Environment, Lightformer } from '@react-three/drei';

/** 한 행의 칸 수 */
const GRID_SIZE = 5;
/** 구체 사이 간격 */
const SPACING = 1.5;

/** metalness는 0 또는 1만 쓴다. 물리적으로 중간값은 존재하지 않는다. */
const METALNESS_ROWS = [0, 1] as const;

/** roughness를 0.05 ~ 0.95 사이에서 균등 분할한다. */
function roughnessAt(columnIndex: number): number {
  return 0.05 + (0.9 * columnIndex) / (GRID_SIZE - 1);
}

export function Scene() {
  return (
    <>
      {/*
        PBR은 환경맵 없이 성립하지 않는다.
        아랫줄(metalness=1)은 환경맵이 없으면 통째로 검게 나온다.
        Lightformer로 절차 생성해 외부 파일 의존을 없앴다.
      */}
      <Environment resolution={256} environmentIntensity={1.1}>
        <Lightformer
          form="rect"
          intensity={6}
          scale={[14, 6]}
          position={[0, 7, -6]}
          color="#ffffff"
        />
        <Lightformer
          form="circle"
          intensity={3}
          scale={6}
          position={[-8, 2, 3]}
          color="#a8c8ff"
        />
        <Lightformer
          form="rect"
          intensity={2.5}
          scale={[8, 5]}
          position={[8, 1, 3]}
          color="#ffd9a8"
        />
      </Environment>

      {/* 환경맵은 또렷한 그림자를 만들지 않으므로 key light를 병행한다. */}
      <directionalLight position={[4, 7, 5]} intensity={1.2} castShadow />

      <group position={[0, 0.5, 0]}>
        {METALNESS_ROWS.map((metalness, rowIndex) =>
          Array.from({ length: GRID_SIZE }, (_, columnIndex) => (
            <mesh
              key={`${metalness}-${columnIndex}`}
              castShadow
              position={[
                (columnIndex - (GRID_SIZE - 1) / 2) * SPACING,
                (0.55 - rowIndex) * SPACING,
                0,
              ]}
            >
              {/* roughness가 낮은 칸에서 반사가 각져 보이지 않도록 세그먼트를 충분히 준다. */}
              <sphereGeometry args={[0.58, 64, 64]} />
              <meshStandardMaterial
                // 금속에서 color는 반사를 물들이고, 비금속에서는 확산광 색이 된다.
                color={metalness === 1 ? '#dcdcdc' : '#c8452f'}
                metalness={metalness}
                roughness={roughnessAt(columnIndex)}
              />
            </mesh>
          )),
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#15161a" roughness={0.9} metalness={0} />
      </mesh>
    </>
  );
}
