# 배포와 검증

> 이 문서는 현재 native custom card의 실행 절차다. Phase 1 `button-card` 절차는 실행하면 안 되는 [보관 기록](docs/archive/phase-1-button-card.md)이다.

## 문서와 배포 정본

- 카드 API와 Sections 완료 조건: [HA-STANDARD.md](HA-STANDARD.md)
- 현재 dashboard 상태와 실서버 검증 이력: [PROJECT-STATUS.md](PROJECT-STATUS.md)
- 문서별 책임과 카드 계약: [docs/README.md](docs/README.md)
- 새 UI의 조사·시안·승인·서브에이전트 구현·검증·배포: [서브에이전트 UI 제작·배포 가이드](docs/SUBAGENT-HA-UI-DELIVERY-GUIDE.ko.md)
- **각 resource의 URL, ID, 구현 SHA, cache key 정본:** 아래 여덟 `dashboards/*-resource.yaml` 파일

`PROJECT-STATUS.md`의 SHA는 날짜가 있는 검증 이력일 뿐 resource pin을 대체하지 않는다.

## 현재 native custom card 배포

### 등록 resource

Home Assistant → 설정 → 대시보드 → 리소스에서 다음 여덟 module resource를 등록한다.

- `dashboards/ha-design-light-resource.yaml`
- `dashboards/ha-design-resource.yaml` — climate
- `dashboards/ha-design-curtain-resource.yaml`
- `dashboards/ha-design-cold-storage-resource.yaml`
- `dashboards/ha-design-washer-resource.yaml`
- `dashboards/ha-design-camera-resource.yaml`
- `dashboards/ha-design-air-purifier-resource.yaml`
- `dashboards/ha-design-temp-humidity-resource.yaml`

각 URL은 배포할 구현의 40자리 commit SHA와 cache-bust query에 고정한다. branch URL이나 움직이는 `main` URL을 live resource에 사용하지 않는다. 공통 compact를 공유하는 조명과 에어컨은 같은 구현 SHA를 사용한다.

같은 작업을 스크립트로 할 때는 `hass.callWS`의 `lovelace/resources`(목록), `lovelace/resources/create`(`res_type: "module"`, `url`), `lovelace/resources/update`(`resource_id`, `res_type`, `url`)를 쓴다. 기존 resource는 ID를 유지한 채 URL만 교체하고, 등록·갱신 뒤 `lovelace/resources`를 다시 읽어 새 URL과 기존 ID가 함께 남았는지 확인한다. `create`가 돌려주는 32자리 ID를 해당 `dashboards/*-resource.yaml`에 기록하는 것이 그 파일의 정본 역할이다.

### dashboard 구성

`dashboards/ha-design.yaml`과 `dashboards/ha-design-inline.yaml`은 `거실`, `안방`, `아기방`, `주방`, `다용도실` 다섯 Sections view를 정의한다. 홈 메뉴는 장소 순서가 계약이므로 view 제목·경로·순서를 임의로 바꾸지 않는다. 모든 card 인스턴스에는 `grid_options.columns`와 `grid_options.rows: auto`가 있어야 한다.

`안방`과 `아기방` view는 각각 `custom:ha-design-temp-humidity-card` 한 장을 포함한다. 안방 카드는 `columns: 6`으로 안방 온·습도 센서를, 아기방 카드는 `columns: 12`로 아기방 온·습도 센서를 연결하고 두 카드 모두 `rows: auto`를 명시한다. 온습도 카드의 설정 키·기록 조회·접근성 계약은 [방 온습도 계약](docs/contracts/temp-humidity.md)이 소유한다.

`dashboards/ha-design-*.yaml` 개별 파일은 도메인별 카드 선언과 entity 매핑 정본이고 live view를 정의하지 않는다. live view 구성은 위 두 파일만 소유한다.

대시보드 편집 → **Raw 구성 편집기**에서 `dashboards/ha-design-inline.yaml` 전체를 붙여넣는다. 선택 사항인 Warm Editorial theme은 HACS의 theme 저장소로 설치하며, native card 설치에는 `button-card`가 필요하지 않다.

live `ha_design`에 스크립트로 저장할 때는 YAML **문자열**이 아니라 파싱된 **구조(object)**를 넘긴다. `lovelace/config/save`에 문자열을 보내면 저장 자체는 되지만 frontend가 `Cannot use 'in' operator to search for 'strategy'` 오류로 대시보드를 렌더하지 못한다. `yaml.safe_load`한 객체를 `config`로 넘기고, 저장 후 `lovelace/config`로 되읽어 반환 타입이 object인지 확인한다.

### 변경·배포 순서

commit, push 또는 live HA 저장은 사용자가 명시적으로 승인한 경우에만 수행한다. 승인 전에는
코드·시안·테스트와 읽기 전용 live discovery까지만 진행한다.

1. 관련 contract/browser test를 먼저 실패시키고 최소 수정으로 통과시킨다.
2. 아래 Node suite, JavaScript syntax, 도메인 browser contract, LSP diagnostics,
   `git diff --check`를 통과시킨다.
3. 실제 HA의 기존 resource URL·ID, dashboard storage config, `grid_options`, 조작할
   기기 상태를 rollback 기준으로 기록한다.
4. 구현과 직접 테스트를 원자 commit으로 만들고 승인된 remote에 push한다.
5. 구현 commit의 40자리 SHA로 영향받은 resource YAML의 URL과 cache key만 갱신한다.
   resource ID는 유지한다.
6. CDN entry와 재귀 child module을 검증한 뒤 resource pin commit을 push한다.
7. Home Assistant → 설정 → 대시보드 → 리소스에서 **기존 resource ID를 유지한 채**
   URL을 새 full-SHA URL로 저장한다.
8. 대시보드 Raw 구성 편집기에서 기존 entity 설정을 보존한 storage config를 저장한다.
9. 실제 HA에서 visual editor, Layout resize 저장·원복, desktop/mobile overflow와
   해당 실기기 동작을 검증한다.
10. 임시 dashboard 변경과 실제 기기 상태를 원래 값으로 복원하고
    `PROJECT-STATUS.md`에 날짜가 있는 증거를 남긴다.

소스에 `getConfigForm()`이나 `getGridOptions()`가 있다는 이유만으로 실제 HA 검증을 생략하지 않는다.

### Node·syntax 검증

다음 loop는 모든 `tools/*test.mjs` Node 진입점을 실행한다. 첫 실패를 반드시 전파한다.
카메라 browser runner는 포함하지만 다른 도메인의 HTML browser contract까지 대신하지 않는다.

```sh
set -e
for test in tools/*test.mjs; do
  node "$test"
done

find www/ha-design -name '*.js' -print0 | xargs -0 -n1 node --check
git diff --check
```

`tools/camera-history-browser-test.mjs`는 실제 Chrome executable과 Playwright module이
필요하다. 기본 자동 탐색이 맞지 않으면 `CHROME_BIN`과 `PLAYWRIGHT_MODULE` 환경 변수로
각 경로를 지정한다. 이 runner는 camera 375/768/1280px과 HA/native HLS fixture를 검증한다.

### HTML browser contract와 Aside QA

조명·에어컨·커튼·냉장 기기·세탁기·방 온습도·공통 picker/stable-DOM HTML contract는 위 Node
loop가 자동 실행하지 않는다. 도메인 계약의 정확한 `tools/*-test.html` 목록을 확인하고
다음 절차로 실행한다.

| 범위 | HTML browser contract |
|---|---|
| 공통·picker·DOM | `tools/device-compact-visual-test.html`, `tools/adaptive-compact-test.html`, `tools/stable-dom-test.html`, `tools/card-picker-test.html` |
| 조명 | `tools/light-interaction-test.html` |
| 에어컨 | `tools/climate-interaction-test.html`, `tools/climate-modal-test.html` |
| 커튼 | `tools/curtain-visual-test.html` |
| 냉장 기기 | `tools/cold-storage-interaction-test.html` |
| 세탁기 | `tools/washer-interaction-test.html` |
| 방 온습도 | `tools/temp-humidity-interaction-test.html` |
| 카메라 | `tools/camera-history-browser-test.mjs`가 `tools/camera-history-browser-test.html`과 `tools/camera-interaction-test.html`을 실행 |

1. 저장소 root의 persistent terminal에서 로컬 server를 시작한다.

   ```sh
   python3 -m http.server 4173 --directory .
   ```

2. Aside에서 해당 `http://127.0.0.1:<port>/tools/<test>.html`을 연다.
3. 테스트가 제공하는 `body[data-result="pass"]` 또는 동등한 완료 signal을 기다린다.
4. 375px, 768px, 1280px에서 console/page error, 가로 overflow, focus, dialog 상태를
   확인하고 PNG를 남긴다. 임의 시간 대기나 눈대중만으로 PASS 처리하지 않는다.
5. persistent terminal server를 종료하고 임시 파일·trace를 제거한다.

카드별 필수 HTML 표면과 실제 기기 QA는 [문서 지도](docs/README.md)의 도메인 계약을 따른다.

### hero 이미지 자산 교체

카드 hero 사진을 바꾸는 절차다. 승인 없이 사진을 정해 live에 반영하지 않는다.

1. 후보를 시안 페이지로 만들어 사용자 승인을 받는다(예: `tools/temp-humidity-hero-designs.html`, `tools/temp-humidity-photo-candidates.html`).
2. 승인된 원본에서 카드 비율별로 **자른다**. 늘리지 않는다. 카드가 쓰는 폭(예: `500px`, `246px`, `164px`)에서 값 바가 피사체를 덮지 않는지 실제 카드 크기로 먼저 확인한다.
3. 자산을 `www/ha-design/images/<domain>/`에 넣고, 원본이 생성 이미지면 도구·프롬프트 요약·크롭 구간을, 실사면 출처와 라이선스를 `README.md`에 적는다.
4. 자산과 카드 구현을 함께 구현 commit으로 만들고 push한 뒤, dashboard의 hero URL을 그 SHA로, resource cache key를 새 값으로 올린다.
5. live resource URL과 dashboard config를 갱신하고, 카드 폭별로 어느 자산이 적용됐는지(`background-image` computed 값)와 구성 오류 0건을 확인한다.

### 구현 SHA와 CDN

resource에는 release commit이 아니라 **그 직전 구현 commit의 SHA**를 쓴다.

```sh
IMPLEMENTATION_SHA="$(git rev-parse HEAD)"
git rev-parse --verify "${IMPLEMENTATION_SHA}^{commit}"
```

resource URL 형식:

```text
https://cdn.jsdelivr.net/gh/jaeryun/ha-design@<40-char-implementation-sha>/www/ha-design/ha-design-<device>-card.js?v=<new-cache-key>
```

public CDN entry가 HTTP 200인지, entry가 import하는 상대 child module도 같은 SHA 경로에서
HTTP 200인지 확인한다. 실제 HA browser의 Performance resource entry에서도 entry와 child
module의 SHA·cache key를 확인한다. stale cache를 moving `main` URL로 우회하지 않는다.

### Rollback

배포 전 다음을 기록한다.

- 이전 implementation SHA와 full resource URL/cache key
- 유지할 resource ID
- dashboard raw config와 `grid_options`
- 조작할 실제 entity의 baseline state
- 상태를 원복할 service와 payload

배포가 실패하면 기존 resource ID의 URL을 이전 full-SHA URL로 되돌리고, dashboard config와
기기 상태를 baseline으로 복원한다. 이전 module의 실제 재로드와 state readback을 확인한 뒤
실패 원인·복원 여부를 `PROJECT-STATUS.md`에 기록한다. 실패한 release를 성공으로 기록하지 않는다.

### HACS 상태

현재 `hacs.json`은 `Warm Editorial` theme package 기준이다. native 카드는 표준 Lovelace module resource로 동작하지만 HACS frontend plugin 설치 패키지는 아직 등록되지 않았다.
