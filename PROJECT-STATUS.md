# ha-design 작업 현황과 인수인계

새 세션은 이 문서를 먼저 읽고 실제 Home Assistant 상태를 다시 확인한 뒤 작업한다. 사용자별 주소·인증 정보는 저장소에 기록하지 않는다.

## 현재 배포 기준

- 브랜치: `main`
- 공통 tile·커튼 cold-load 구현 커밋: `cef9f99`
- 커튼 live-position 구현 커밋: `1afc933`
- 커튼 stop 위치 정수화 구현 커밋: `2a4564f`
- stable DOM·낙관적 온도 구현 커밋: `7b8140e`
- stable DOM resource 릴리스 커밋: `41d6ffc`
- 상세 모달 웜 잉크 구현 커밋: `38515f4`
- 상세 모달 웜 잉크 resource 릴리스 커밋: `2900200`
- 커튼·wide 카드 동일 높이 구현 커밋: `7411981`
- 동일 높이 resource 릴리스 커밋: `a018d80`
- HA 표준 picker/editor 구현 커밋: `c43f8a9`
- HA 표준 picker/editor resource 릴리스 커밋: `134cbe4`
- adaptive compact 구현 커밋: `e6cb9de`
- adaptive compact resource 릴리스 커밋: `71d587d`
- 냉장 기기 구현 커밋: `5a4ae86`
- 냉장 기기 resource 릴리스 커밋: `ead959a`
- 냉장 기기 실사 히어로 구현 커밋: `1df15ac`
- 냉장 기기 정확한 모델 히어로 커밋: `41d93f0`
- 냉장 기기 승인 Warm Studio 히어로 커밋: `6a11bce`
- 냉장 기기 Warm Studio 246px 라벨 수정 커밋: `b3cc586`
- 실제 storage 대시보드: `ha_design`
- 실제 Lovelace view:
  - `안방` (`bedroom`) — Masonry, `custom:ha-design-light-card` 1개
  - `에어컨` (`climate`) — 기존 `custom:ha-design-climate-card` 2개. view type은 변경 작업 전에 실서버에서 다시 확인한다.
  - `커튼` (`curtain`) — Sections adaptive 4~12-column `custom:ha-design-curtain-card` 2개
  - `냉장 기기` (`cold-storage`) — Sections `custom:ha-design-cold-storage-card` 2개
- 조명 resource ID: `20d0fc1d032d47588004f43531b56c5e`
- 에어컨 resource ID: `e2e7fd13a2aa432997f35046344b5b1c`
- 조명·에어컨 resource URL: `e6cb9de` 고정 + `?v=shared-compact-20260827-4`
- 커튼 resource ID: `1d1d9db267dd47c7897dae9328a9cca0`
- 커튼 resource URL: `e6cb9de` 고정 + `?v=adaptive-compact-20260827-1`
- 냉장 기기 resource ID: `1097ad778a04434d8a037356d76d1af2`
- 냉장 기기 resource URL: `b3cc586` 고정 + `?v=cold-storage-warm-studio-20260829-2`
- 대시보드 registry는 `dashboard_unknown`, `ha_design` 두 개를 유지한다.

### 다음 세션의 view 작업 주의사항

- 사용자는 Masonry와 Sections의 차이를 확인했으며, view 이전은 이번 세션에서 하지 않고 보류했다.
- 카드별 4~12 columns resize는 Sections view에서만 작동한다. Masonry에서 `grid_options.columns`가 무시되는 현상을 custom card 결함으로 진단하지 않는다.
- 추후 `안방`이나 `에어컨`을 Sections로 옮길 때는 먼저 실제 view type과 storage config를 다시 읽고, 기존 카드·entity 설정을 보존한 채 layout만 이전한다.
- 이전 전후 카드 배치와 `164px` 높이를 실서버에서 비교하고, 임시 `grid_options`가 storage config에 남지 않도록 원복 감사한다.

## 완료된 안방 조명 UI

### 실제 기기 계약

- 엔티티: `light.anbang_anbang_jomyeong`
- 통합: SmartThings
- 지원 기능:
  - 전원
  - 밝기
  - 색온도 `2000–9000K`
  - HS 색상
  - transition
- 미지원 기능: effect, flash
- 이름이 비슷한 `light.geosil_anbang_jomyeong`은 대상이 아니며 변경하지 않는다.

### 사용자 표면

- compact 카드:
  - 에어컨·조명 모두 공통 `492×164px` 사진 중심 문법
  - 공통 `154px` hero + 내용 없는 `10px` 흰 strip
  - `안방 조명` 제목·상태 문장·상태 badge를 사진 위에 표시
  - compact 제어는 두지 않고 카드 전체 클릭으로 상세 모달을 연다.
- 중앙 상세 모달:
  - 전원
  - 밝기
  - 색온도
  - HS 컬러 프리셋
- OFF에서는 미확정 밝기·색온도를 `—`로 표시하고 조절 불가 이유를 ARIA로 연결한다.
- 상태 갱신으로 모달 DOM이 다시 렌더되어도 열린 상태와 현재 초점을 복원한다.
- Lighting gold `#8A641F`는 흰 배경에서 `5.35:1` 대비를 확보한다.
- iPhone WebKit 모듈 캐시를 피하도록 본체와 하위 모듈 모두 버전 URL을 사용한다.

### 코드와 배포 파일

- `www/ha-design/ha-design-device-compact.js` — 공통 높이·DOM·CSS·escape·키보드 계약
- `www/ha-design/ha-design-light-card.js` — HA 상태·서비스·초점 수명주기
- `www/ha-design/ha-design-light-card.template.js` — 의미 구조·ARIA
- `www/ha-design/ha-design-light-card.styles.js` — warm-editorial 표현·반응형
- `dashboards/ha-design.yaml` — 현재 전체 대시보드 예시
- `dashboards/ha-design-inline.yaml` — Raw 구성 편집기용
- `dashboards/ha-design-light-resource.yaml` — 실제 resource ID/URL 계약
- `tools/light-deployment-test.mjs` — 배포·접근성 계약
- `tools/light-interaction-test.html` — mock HA 브라우저 상호작용
- `tools/device-compact-contract-test.mjs` — 양쪽 공통 기반·동일 SHA 계약
- `tools/device-compact-visual-test.html` — 양쪽 실제 DOM 높이 계약

## 완료된 커튼 tile UI

- 실제 엔티티:
  - `cover.geosilkeoteun`
  - `cover.anbangkeoteun`
- 두 엔티티 모두 `device_class: curtain`, `supported_features: 15`
  - 열기
  - 닫기
  - 위치 지정 `0–100%`
  - 정지
- 목록:
  - 공통 `Compact Device Tile` renderer 사용
  - iPhone `393px` 실제 HA iframe에서 2열 유지
  - square hero + 공통 white tail `10px`
- 상세 모달:
  - native range 위치 조절
  - 이동 중 output·range·hero aperture를 매 frame 같은 보간 위치로 갱신
  - stop 직후 추정 위치를 정수로 고정해 HA 재렌더에서도 소수 전체가 노출되지 않음
  - 거실 `8.8초`, 안방 `7.4초` travel duration을 사용하고 HA 중간 위치가 오면 즉시 실제 값으로 재동기화
  - `열기`, `정지`, `닫기` 최소 `44px` 제어
  - click·Enter·Space·Escape 및 launcher 초점 복귀
  - HA 상태 재렌더 중 dialog 이름·초점·modal 상태 유지
- 실기기 QA:
  - 거실 커튼 `0% → 10%` 위치 지정 확인
  - `open_cover`로 `100%` 확인
  - `stop_cover` 서비스 이벤트 확인
  - 실제 event cadence는 완전 이동 시 시작·끝만 제공하고, 정지 시 실제 중간 위치를 추가 제공함
  - 거실 3초 이동 후 정지에서 HA가 `36%`를 보고해 보간값을 authoritative 값으로 교체하는 계약 확인
  - stop 정수화 배포 후 열림 중 `39.617… → 40% → 실제 41%`, 닫힘 중 `25.452… → 25% → 실제 26%` 확인
  - 두 stop 경로 모두 HA 재렌더를 포함해 화면에는 `0–100%` 정수만 노출됨
  - `close_cover`로 원래 `closed / 0%` 복구
  - 안방 커튼은 원래 `closed / 0%` 유지

## 검증된 증거

### 2026-08-27 냉장 기기 실서버 배포

- 실제 `ha_design`에 `냉장 기기` (`cold-storage`) Sections view를 추가했다.
- 냉장고는 냉장실 `4°C`, 냉동실 `-19°C`, 냉장·냉동·맞춤 보관실 문 상태와 급속냉장 switch를 실제 SmartThings 엔티티에 연결했다.
- 김치냉장고는 SmartThings가 실제 노출하는 문 상태, 현재 전력 `1W`, 누적 에너지 `116.1kWh`만 표시하고 가짜 온도·보관 모드는 렌더링하지 않는다.
- 실제 HA에서 두 compact 카드가 각각 `246×164px`, 구성 오류 0개로 렌더링되고 두 상세 모달의 실제 상태값과 닫기 동작을 확인했다.
- 급속냉장 switch는 현재 `off`를 표시했으며 실제 기기 상태를 바꾸는 서비스 호출은 하지 않았다.
- 배포 모듈의 375px 브라우저 회귀에서 `PASS`, 문서 `scrollWidth=375`로 가로 넘침이 없음을 확인했다.
- 실기기 재조사에서 냉장고 모델 `RF60DB9KF201`, 김치냉장고 내부 식별자 `TP1X_REF_21K`·2021년형·상중하 3칸 구조를 확인했다.
- 냉장고는 해당 모델의 삼성 공식 제품 컷, 김치냉장고는 동일 비스포크 김치플러스 외형 계열의 삼성 공식 주방 실사 이미지로 CSS 제품 모형을 대체했다.
- 사용자 확인 모델은 코타화이트 `RF60DB9KF201` 냉장고와 `RQ33DB74D2AP` 3도어 김치냉장고다. 여러 웹 시안과 데스크톱·375px 검수를 거쳐 사용자가 A안 `Warm Studio`를 승인했으며, 두 공식 정면 제품 컷을 차콜·토프·아이보리 스튜디오 배경에서 텍스트와 분리해 배치한다.

### 2026-08-27 adaptive compact 실서버 배포

- explicit `compact_variant`와 wide/tile 분기를 production 코드·설정 폼·dashboard YAML·실제 storage config에서 제거했다.
- 모든 compact 카드는 hero `154px` + tail `10px`로 전체 높이 `164px`를 유지하고, host 폭 `280px` 이하에서 narrow 상태 1개로 자동 전환한다.
- HA `getGridOptions()`는 조명·에어컨 기본 `12`, 커튼 기본 `4`, 공통 `min_columns: 4 / max_columns: 12`다.
- 실제 Sections curtain view에서 거실 커튼을 columns `4 → 8 → 12`로 변경해 폭 `161 → 331 → 500px`, 높이 `164 → 164 → 164px`를 확인하고 기본 4 columns로 복원했다.
- 실제 기본 배치는 조명 `492×164px`, 에어컨 2장 `492×164px`, 커튼 2장 `161×164px`, 구성 오류 0개다.
- `grid_options.columns`는 HA 표준대로 Sections view에서 작동하며, Masonry view에서는 HA가 무시한다.
- resize 전후 동일 compact launcher DOM을 유지해 modal·focus·scroll state를 보존한다.
- 실제 기기 서비스는 호출하지 않았고 최종 상태는 조명 `off`, 거실 에어컨 `off`, 두 커튼 `closed / 0%`다.
- `tools/adaptive-compact-test.html` RED→GREEN, 전체 Node/browser 계약, 로컬·실서버 3폭 visual QA가 모두 PASS다.

### 2026-08-27 HA 표준 card picker/editor 실서버 배포

- 세 카드에 HA 내장 `getConfigForm()`, `getStubConfig(hass, entities, entitiesFallback)`, `getEntitySuggestion()` 계약을 구현했다.
- `카드별` 검색에서 `조명`, `에어컨`, `커튼` 각각의 한국어 이름으로 해당 ha-design 카드가 검색됨을 확인했다.
- 실제 entity 추천과 stub은 `light.anbang_anbang_jomyeong`, `climate.geosil_eeokeon`, `cover.geosilkeoteun`을 선택하고 호환되지 않는 entity는 `null`을 반환했다.
- 실제 HA native visual editor에서 세 카드 모두 domain/device class로 제한된 entity selector, 카드 제목·이미지·형태 설정과 live preview를 확인했다.
- climate 고급 필드는 native `.element-editor.ha-scrollbar`의 `691/1076px` 스크롤 영역에서 마지막 필터 센서와 저장 버튼까지 접근 가능함을 확인했다.
- production 카드 모듈에는 구체적인 entity ID가 없고, dashboard YAML만 현재 인스턴스의 entity를 지정한다.
- 기존 live dashboard는 조명 `492×164px`, 에어컨 2장 `492×164px`, 커튼 2장 `164×164px`, 구성 오류 0개를 유지했다.
- 실제 기기 상태는 조명 `off`, 에어컨 목표 `24.5°C`, 두 커튼 `closed / 0%`로 유지됐다.
- `tools/card-picker-test.html` RED→GREEN, 모든 Node/browser 회귀, 독립 visual QA 2회가 PASS다.

### 2026-08-27 compact 카드 동일 높이 실서버 배포

- 변경 전 실제 HA 실측은 climate wide `492×164px`, curtain tile `246×256px`였다.
- 커튼 tile을 기존 6-column cell 안에 가운데 정렬한 `164×164px` 정사각 카드로 고정했다.
- 커튼 hero `154px`와 공통 흰 tail `10px`를 사용해 wide 카드와 같은 전체 높이 `164px`를 만족한다.
- 실제 HA 재실측에서 climate 두 장은 각각 `492×164px`, curtain 두 장은 각각 `164×164px`로 확인됐다.
- 세 resource ID를 유지하고 구현 SHA `7411981`로 갱신했다.
- curtain equal-height browser RED→GREEN, curtain card/deployment/motion, shared compact, climate/light 계약과 stable DOM browser 회귀가 모두 PASS다.

### 2026-08-27 상세 모달 웜 잉크 실서버 배포

- HA dark-theme dialog에서 바닐라 패널의 `희망 온도`와 목표값이 흰색으로 상속되는 문제를 재현했다.
- `.details-dialog`에 `var(--text-primary)`를 명시해 상세 모달의 기본 글자색을 웜 잉크 `rgb(26, 26, 24)`로 고정했다.
- 실제 HA resource ID는 유지하고 조명·에어컨을 구현 SHA `38515f4`와 `?v=shared-compact-20260827-1`로 갱신했다.
- 실제 `ha_design` climate view에서 `희망 온도`와 `24.5°C`의 계산 색상이 모두 `rgb(26, 26, 24)`임을 확인했다.
- 실제 온도 `24.5 → 25.0 → 24.5°C` 왕복 입력과 HA `state_changed`를 확인하고 원래 목표값과 scrollTop `205`를 복원했다.
- `tools/climate-modal-test.html` dark-theme 계약의 RED→GREEN, climate interaction, stable DOM, deployment 계약이 모두 PASS다.

### 2026-08-26 stable DOM 실서버 배포

- 실제 HA resource ID 3개를 유지한 채 모두 구현 SHA `7b8140e`로 갱신했다.
- 실제 브라우저 performance resource entry에서 조명·에어컨·커튼 본체와 공통 compact 하위 모듈이 모두 `7b8140e`에서 로드됨을 확인했다.
- 거실 에어컨 희망 온도 `23.0°C`에서 `+`를 3회 연속 입력:
  - 서버 확인 전 즉시 `24.5°C` 표시
  - 모달 scrollTop `205 → 205 → 205` 유지
  - HA `state_changed`로 `24.5°C` 확인
- `-`를 3회 연속 입력해 즉시 `23.0°C`로 복구하고 HA 서버 상태까지 `23.0°C`로 확인했다.
- 실제 커튼 view에서 두 카드와 거실 상세 모달·위치 `0%`를 확인했으며, 커튼 이동 서비스는 호출하지 않았다.
- `tools/climate-interaction-test.html`과 `tools/stable-dom-test.html`의 RED→GREEN 및 관련 Node/browser 계약이 모두 PASS다.

- `node tools/device-compact-contract-test.mjs` → PASS
- `node tools/light-deployment-test.mjs` → PASS
- `node tools/climate-deployment-test.mjs` → PASS
- `node tools/curtain-motion-test.mjs` → PASS
- 모든 새 JavaScript 모듈 `node --check` → PASS
- Chromium 1440×900 상호작용 표면 → PASS
- Playwright WebKit `iPhone 15` 393 CSS px 표면 → PASS
- 실제 HA desktop:
  - 조명 1개·에어컨 2개 모두 compact `492×164px`, hero `154px`, tail `10px`
  - compact 내부 제어 0개, 카드 전체 클릭, OFF/ON 모달 렌더 확인
  - `구성 오류` 없음
  - 전원 ON/OFF `state_changed`와 실제 `aria-checked` DOM 동기화 확인
  - 모달 전원 hit area `44px`, `aria-expanded`, 초기·재렌더 close focus 확인
- 실제 기기 최종 상태: `off`, brightness/color temperature/HS `null`
- 기존 climate view와 다른 dashboard는 변경되지 않았다.

## 다음 세션 시작 절차

1. `git status --short --branch`와 `git rev-parse HEAD` 확인
2. 실제 light resource ID/URL과 `ha_design` 두 view 확인
3. `light.anbang_anbang_jomyeong` 상태를 조작 전에 저장
4. 아래 검증 명령을 먼저 실행
5. 새 모듈 배포 시 구현 커밋을 먼저 push하고, 40자리 SHA와 새 cache-bust query로 resource를 갱신
6. 실제 UI QA 후 원래 기기 상태 복원

```sh
node tools/light-deployment-test.mjs
node tools/climate-deployment-test.mjs
node tools/device-compact-contract-test.mjs
node --check www/ha-design/ha-design-device-compact.js
node --check www/ha-design/ha-design-light-card.js
node --check www/ha-design/ha-design-light-card.template.js
node --check www/ha-design/ha-design-light-card.styles.js
git diff --check
```

## 보호 규칙

- `ha_design` 밖의 dashboard를 변경하지 않는다.
- `climate` view를 조명 작업 중 수정하지 않는다.
- live 서비스 호출 전 정확한 엔티티 상태를 저장하고 완료 시 복원한다.
- source URL은 commit SHA에 고정하고 iOS cache-bust query를 매 배포마다 올린다.
- 디버그 파일과 스크린샷은 저장소에 남기지 않는다.

## 남은 부채

- 실제 SmartThings 응답 지연은 외부 왕복에 의존하며 별도 로딩 스피너 없이 다음 HA 상태 갱신으로 확정한다.
- 기존 `www/ha-design/templates.yaml`과 조명 ON/OFF SVG 두 장은 Phase 1 호환 자료로 남아 있지만 현재 live card는 button-card를 사용하지 않는다.
