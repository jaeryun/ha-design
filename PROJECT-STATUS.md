# ha-design 작업 현황과 인수인계

새 세션은 이 문서를 먼저 읽고 실제 Home Assistant 상태를 다시 확인한 뒤 작업한다. 사용자별 주소·인증 정보는 저장소에 기록하지 않는다.

## 현재 배포 기준

- 브랜치: `main`
- 공통 tile·커튼 cold-load 구현 커밋: `cef9f99`
- 커튼 live-position 구현 커밋: `1afc933`
- 커튼 stop 위치 정수화 구현 커밋: `2a4564f`
- stable DOM·낙관적 온도 구현 커밋: `7b8140e`
- stable DOM resource 릴리스 커밋: `41d6ffc`
- 실제 storage 대시보드: `ha_design`
- 실제 Lovelace view:
  - `안방` (`bedroom`) — `custom:ha-design-light-card` 1개
  - `에어컨` (`climate`) — 기존 `custom:ha-design-climate-card` 2개
  - `커튼` (`curtain`) — Sections 6-column `custom:ha-design-curtain-card` 2개
- 조명 resource ID: `20d0fc1d032d47588004f43531b56c5e`
- 에어컨 resource ID: `e2e7fd13a2aa432997f35046344b5b1c`
- 조명·에어컨 resource URL: `7b8140e` 고정 + `?v=shared-compact-20260826-2`
- 커튼 resource ID: `1d1d9db267dd47c7897dae9328a9cca0`
- 커튼 resource URL: `7b8140e` 고정 + `?v=stable-dom-20260826-1`
- 대시보드 registry는 `dashboard_unknown`, `ha_design` 두 개를 유지한다.

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
