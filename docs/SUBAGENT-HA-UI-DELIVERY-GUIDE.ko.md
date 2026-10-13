# 비용 효율적인 하위 에이전트 기반 Home Assistant UI 제작·배포 가이드

이 문서는 `ha-design`의 native custom card를 새로 만들거나 변경할 때 적용한다. 목표는 중복 조사와 승인 전 구현을 피하면서, 실제 Home Assistant·실기기·배포 resource까지 검증 가능한 변경만 남기는 것이다.

## 1. 기준 문서와 현재 배포 표면

작업 전 아래 문서를 읽는다.

- [프로젝트 개요](../README.md)
- [디자인 시스템](../DESIGN.md)
- [HA 표준 custom card 계약](../HA-STANDARD.md)
- [배포 및 테스트 절차](../DEPLOYMENT.md)
- [현재 배포 상태와 인수인계](../PROJECT-STATUS.md)
- [문서 지도와 카드별 계약](README.md)

판단의 권위 원천은 다음 순서다.

| 판단 대상 | 권위 원천 |
|---|---|
| 실제 지원 기능, state, service, canonical entity ID | live Home Assistant Developer Tools/API/entity registry |
| 시각, 카피, 접근성, 레이아웃 | `DESIGN.md`와 승인된 카드 계약 |
| custom card API, picker/editor, Sections resize | `HA-STANDARD.md` |
| resource pin, HA GUI 저장, CDN, rollback | `DEPLOYMENT.md` |
| 현재 resource ID/URL, 구현 SHA, cache key | 해당 `dashboards/*-resource.yaml` |
| 과거 QA 증거, provisional 상태, 날짜별 배포 이력 | `PROJECT-STATUS.md` |
| 현재 dashboard entity mapping | `dashboards/ha-design.yaml`, `dashboards/ha-design-inline.yaml` |
| 회귀 규칙 | `tools/*test.mjs`, 관련 browser contract |

현재 native dashboard는 장소 다섯 Sections view와 여덟 Lovelace module resource를 사용한다. 홈 메뉴 순서는 `거실` → `안방` → `아기방` → `주방` → `다용도실`이고 `전체` 요약 view는 없다.

| 장소 view | 배치 카드 | Resource 파일 |
|---|---|---|
| `living-room` (거실) | `ha-design-climate-card`, `ha-design-curtain-card`, `ha-design-air-purifier-card`, `ha-design-camera-card` | `ha-design-resource.yaml`, `ha-design-curtain-resource.yaml`, `ha-design-air-purifier-resource.yaml`, `ha-design-camera-resource.yaml` |
| `bedroom` (안방) | `ha-design-light-card`, `ha-design-climate-card`, `ha-design-curtain-card`, `ha-design-temp-humidity-card` | `ha-design-light-resource.yaml`, `ha-design-resource.yaml`, `ha-design-curtain-resource.yaml`, `ha-design-temp-humidity-resource.yaml` |
| `baby-room` (아기방) | `ha-design-camera-card`, `ha-design-temp-humidity-card` | `ha-design-camera-resource.yaml`, `ha-design-temp-humidity-resource.yaml` |
| `kitchen` (주방) | `ha-design-cold-storage-card` | `ha-design-cold-storage-resource.yaml` |
| `utility-room` (다용도실) | `ha-design-washer-card` | `ha-design-washer-resource.yaml` |

전체 dashboard의 기준은 `dashboards/ha-design.yaml`과 `dashboards/ha-design-inline.yaml`이다. 개별 `dashboards/ha-design-*.yaml`은 live view를 정의하지 않고 도메인별 카드 선언과 entity coverage를 소유하므로, 전체 YAML을 조각 파일로 덮어쓰지 않는다.

## 2. 시작 조건과 비용 통제

### 2.1 시작 확인

```sh
git status --short --branch
git rev-parse HEAD
git diff --check
git log --oneline -15
```

다른 작업의 변경 또는 untracked prototype이 있으면 파일·소유자·목적을 먼저 기록한다. 다른 작업의 파일을 삭제, format, stage, commit하지 않는다.

### 2.2 하위 에이전트 운영 원칙

- discovery는 읽기 전용으로 한 번만 수행하고 결과 artifact를 후속 작업의 입력으로 쓴다.
- 같은 entity 조사, 레퍼런스 조사, visual QA를 두 에이전트에게 중복 배정하지 않는다.
- 승인 전 시안은 `tools/<device>-variants.html`에만 둔다. production module, dashboard, resource에는 넣지 않는다.
- 구현은 사용자가 명시 승인한 한 방향만 만든다. A/B/C를 production code로 각각 만들지 않는다.
- 기존 fixture와 contract test를 확장한다. 새 mock framework나 별도 app을 만들지 않는다.
- 공통 primitive 변경은 기기 작업과 분리한다. 예를 들어 `ha-design-device-compact.js` 변경은 해당 primitive의 소유 작업으로 처리한다.
- reviewer는 읽기 전용이다. 검토자가 직접 수정하면 독립 검토가 아니게 된다.

### 2.3 파일 소유권

| 역할 | 소유 범위 | 금지 |
|---|---|---|
| Discovery | 전달 artifact만 | card, dashboard, resource 수정 |
| Reference/variant | `tools/<device>-variants.html`, 조사 메모 | production module 수정 |
| Design contract | 해당 계약 문서와 `DESIGN.md`의 승인 구간 | 구현 파일 수정 |
| Card implementer | `www/ha-design/ha-design-<device>*`, 관련 test | dashboard/resource 수정 |
| Shared primitive implementer | 공통 module과 해당 contract/visual test | 특정 기기 기능 추가 |
| Dashboard/release owner | `dashboards/*.yaml`, 상태 기록 | card 동작 변경 |
| Independent visual reviewer | 읽기·캡처·보고 | 모든 파일 수정 |
| Gate reviewer | 최종 읽기·실행·판정 | 모든 파일 수정 |

한 파일은 한 시점에 한 명만 소유한다. 공통 module과 기기 module을 모두 바꿔야 하면 공통 primitive 작업을 먼저 끝내고, 기기 작업은 그 결과를 기준으로 시작한다.

## 3. live entity·API discovery

UI는 entity ID, capability, `unknown`, `unavailable`, `0`의 의미를 추측하지 않는다. 실제 HA Developer Tools와 authenticated API/WebSocket에서 다음을 수집한다. 주소, access token, 인증 header, raw 응답은 저장소·문서·스크린샷에 기록하지 않는다.

1. 대상 device/config entry의 entity registry: `entity_id`, `unique_id`, `platform`, `config_entry_id`, disabled 상태.
2. 현재 state와 attributes: `supported_features`, `supported_color_modes`, `hvac_modes`, `options`, `min`, `max`, `step`, unit.
3. 실제 HA service schema와 호출할 domain/service/data.
4. history와 최근 event: 영구 `unknown`, 아직 발생하지 않은 event, 실제 `0` 측정값을 구분할 근거.
5. camera라면 HA camera entity, 실제 go2rtc `stream_name`, Frigate recording API/MQTT 동기화 상태를 각각 확인.
6. integration 재등록 또는 rename 이력이 있으면 canonical ID와 `_2` 등 중복 ID를 모두 기록.

실기기 서비스 QA는 클릭 전에 정확한 WebSocket `state_changed` 구독 또는 기대 state 조건을 등록한다. 서비스 호출 뒤 임의 `sleep`, polling delay, 눈대중만으로 성공을 선언하지 않는다.

### Discovery 전달 템플릿

```md
## <device> discovery — YYYY-MM-DD

| UI 기능 | entity ID | domain/service | capability evidence | 안전 조건 |
|---|---|---|---|---|
| 예: 위치 지정 | `cover.example` | `cover.set_cover_position` | `supported_features` 확인 | `unknown/unavailable`이면 비활성 |

- canonical entity ID:
- 제외할 유사/legacy ID:
- `unknown`/`unavailable`/`0`의 실제 의미:
- baseline state/attributes:
- 복원 방법:
- discovery 시각과 HA timezone:
```

## 4. 레퍼런스 조사, HTML 시안, 사용자 승인

### 4.1 조사 범위

- `DESIGN-ANALYSIS.md`와 `reference-images/img_00.jpg`~`img_14.jpg`에서 hierarchy, 상태 문장, hero, row grammar를 추출한다.
- 제품 hero는 discovery에서 실제 모델을 확정한 뒤 제조사 공식 이미지·라이선스·사용 URL을 기록한다.
- 외부 레퍼런스는 정보 구조와 interaction 원리만 참고한다. 승인되지 않은 타 제품 사진, CSS 모형, 레퍼런스 화면 복제는 production hero로 쓰지 않는다.
- 기존 `tools/cold-storage-hero-variants.html`, `tools/washer-hero-variants.html`, `tools/camera-time-history-variants.html`의 비교 표면을 우선 재사용한다.

### 4.2 HTML variant 규칙

새 방향은 `tools/<device>-variants.html`에 A/B/C로만 만든다.

- 실제 candidate state와 capability fixture를 사용한다.
- 375px, 768px, 1280px에서 렌더한다.
- compact launcher와 detail modal을 모두 포함한다.
- `DESIGN.md`의 cream canvas, 24px radius, 4px spacing, domain accent, 한글 14px 이상, 44x44px target, reduced-motion을 지킨다.
- 지원하지 않는 control, 가짜 telemetry, 낙관적 완료 state를 표현하지 않는다.
- rendered variant는 **사용자의 명시 승인 전** production code, dashboard, resource 또는 배포에 사용하지 않는다.

### 4.3 사용자 승인 게이트

사용자에게 다음 artifact와 함께 구현 승인을 요청한다. “좋다”, “진행”처럼 모호한 반응은 production 승인으로 해석하지 않는다.

```md
## <device> 방향 승인 요청

- 후보: A / B / C
- 각 후보의 한 줄 차이:
- 공통 실제 capability:
- 제외한 capability와 근거:
- 375/768/1280 캡처:
- 추천: <A|B|C>, 이유:
- 승인 시 production에 고정할 내용:
  - hero 방향:
  - compact 상태 문장:
  - detail 정보 순서:
  - 허용 서비스:
  - 명시적으로 만들지 않을 control:
```

승인 기록은 “A안 승인”으로 끝내지 않는다. hero, 정보 순서, service boundary, 제외 기능을 함께 기록한다.

## 5. DESIGN·HA 계약

승인 후 구현 전에 해당 card 계약을 추가 또는 갱신한다.

```md
### <Device> Card

- Brief:
- 실제 entity/capability source:
- Compact: hero, eyebrow, title, badge, 상태 문장, grid columns, height.
- Detail modal: 정보 순서와 각 control의 권위 state.
- Service mapping: domain/service/data, 호출 시점.
- Capability gate: 어떤 attributes/state에서 숨김·비활성화하는가.
- Unknown/unavailable/idle 의미:
- Accessibility: focus order, dialog label, launcher restoration, 44x44 target, aria state.
- Responsive: 375/768/1280, modal scroll owner, overflow 금지.
- Motion: duration/reduced-motion.
- Explicitly excluded:
- Regression gates:
```

Compact device card는 `ha-design-device-compact.js`가 소유하는 `154px` hero + `10px` white tail + 전체 `164px` 계약을 기기 파일에서 중복 정의하지 않는다. 목록의 전체 카드는 단일 dialog launcher이며, 기기별 즉시 control을 목록에 추가하지 않는다.

새 card와 변경 card는 `HA-STANDARD.md`의 `setConfig`, `hass`, `getCardSize`, `getGridOptions`, `getConfigForm`, `getStubConfig`, `window.customCards` 계약을 유지한다. multi-entity card도 visual editor 미지원으로 처리하지 않고 실제 form field를 제공한다.

## 6. TDD와 구현

### 6.1 RED → GREEN

1. discovery와 승인 계약에서 나온 machine-consumed behavior 하나를 test로 작성한다.
2. 기존 구현이 그 test를 실패하는지 확인한다.
3. 가장 작은 구현으로 통과시킨다.
4. 관련 회귀를 한 번 실행한다.
5. 다음 behavior로 이동한다.

순수 prose나 카피만 바뀐 경우에는 test를 추가하지 않는다. test는 문구가 아니라 service payload, parsed field, DOM contract, capability gate, focus, overflow, canonical resource URL을 검증한다.

async test는 action 전에 정확한 event/state subscription을 설치하고 bounded timeout으로 기다린다. fixed sleep, polling delay, wait-for-time 패턴은 사용하지 않는다.

### 6.2 canonical test suite

canonical suite는 모든 `tools/*test.mjs`를 Node로 실행하는 것이다.

```sh
set -e
for test in tools/*test.mjs; do node "$test"; done
find www/ha-design -name '*.js' -print0 | xargs -0 -n1 node --check
git diff --check
```

변경 범위에 따라 해당 browser contract도 실행한다.

| 변경 | 우선 실행 |
|---|---|
| 공통 compact | `tools/device-compact-contract-test.mjs`, `tools/device-compact-visual-test.html`, `tools/adaptive-compact-test.html` |
| 조명 | `tools/light-deployment-test.mjs`, `tools/light-interaction-test.html` |
| 에어컨 | `tools/climate-deployment-test.mjs`, `tools/climate-interaction-test.html`, `tools/climate-modal-test.html`, `tools/stable-dom-test.html` |
| 커튼 | `tools/curtain-card-test.mjs`, `tools/curtain-motion-test.mjs`, `tools/curtain-deployment-test.mjs`, `tools/curtain-visual-test.html` |
| 냉장 기기 | `tools/cold-storage-contract-test.mjs`, `tools/cold-storage-interaction-test.html` |
| 세탁기 | `tools/washer-deployment-test.mjs`, `tools/washer-state-test.mjs`, `tools/washer-interaction-test.html` |
| 방 온습도 | `tools/temp-humidity-card-test.mjs`, `tools/temp-humidity-deployment-test.mjs`, `tools/temp-humidity-interaction-test.html` |
| picker/editor/Sections | `tools/card-picker-test.html`, `tools/sections-resize-contract-test.mjs` |
| camera | `tools/camera-deployment-test.mjs`, `tools/camera-events-test.mjs`, `tools/camera-ptz-test.mjs`, `tools/camera-recording-player-test.mjs`, `tools/camera-native-fullscreen-test.mjs`, `tools/camera-history-browser-test.mjs` |
| dashboard entity mapping | `tools/non-light-feature-coverage-test.mjs` |

browser automation은 Aside를 사용한다. Aside run은 대상 test의 완료 signal, console/page error, 지정 viewport, 캡처 경로를 artifact로 남긴다. 기존 `camera-history-browser-test.mjs`는 375/768/1280px timeline 계약의 Node regression이며, Aside visual/browser QA를 대체하지 않는다.

## 7. 브라우저·실 HA·실기기 QA

### 7.1 Aside browser QA matrix

Aside로 375px, 768px, 1280px을 각각 검증한다.

| 폭 | 반드시 확인할 것 |
|---:|---|
| 375 | document/dialog horizontal overflow 0, CJK 줄바꿈, 44px target, modal 자체 scroll |
| 768 | intermediate grid width, 상태 밀도 전환, card DOM·focus 유지 |
| 1280 | desktop grid, long state/copy, dialog max width, visual hierarchy |

각 폭에서 compact launcher, keyboard Enter/Space, Escape, backdrop/close, focus restoration, unavailable/unknown state, 실제 지원 control만 렌더되는지를 확인한다. console/page error가 0인지와 완료 signal을 함께 기록한다.

### 7.2 live HA와 실기기 QA

1. 변경 전 대상 entity의 state/attributes와 dashboard storage 설정을 기록한다.
2. 실제 HA에서 resource와 dashboard를 저장한 뒤 native visual editor를 연다.
3. `비주얼 편집기가 지원되지 않습니다` 문구가 없어야 하며 selector, 현재 config, live preview를 확인한다.
4. Sections Layout에서 columns 변경 → 저장 → 실제 폭 확인 → 원래 columns 복원의 순서로 검사한다.
5. 실기기 service는 안전한 happy path와 disabled/unknown path만 수행한다.
6. 미리 등록한 `state_changed` 또는 정확한 state 조건으로 결과를 확인한다. optimistic UI 표시는 성공 증거가 아니다.
7. 실제 기기 상태와 임시 grid columns, dashboard config를 원래 값으로 복원한다.

camera는 live video, recording coverage, 실제 Frigate/HA API 응답, canonical camera entity, native HLS 여부를 별도 검증한다. recording coverage 확인과 media playback 성공은 별도 상태다.

### 7.3 검토 순서

1. manual/Aside QA가 끝난 뒤 independent visual reviewer가 승인 variant와 production 화면을 375/768/1280에서 비교한다. reviewer는 token, hero/tail geometry, 한글 hierarchy, dialog scroll ownership, overflow, 실제 state 일치를 판정한다.
2. visual review의 blocker를 수정하고 관련 test를 다시 실행한다.
3. 그 뒤 **한 명의 gate reviewer**가 review-work를 수행한다. gate reviewer는 discovery artifact, capability/service mapping, canonical ID, test 결과, CDN pin, HA 저장·복원 증거를 읽고 release 가능/불가를 단일 판정으로 남긴다.

visual review와 gate review는 구현자가 겸하지 않는다. blocker가 남아 있으면 배포하지 않는다.

## 8. release handoff와 배포 오케스트레이션

실행 가능한 commit, implementation-SHA pin, CDN 확인, HA resource/dashboard 저장과 rollback
명령은 [DEPLOYMENT.md](../DEPLOYMENT.md) 한 곳에서만 관리한다. 이 가이드는 해당 절차를
복제하지 않고 작업자 간 소유권과 증거 전달을 정의한다.

commit·push·live HA 저장은 사용자가 명시적으로 승인한 뒤에만 release owner에게 배정한다.
release owner는 승인된 remote와 author attribution을 확인하고 다음 handoff packet을 받는다.

```md
- 구현·직접 테스트의 검증된 commit 후보:
- RED/GREEN과 전체 suite 결과:
- independent visual review 결과:
- final gate reviewer 결과:
- 영향받는 resource YAML:
- 이전 resource ID/full URL과 dashboard backup:
- implementation SHA와 새 cache key:
- CDN entry/child 확인 결과:
- live HA에서 저장할 resource URL과 dashboard delta:
- 실기기 baseline·복원 service:
- rollback 판정 조건:
```

release owner는 [DEPLOYMENT.md](../DEPLOYMENT.md)의 순서를 그대로 수행하고, 단계별 readback을
lead에게 반환한다. 구현자가 resource release commit이나 live 상태를 스스로 승인하지 않는다.

## 9. canonical ID와 cleanup

### 9.1 canonical entity ID

entity registry migration은 이름 변경만으로 완료되지 않는다.

1. `unique_id`와 active entity의 canonical ID를 확인한다.
2. dashboard YAML과 card config가 canonical ID만 사용하도록 갱신한다.
3. config entry reload 후 canonical ID가 유지되고 `_2`가 재생성되지 않는지 확인한다.
4. legacy/restored/unavailable registry entity는 참조가 0개이고 재생성되지 않음을 확인한 뒤에만 제거한다.
5. canonical ID, migration 근거, 검증 결과를 `PROJECT-STATUS.md`에 기록한다.

### 9.2 cleanup

승인되지 않은 variant, 임시 screenshot, debug HTML, local API dump, 인증 정보, test output을 저장소에 남기지 않는다. 작업 종료 전 `git status --short`로 의도하지 않은 파일이 없는지 확인한다. 다른 소유자의 untracked 파일은 삭제하지 않고 소유자에게 전달한다.

## 10. PROJECT-STATUS.md 배포 기록 템플릿

실 HA QA와 rollback 가능 상태가 확인된 뒤 다음 형식으로 기록한다.

```md
### YYYY-MM-DD <device> 배포

- 구현 SHA: `<40-char SHA>`
- resource release commit: `<commit>`
- resource ID: `<HA resource ID>`
- resource URL: `<full CDN URL with ?v=>`
- dashboard/view/card: `<ha_design / path / custom card>`
- canonical entities: `<comma-separated IDs>`
- 실제 capability와 제외 기능: `<evidence>`
- 실행한 test: `<commands and PASS>`
- Aside QA: `375 / 768 / 1280`, overflow, console/page error, artifact
- independent visual review: `<reviewer and result>`
- gate review-work: `<reviewer, evidence reviewed, release decision>`
- actual HA/device QA: `<state event/API evidence>`
- HA visual editor/Sections resize: `<save, readback, restore evidence>`
- CDN: entry 및 child module HTTP 200, loaded SHA
- 복원한 dashboard/grid/device state:
- rollback pin: `<previous full URL>`
- 남은 provisional/debt:
```

“test를 실행하지 않았음”, “실기기 미확인”, “iOS 미확인”은 PASS로 바꾸지 않는다. provisional 또는 미검증으로 명시한다.
