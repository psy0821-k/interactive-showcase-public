# 트러블슈팅

> 이 프로젝트를 배포·운영하며 실제로 부딪힌 문제와 원인·해결을 기록한다.
>
> 최종 갱신: 2026-09-01

---

## 1. 새 환경(시크릿창·다른 기기)에서 접속하면 Vercel 로그인을 요구한다

### 증상

배포된 페이지 URL을 열었더니 갤러리 대신 Vercel 로그인(SSO) 화면이 뜬다.
로컬(`bun run dev`)에서는 정상이다.

### 원인

Vercel 프로젝트 설정의 **Deployment Protection → Vercel Authentication**이
켜져 있고 값이 **`Standard Protection`**이다.

- `Standard Protection`은 **프리뷰 배포에만** 로그인을 요구한다.
  프로덕션 배포(`interactive-showcase-public.vercel.app`)는 공개다.
- 로그인을 겪었다면 접속한 URL이 **프리뷰 URL**이었기 때문이다.
  프리뷰 URL은 커밋·브랜치별로 생기며 형태가 다음과 같다:
  - `...-git-<branch>-<team>.vercel.app`
  - `...-<deployment-hash>-<team>.vercel.app`

### 확인 방법

```
Vercel 대시보드
  → 프로젝트(interactive-showcase-public)
  → Settings
  → Deployment Protection   ← 왼쪽 사이드바 별도 항목
```

- `Vercel Authentication` 토글이 켜져 있고 `Standard Protection`이면 위 동작이 정상이다.
- 프로덕션 도메인을 시크릿창에서 열어 로그인 없이 갤러리가 뜨면 문제 없음.
- `curl -sI https://interactive-showcase-public.vercel.app/` →
  `HTTP/2 200`, `x-robots-tag` 헤더 없음, 리다이렉트 없음이면 정상.

### 해결

**대부분 조치 불필요.** 프리뷰가 로그인 뒤에 있는 것은 의도된 동작이며,
미완성 배포가 검색·외부에 노출되지 않게 막아준다
(코드 레벨에서도 `src/lib/site.ts`의 `IS_INDEXABLE`이
`VERCEL_ENV !== "production"`인 배포에 `noindex`를 넣어 이중으로 차단한다).

특정 프리뷰를 로그인 없이 공유해야 할 때만:

- 해당 배포 상세 화면의 **Share** 링크(만료형 서명 URL)를 쓰거나
- `Standard Protection` 드롭다운을 `Only Preview Deployments` 등으로 조정하거나
- 자동화·CI에서 접근해야 하면 **Protection Bypass for Automation** 토큰을 발급한다.

프로덕션까지 보호가 걸려 있다면(구글봇도 로그인 화면만 보게 됨) 반드시
`Only Preview Deployments`로 낮추거나 필요 시 `Disabled`로 끈다.

### SEO 영향

- Lighthouse의 `is-crawlable` 감사는 `<meta name="robots" noindex>`와
  `X-Robots-Tag` 헤더만 검사한다. **robots.txt도, Vercel 로그인 게이트도
  검사하지 않는다.** 따라서 프로덕션이 게이트 뒤에 있어도 Lighthouse는
  통과로 표시하지만 실제로는 색인이 전혀 안 된다 — 프로덕션 도메인을
  직접 시크릿창에서 확인하는 절차가 필요하다.

---

## 2. 서버(RSC·sitemap)에서 쇼케이스 meta가 빈 값으로 나온다

### 증상

`src/showcases/registry.ts`의 `SHOWCASE_ENTRIES`를 서버 컴포넌트나
`sitemap.ts`에서 쓰면 빌드 타임에 빈 배열이다.

### 원인

`registry.ts`는 `import.meta.glob("./*/*/meta.ts", { eager: true })`로
meta를 걷는다. 이 glob은 **빌드 타임 서버 컨텍스트에서 신뢰할 수 없다**
(Turbopack). 클라이언트 번들에서는 정상 동작한다.

### 해결

서버 코드는 `src/showcases/server-registry.ts`를 쓴다.

- 디렉토리를 `node:fs`로 직접 걷어 `{category}/{slug}` 쌍을 얻고
- 각 `meta.ts`를 **동적 `import()`**로 읽는다
  (`generateMetadata`·`generateStaticParams`·`sitemap`이 모두 async라 가능).

클라이언트 캔버스 경로(`showcase-canvas.tsx`, `showcase-detail.tsx`)는
그대로 `registry.ts`를 쓴다 — 이쪽은 glob이 정상 동작한다.

---

## 3. 상세 페이지가 존재하지 않는 slug에도 200 OK를 반환한다 (소프트 404)

### 증상

`/showcase/없는-slug`가 404가 아니라 200으로 응답하고
"찾을 수 없습니다" 문구만 렌더된다. 크롤러가 쓰레기 URL을 색인한다.

### 원인

과거 `ShowcaseDetail`(클라이언트 컴포넌트)이 slug 미존재를 자체 div로
처리했고, 서버는 항상 200을 반환했다.

### 해결

`src/app/showcase/[slug]/page.tsx`(서버)에서 `findShowcaseOnServer(slug)`
결과가 없으면 `notFound()`를 호출한다 → Next가 404 상태로 `not-found.tsx`를
렌더한다. `generateStaticParams`가 유효한 38개만 프리렌더하므로 그 외
경로는 빌드 결과에 존재하지 않는다.
