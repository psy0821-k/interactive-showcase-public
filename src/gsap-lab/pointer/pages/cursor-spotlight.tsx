"use client";

import { useRef } from "react";
import { useGsapDom } from "@/hooks/use-gsap-dom";
import { DemoShell } from "@/gsap-lab/demo-shell";

const HIDDEN_ITEMS = Array.from({ length: 9 }, (_, i) => ({
  label: `기밀 항목 ${i + 1}`,
  background: `hsl(${(i * 40) % 360} 45% 45%)`,
}));

/**
 * `/gsap-lab/cursor-spotlight` — 커서 주변만 밝아진다.
 *
 * 어두운 오버레이의 `mask-image`(radial-gradient) 중심을 `quickTo`로 커서
 * 위치에 부드럽게 따라붙인다. CSS 변수 `--x`/`--y`를 트윈하고 mask가 그것을
 * 참조한다. 데스크탑 전용.
 */
export function CursorSpotlightPage() {
  const container = useRef<HTMLDivElement>(null);

  useGsapDom(
    ({ gsap: g, reduced }) => {
      const stage = container.current?.querySelector<HTMLElement>(".spot-stage");
      if (!stage) return;

      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      if (!mq.matches || reduced) {
        // 모션 축소·터치: 스포트라이트를 끄고 전체를 보이게 한다.
        stage.style.setProperty("--spot", "9999px");
        return;
      }

      const setX = g.quickSetter(stage, "--x", "px") as (v: number) => void;
      const setY = g.quickSetter(stage, "--y", "px") as (v: number) => void;
      const proxy = { x: 0, y: 0 };
      const moveX = g.quickTo(proxy, "x", {
        duration: 0.5,
        ease: "power3",
        onUpdate: () => setX(proxy.x),
      });
      const moveY = g.quickTo(proxy, "y", {
        duration: 0.5,
        ease: "power3",
        onUpdate: () => setY(proxy.y),
      });

      const onMove = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        moveX(e.clientX - r.left);
        moveY(e.clientY - r.top);
      };
      stage.addEventListener("pointermove", onMove);
      return () => stage.removeEventListener("pointermove", onMove);
    },
    container,
  );

  return (
    <DemoShell
      title="커서 스포트라이트"
      summary="커서를 따라 원형 라이트가 움직이며 그 부분만 드러난다 (radial-gradient 마스크 + quickTo)"
    >
      <div ref={container} className="px-6 py-16">
        <div
          className="spot-stage relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 p-8"
          style={
            {
              "--x": "50%",
              "--y": "50%",
              "--spot": "180px",
            } as React.CSSProperties
          }
        >
          <div className="grid grid-cols-3 gap-4">
            {HIDDEN_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex h-28 items-center justify-center rounded-xl text-sm font-semibold text-white"
                style={{ background: item.background }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* 어둠 오버레이: 커서 위치에 구멍이 뚫린다 */}
          <div
            className="pointer-events-none absolute inset-0 bg-neutral-950"
            style={{
              maskImage:
                "radial-gradient(circle var(--spot) at var(--x) var(--y), transparent 0%, black 100%)",
              WebkitMaskImage:
                "radial-gradient(circle var(--spot) at var(--x) var(--y), transparent 0%, black 100%)",
            }}
            aria-hidden
          />
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-white/50">
          박스 위에서 마우스를 움직여 보세요.
        </p>
      </div>
    </DemoShell>
  );
}
