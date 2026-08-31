"use client";

/**
 * sdf-text-rendering(ISSUE-39) — 3D 씬 텍스트 공용 래퍼.
 *
 * drei `<Text>`(troika SDF)를 직접 쓰면 쇼케이스마다 다음을 반복해야 한다:
 *   - `font` 자체 호스팅 경로 (없으면 troika 기본 Roboto를 CDN에서 로드)
 *   - `characters` 프리로드 (없으면 첫 렌더에 FOUC)
 *   - `outlineWidth`/`outlineColor` (복잡한 배경 위 가독성)
 *   - 계기판은 `useRef<{ text: string }>` + `useFrame`에서 `.text` 갱신
 *     (setState로 갱신하면 초당 60회 리렌더)
 *
 * 이 파일이 그 기본값을 한곳에 묶는다.
 *   - `<SceneLabel>`  — 정적 라벨·헤드라인. children을 그대로 렌더
 *   - `<SceneReadout>` — 매 프레임 갱신되는 계기판. `getText`를 interval마다 호출해
 *                        troika 메시의 `.text`에 직접 대입. **setState 없음**
 *
 * `<Suspense>` 경계는 감싸지 않는다 — 셸(`showcase-canvas.tsx`)이 `<Canvas>` 안에
 * 제공하고, 쇼케이스가 필요하면 자체 경계를 Scene 안에 둔다. 이 래퍼는 순수
 * `<Text>` 래퍼다.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import type { TextProps } from "@react-three/drei";

/**
 * 자체 호스팅 폰트 경로. `scripts/build-font-subset.mjs`가 생성한
 * Pretendard 서브셋(KS X 1001 상용 한글 2350자 + 라틴 + 기호).
 * 모든 `<Text>`가 같은 URL을 공유하면 troika가 SDF 아틀라스를 1개만 만든다.
 *
 * **WOFF1(.woff)이다 — troika 파서는 WOFF2를 못 읽는다**(`wOF2` 시그니처에서
 * `Error: woff2 fonts not supported`). WOFF1은 내장 woff2otf로 변환해 파싱한다.
 */
export const FONT_URL = "/fonts/pretendard-subset.woff";

/**
 * `characters` 기본 프리로드 집합.
 *
 * 서브셋 파일이 상용 한글 전체를 담으므로 여기에 "전부"를 넣을 필요는 없다.
 * troika는 `characters`에 없는 글자를 렌더 시점에 SDF에 추가 생성한다.
 * 여기엔 **첫 화면에 자주 뜨는 글자**(라틴·숫자·기호 + 계기판·라벨 빈출 한글)만
 * 넣어 FOUC를 완화한다. 나머지 한글은 렌더될 때 troika가 채운다.
 */
export const LABEL_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" +
  " .,:;!?()[]{}/-+=%·×→⇄↔≈°±…‘’“”\n" +
  // 계기판·라벨 빈출 한글
  "측정중로딩완료개수거리드로우콜삼각형건물동종류별인스턴싱지오메트리병합" +
  "재질코팅유리간맑은말세광학센서돔구동휠냉각흡기구고이득안테나" +
  "강체던진공프레임의존정규화방식클릭바뀐다같다이전후시작정지";

/** troika 텍스트 메시 중 이 래퍼가 쓰는 부분만 좁힌 타입. drei ref 타입은 any다. */
interface TroikaTextMesh {
  text: string;
}

/** `<Text>`에 그대로 넘기는 prop 부분집합 + 래퍼 공통. */
type PassthroughTextProps = Pick<
  TextProps,
  | "position"
  | "rotation"
  | "scale"
  | "fontSize"
  | "fontWeight"
  | "color"
  | "anchorX"
  | "anchorY"
  | "maxWidth"
  | "textAlign"
  | "lineHeight"
  | "letterSpacing"
  | "outlineWidth"
  | "outlineColor"
  | "outlineBlur"
  | "sdfGlyphSize"
  | "characters"
  | "renderOrder"
>;

export interface SceneLabelProps extends PassthroughTextProps {
  /** 표시할 텍스트. */
  children: string;
  /**
   * 이 라벨을 레이캐스팅 대상으로 둘지. 기본은 `false` — 라벨은 보통 클릭
   * 대상이 아니고, 뒤 오브젝트의 포인터 이벤트를 가리면 안 된다.
   */
  raycastable?: boolean;
}

/** 배경 위 가독성 기본값. 개별 prop으로 override 가능. */
const DEFAULT_OUTLINE_WIDTH = "6%";
const DEFAULT_OUTLINE_COLOR = "#0b0e14";

/**
 * 정적 라벨·헤드라인.
 *
 * 예)
 *   <SceneLabel fontSize={0.6} outlineWidth={0.02} position={[0, 3, 0]}>
 *     공간 타이포그래피
 *   </SceneLabel>
 */
export function SceneLabel({
  children,
  raycastable = false,
  characters = LABEL_CHARACTERS,
  anchorX = "center",
  outlineWidth = DEFAULT_OUTLINE_WIDTH,
  outlineColor = DEFAULT_OUTLINE_COLOR,
  ...rest
}: SceneLabelProps) {
  return (
    <Text
      font={FONT_URL}
      characters={characters}
      anchorX={anchorX}
      outlineWidth={outlineWidth}
      outlineColor={outlineColor}
      raycast={raycastable ? undefined : () => null}
      {...rest}
    >
      {children}
    </Text>
  );
}

export interface SceneReadoutProps extends PassthroughTextProps {
  /**
   * 표시할 문자열을 돌려주는 함수. `interval`마다 호출되어 troika 메시의
   * `.text`에 직접 대입된다. **클로저가 stale 되지 않도록 사용처에서
   * `useCallback`으로 감싸거나, 함수 안에서 ref를 읽어라.**
   */
  getText: () => string;
  /** `getText` 호출 간격(초). 기본 0.3s — 계기판이 초당 60회 갱신될 이유는 없다. */
  interval?: number;
  /**
   * 텍스트 뒤에 반투명 패널을 깔지. HDRI·복잡한 배경 위 계기판 가독성.
   * `[width, height]` 월드 단위. 생략하면 패널 없음.
   */
  backdrop?: [number, number];
  /** backdrop 색. 기본 어두운 남색. */
  backdropColor?: string;
  /** backdrop 불투명도. 기본 0.72. */
  backdropOpacity?: number;
  /** 최초 SDF 생성 전 잠깐 보일 자리 문자열. 기본 "측정 중". */
  placeholder?: string;
}

/**
 * 매 프레임 갱신되는 계기판.
 *
 * `getText`를 `interval`마다 호출해 troika 메시 `.text`에 직접 대입한다.
 * React 상태를 건드리지 않으므로 계기판이 리렌더를 유발하지 않는다 —
 * `gl.info.render` 같은 "측정 대상"을 왜곡하지 않는다.
 *
 * 예)
 *   const readout = useCallback(
 *     () => `드로우콜 ${gl.info.render.calls}`,
 *     [gl],
 *   );
 *   <SceneReadout getText={readout} backdrop={[5.8, 1.1]} position={[0, 3.5, -1]} />
 */
export function SceneReadout({
  getText,
  interval = 0.3,
  backdrop,
  backdropColor = "#0b0e14",
  backdropOpacity = 0.72,
  placeholder = "측정 중",
  characters = LABEL_CHARACTERS,
  anchorX = "center",
  anchorY = "middle",
  ...rest
}: SceneReadoutProps) {
  const textRef = useRef<TroikaTextMesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < interval) return;
    elapsed.current = 0;

    const mesh = textRef.current;
    if (!mesh) return;
    mesh.text = getText();
  });

  const { position, ...textRest } = rest;
  // backdrop 크기는 렌더마다 새 배열이면 안 되므로 메모.
  const panel = useMemo(() => backdrop ?? null, [backdrop]);

  // backdrop과 텍스트를 한 group에 담아 position을 함께 옮긴다.
  return (
    <group position={position}>
      {panel && (
        <mesh position={[0, 0, -0.02]} raycast={() => null}>
          <planeGeometry args={panel} />
          <meshBasicMaterial
            color={backdropColor}
            transparent
            opacity={backdropOpacity}
            toneMapped={false}
          />
        </mesh>
      )}
      <Text
        ref={textRef}
        font={FONT_URL}
        characters={characters}
        anchorX={anchorX}
        anchorY={anchorY}
        raycast={() => null}
        {...textRest}
      >
        {placeholder}
      </Text>
    </group>
  );
}
