import type { ShowcaseMeta } from "@/domain/showcase";

export const meta: ShowcaseMeta = {
  title: "물리 블록 타워",
  category: "interactive-art",
  usedSkills: [
    "standard-scene-setup",
    "pointer-raycast-hover",
    "physics-rigidbody",
  ],
  a11yLabel:
    "물리 시뮬레이션 장면입니다. 블록 15개가 중력으로 쌓여 탑을 이루고, 화면을 클릭하면 그 방향으로 공이 날아가 탑을 무너뜨립니다. 리셋 버튼으로 다시 쌓을 수 있습니다.",
  description:
    "rapier(Rust→wasm) 강체 물리로 A·B·C 세 시나리오를 한 씬에서 보여준다 — 15개 블록이 중력으로 쌓여 안착하고(A), 캔버스를 클릭하면 그 방향으로 공이 applyImpulse로 발사되며(B), 공이 부딪히면 탑이 회전하며 무너진다(C). 리셋은 블록 컨테이너 key를 올려 remount. 계기판은 useRapier().world에서 활성/sleeping 강체 수를 읽는다. prefers-reduced-motion이면 <Physics paused>로 정지.",
};
