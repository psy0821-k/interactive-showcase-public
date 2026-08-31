/**
 * 상세 페이지 라우트 전환 중 표시된다 (Next App Router 규약).
 *
 * page.tsx가 `params`를 await 하는 동안, 그리고 `ShowcaseDetail`(클라이언트
 * 컴포넌트)의 첫 페인트 전까지 이 스켈레톤이 보인다. 그 다음 캔버스 안
 * 로딩은 `showcase-canvas.tsx`의 `SceneLoading`이 이어받는다.
 *
 * `page.tsx`와 같은 레이아웃(제목·설명·태그·캔버스 자리)을 회색 블록으로
 * 흉내 내 전환 시 레이아웃이 튀지 않게 한다. `motion-reduce`에서 펄스를 끈다.
 */
export default function ShowcaseLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-8 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-full max-w-xl rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-7 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
        <div className="h-[60vh] w-full rounded-lg bg-neutral-200 lg:h-[70vh] dark:bg-neutral-800" />
      </div>
    </main>
  );
}
