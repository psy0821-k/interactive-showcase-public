# 실측 성능

> `TECHNICAL-HIGHLIGHTS.md §3`의 성능 층위 모델이 "무엇을 줄일지"를 다룬다면,
> 이 문서는 **실제로 얼마나 빠른가**를 실브라우저 계측으로 기록한다.
>
> 최종 갱신: 2026-09-01

---

## 1. 왜 실측이 필요한가

이 프로젝트는 "성능 최적화 3층 구조"(프레임 개수 / 프레임 비용 / 초기 로드)를
전면에 내세운다. Lighthouse는 **초기 로드**(Layer 3, 번들·LCP)만 검증하고,
**3D가 실제로 도는 동안의 프레임레이트·GPU 메모리**(Layer 1·2)는 측정하지 못한다.
그 부분을 사람이 실브라우저에서 잰 값이 아래 표다.

## 2. 왜 자동화로 못 재는가

Playwright·헤드리스 Chrome 등 백그라운드 컨텍스트에서는 `requestAnimationFrame`이
브라우저에 의해 강제 스로틀(보통 1fps 수준)된다. 렌더 성능과 무관한 값이 나오므로
**포그라운드 실브라우저 + 사람의 상호작용**이 필수다.

## 3. 측정 환경

| 항목 | 값 |
|---|---|
| OS | Windows 11 Pro |
| GPU | NVIDIA GeForce RTX 3060 Laptop GPU |
| 디스플레이 | 240Hz (FPS 상한이 vsync로 240에 고정) |
| 브라우저 | Chrome 151.0.7922.174 (Stable, 64bit) |
| 빌드 | 프로덕션 (`bun run build && bun run start`) |
| 확장 프로그램 | 비활성화 |
| CPU/네트워크 스로틀 | 없음 |

## 4. 측정 방법

1. 프로덕션 서버로 대상 씬을 연다.
2. DevTools → Rendering → **Frame Rendering Stats** 오버레이를 켠다
   (Frame Rate / GPU raster / GPU memory 실시간 표시).
3. **30초** 동안 일반적인 상호작용 — 클릭 후 좌우 드래그로 궤도 회전,
   스크롤 휠로 줌.
4. 기록: 평균 FPS · 부하 시 최저 FPS · GPU memory `used` 최댓값.
5. 로드 시간은 Network 탭의 `Load` 이벤트(캐시 비움, 3회).
6. 씬마다 위를 **3회 반복**해 평균을 낸다.

## 5. 결과

| 쇼케이스 | 평균 FPS | 부하 시 최저 FPS | GPU memory (used) | Load (3회 평균) |
|---|---|---|---|---|
| `gesture-guide-viewer` | 240 (상한) | 235 | ~122 MB | ~697 ms (782 / 670 / 640) |
| `depth-of-field-rack` | 220–235 | **190** (autofocus ON) | ~122 MB | ~727 ms (732 / 692 / 756) |
| `physics-block-tower` | 240 (상한) | ~230 (탑 붕괴 중) | ~122 MB | ~691 ms (650 / 720 / 702) |

### 5-1. 읽는 법

- **평균 FPS가 240에 붙은 씬**(`gesture-guide-viewer`, `physics-block-tower`)은
  디스플레이 240Hz vsync 상한에 닿은 것이다. GPU에 여유가 크다는 의미이며,
  정확한 헤드룸은 상한 때문에 보이지 않는다.
- **`depth-of-field-rack`만 상한 아래로 떨어진다.** 후처리(DoF) 체인이
  프레임당 추가 렌더 패스를 요구하기 때문이고, 이 프로젝트에서 가장 무거운 씬이다.
- **GPU memory가 3씬 모두 ~122 MB로 거의 동일**한 것은, 공통 셸(`<Canvas>` +
  drei + 기본 조명·환경)이 베이스라인 VRAM을 지배하고 씬별 지오메트리·텍스처
  차이는 그 위에서 미미하기 때문이다.

### 5-2. autofocus의 비용 (`depth-of-field-rack`)

| 상태 | FPS |
|---|---|
| 마우스 autofocus **OFF** | 220–235 |
| 마우스 autofocus **ON** | 최저 **190** |

`depth-of-field-focus` 기법 문서가 "`focusDistance` [0,1] 범위가 직관적이지
않으니 Autofocus 훅으로 자동화"라고 안내하는데, 그 자동화는 매 프레임
raycast + DoF 파라미터 갱신을 수반한다. **편의성과 프레임레이트의 트레이드오프**가
약 40fps(235 → 190)로 계측되었다. 정적 초점으로 충분한 씬이라면 autofocus를
끄는 편이 낫다.

## 6. 온디맨드 렌더링 검증

`render-budget-meter` 씬(`meta.frameloop: "demand"`)에서:

1. Frame Rendering Stats 오버레이를 켠다.
2. 상호작용을 멈춘다.
3. **GPU raster 활동과 프레임 카운터가 0으로 떨어지는지** 확인한다.

상호작용이 없을 때 렌더 루프가 완전히 정지하면 배터리·GPU 온도 절감이 실제로
동작하는 것이다.

> 상태: _(확인 필요 — todo.md §2)_

## 7. 한계

- 단일 머신·단일 GPU 측정이다. 저사양 기기에서는 절대 수치가 다르다.
- 디스플레이 240Hz 때문에 가벼운 씬의 실제 상한 성능은 측정되지 않는다.
- 모바일 실기기 프레임레이트는 별도 (`ACCESSIBILITY.md` §3).
