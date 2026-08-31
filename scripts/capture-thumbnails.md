# 썸네일 캡처 절차

갤러리 카드용 썸네일(`public/thumbnails/{slug}.webp`, 800×450)을 다시 만드는 법.
Playwright/Puppeteer를 dev 의존성에 넣지 않기 위해 **MCP 브라우저 + 임시
API 라우트**로 캡처하고, sharp로 변환한다.

## 1. 임시 캡처 라우트 추가

`src/app/api/capture-thumb/route.ts` (커밋하지 않는다 — 캡처 후 삭제):

```ts
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const SRC_DIR = "<scratchpad>/thumb-src"; // 절대 경로로 지정

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_CAPTURE !== "1") {
    return NextResponse.json({ error: "capture disabled" }, { status: 404 });
  }
  const body = (await request.json()) as { slug: string; dataUrl: string };
  const base64 = body.dataUrl.split(",")[1];
  await mkdir(SRC_DIR, { recursive: true });
  await writeFile(join(SRC_DIR, `${body.slug}.png`), Buffer.from(base64, "base64"));
  return NextResponse.json({ ok: true });
}
```

## 2. 캡처 플래그로 dev 서버 실행

```bash
NEXT_PUBLIC_CAPTURE=1 bun run dev
```

이 플래그가 `showcase-canvas.tsx`의 `preserveDrawingBuffer: true`를 켠다 —
없으면 `canvas.toDataURL()`이 빈 이미지를 준다. 동시에 캡처 모드에서만
`gl.setClearColor(0x171717)`로 캔버스 여백을 셸 배경색과 맞춘다.

## 3. 각 씬을 열어 캡처 (MCP 브라우저)

씬 하나당 한 번의 `browser_batch`:

```
navigate → wait(5~7s, 모델 로딩 씬은 길게) → left_click_drag(회전 트리거)
  → screenshot(탭 활성화 + 최근 프레임 확정) → javascript_tool:
```

```js
const slug = location.pathname.split('/').pop();
const c = document.querySelector('canvas');
if (!c || c.width < 400) throw new Error('canvas not ready ' + (c && c.width));
const d = c.toDataURL('image/png');
await fetch('/api/capture-thumb', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ slug, dataUrl: d }),
});
```

**주의**:
- `browser_batch`에 **여러 씬을 넣지 않는다** — 이전 씬 캡처 후 navigate 하면
  프레임이 날아간다. 1 배치 = 1 씬.
- 스크롤 씬(`controlsMode: "none"`)은 `left_click_drag` 대신 `scroll`.
- 자동화 환경에서 `requestAnimationFrame` 콜백은 백그라운드 스로틀되므로
  캡처 코드에 `rAF`를 쓰지 않는다.

## 4. webp로 변환

```bash
node scripts/thumbnails-from-png.mjs
```

`<scratchpad>/thumb-src/*.png` → `public/thumbnails/{slug}.webp` (16:9 중앙 크롭,
800×450, quality 80).

## 5. 정리

- `src/app/api/capture-thumb/` 삭제
- `<scratchpad>/thumb-src/` 삭제
- `NEXT_PUBLIC_CAPTURE` 없이 dev 서버 재시작

`showcase-canvas.tsx`의 `CAPTURE_GL` 가드는 프로덕션·개발에 무영향이므로
남겨둔다 (새 쇼케이스마다 재캡처 필요).
