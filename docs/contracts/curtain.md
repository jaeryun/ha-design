# 커튼 카드 계약

공통 Home Assistant 카드/Sections 규칙은 [HA-STANDARD.md](../../HA-STANDARD.md), 시각·상호작용 언어는 [DESIGN.md](../../DESIGN.md), 현재 배포 증거와 인수인계 기준은 [PROJECT-STATUS.md](../../PROJECT-STATUS.md), 설치 진입점은 [README.md](../../README.md)를 따른다. 이 문서는 `ha-design-curtain-card`에만 추가되는 구체 계약이다.

## 권위 원천과 범위

| 대상 | 권위 파일 | 소유 내용 |
| --- | --- | --- |
| 카드 controller/HA API | [`www/ha-design/ha-design-curtain-card.js`](../../www/ha-design/ha-design-curtain-card.js) | 설정 검증, 상태 렌더 모델, 서비스 호출, picker/editor, dialog 수명 |
| 의미 DOM/ARIA | [`www/ha-design/ha-design-curtain-card.template.js`](../../www/ha-design/ha-design-curtain-card.template.js) | launcher, dialog, range, 이동/고급 제어의 구조와 문구 |
| 범위 한정 표현 | [`www/ha-design/ha-design-curtain-card.styles.js`](../../www/ha-design/ha-design-curtain-card.styles.js) | aperture, modal, control, focus/reduced-motion CSS |
| 위치 추정 | [`www/ha-design/ha-design-curtain-motion.js`](../../www/ha-design/ha-design-curtain-motion.js) | 위치 정규화, 상태 문구, RAF 보간, HA 재동기화 |
| 인스턴스 설정 | [`dashboards/ha-design-curtain.yaml`](../../dashboards/ha-design-curtain.yaml) | 거실/안방 엔티티와 실제 이동 시간 |
| live resource | [`dashboards/ha-design-curtain-resource.yaml`](../../dashboards/ha-design-curtain-resource.yaml) | 실제 Lovelace resource ID, module URL, `type: module` |

resource YAML이 배포 URL의 유일한 권위 원천이다. URL은 배포된 **40자리 commit SHA**와 새 cache-bust query를 함께 써야 하며, 이 문서나 다른 복사본에 SHA를 재기록하지 않는다. source 변경은 먼저 구현을 배포한 뒤 resource만 그 배포 SHA로 갱신한다. `id`를 교체하지 않으며, HA resource의 본체와 상대 import가 같은 구현을 가리켜야 한다.

## 사용자 표면

- 목록은 공통 compact launcher 하나다. 커튼별 scene, eyebrow, 제목, badge, 한 줄 상태만 확장하고 목록에 열기/닫기/slider를 넣지 않는다.
- launcher 전체의 click, `Enter`, `Space`가 native `dialog` 상세를 연다. `aria-haspopup="dialog"`, `aria-controls`, `aria-expanded`와 제목 기반 `aria-labelledby`를 제공한다.
- 상세 순서는 aperture hero와 닫기, 현재 위치 range, 지원되는 `열기`/`정지`/`닫기`, 선택적 모터 상태, 선택적 고급 설정, 지원 기능 요약이다. 닫기 버튼·배경 click·`Escape`로 닫고 launcher로 focus를 돌린다.
- position 지원 시 native range는 `0..100`, step `1`, `aria-label="커튼 위치"`, `aria-valuetext="N% 열림"`이다. `input`은 화면 미리보기만, `change`는 한 번의 `cover.set_cover_position`만 호출한다.

## canonical 엔티티와 설정 경계

필수 주 엔티티는 `device_class: curtain`인 `cover.*`다. `setConfig()`는 다른 domain, 이미 알려진 curtain 이외 device class, 0 이하/비유한 `travel_duration`, 다음 sibling domain 위반을 거부한다. editor selector와 picker stub/suggestion도 curtain `cover`만 선택한다.

| 설정 키 | domain | 의미 |
| --- | --- | --- |
| `entity` | `cover.` | 필수 커튼; 실제 배치는 `cover.geosilkeoteun`, `cover.anbangkeoteun` |
| `title`, `eyebrow`, `hero_image` | 값 | 표시값. 이미지는 http/https만 허용하고 그 외는 기본 hero |
| `travel_duration` | 초 | 전체 이동 시간. 미지정 기본 `9`; 0보다 커야 함. 거실 `8.8`, 안방 `7.4` |
| `motor_fault_entity` | `binary_sensor.` | 모터 안전 상태 |
| `reverse_direction_entity` | `select.` | `forward`/`back` 모터 방향 |
| `motor_working_mode_entity` | `select.` | `continuous`/`intermittently` 작동 모드 |
| `upper_stroke_limit_entity`, `middle_stroke_limit_entity`, `lower_stroke_limit_entity` | `select.` | 상/중/하 스트로크 보정 |

주 엔티티의 `supported_features=15`는 `OPEN=1`, `CLOSE=2`, `SET_POSITION=4`, `STOP=8`의 비트 조합이다. 각 비트가 있을 때만 해당 control을 렌더링·호출하며, tilt/속도 기능은 만들지 않는다. `getCardSize()`는 `4`, API grid 범위는 `{ columns: 4, min_columns: 4, max_columns: 12 }`다. live Sections 배치는 별도 저장된 columns가 `6`일 수 있으며, 카드 API 기본값과 혼동하지 않는다.

## 위치, 개폐, 정지와 권위 상태

1. canonical position은 유한한 `attributes.current_position`을 `0..100`으로 clamp한 값이다. 그 속성이 없으면 `closed`는 `0`, 그 밖의 상태는 `100`으로 해석한다. 없는 state 자체는 `null`이다.
2. `open_cover`의 target은 `100`, `close_cover`의 target은 `0`, `set_cover_position`의 target은 clamp한 요청 `position`이다. 시작 위치에서 target까지의 duration은 `travel_duration × 이동거리/100`이며 최소 full travel은 100ms다.
3. 서비스 직후 RAF가 선형 보간하고 `opening` 또는 `closing` 문구, output, range, hero aperture, badge를 같은 반올림 정수로 갱신한다. aperture의 시각 개방폭은 position의 `88%`다. `ha-design-position-change`는 `{ position, direction }`을 발행한다.
4. `stop_cover`는 예약 frame을 취소하고 현재 추정값을 `0..100` 정수로 고정한다. 이후 HA가 baseline과 0.5 이상 다른 실제 위치를 보내면 추정을 즉시 버리고 그 authoritative 값으로 재렌더한다. 시작 위치와 같은 stale HA update는 보간을 취소하지 않는다. 보간 완료가 HA 완료 상태를 미리 확정하지 않는다.
5. range preview는 input 동안만 유지한다. focus만으로 다음 HA update를 가려서는 안 된다. HA state update 중 dialog node, scroll owner, 열린 상태와 현재 control focus를 보존한다.

위치는 `0`이면 `닫힘`, `100`이면 `완전히 열림`/badge `열림`, 그 사이는 `열림 N%`/badge `N%`이다. HA `opening`/`closing` 또는 진행 중 추정 방향은 각각 `열리는 중 · N%`/`닫히는 중 · N%`와 `열림 중`/`닫힘 중`을 쓴다.

## 고급 기능과 fault 의미

- 모터 방향과 작동 모드는 `select.select_option`으로 변경하고 확인 dialog를 수락한 경우만 호출한다. 표시 선택지는 각각 정방향/역방향, 연속/간헐이다.
- 상·중·하 stroke는 각각 `SET` 또는 `RESET`을 같은 `select.select_option`으로 보낸다. 세 명령도 확인 후에만 적용한다.
- 설정된 select가 없거나 `unknown`/`unavailable`이면 해당 control은 disabled이고 `확인 중`을 표시하며 서비스를 호출하지 않는다. 취소한 선택은 직전 state로 되돌린다.
- fault sensor가 `on`이면 `고장 감지`, `off`이면 `정상`을 `role="status"` 모터 상태 행에 표시한다. 그 외(미설정, 누락, `unknown`, `unavailable`)는 fault 행과 capability 요약의 `모터 상태`를 모두 생략한다. 알 수 없음을 영구 고장/정상으로 추정하지 않는다.

## unknown/unavailable fail-closed

주 cover state가 `unknown` 또는 `unavailable`이면 position을 표시하지 않고 compact 상태 `상태 확인 중`, badge `확인 필요`, 상세 output `확인 중`을 사용한다. 지원 비트가 있더라도 open/stop/close/range를 disabled로 만들고 cover service를 호출하지 않는다. `_callCoverService()`도 state 부재, 위 상태, 미지원 feature를 모두 fail-closed 처리한다.

## 반응형·접근성·표현 경계

- compact의 공통 geometry는 모든 폭에서 hero `154px` + white tail `10px` = 카드 높이 `164px`다. 폭은 HA Sections가 결정하며 host `280px` 이하에서는 narrow 상태 하나, 초과에서는 wide 상태를 쓴다. resize가 launcher DOM, dialog, focus, scroll state를 교체하면 안 된다.
- card가 소유하지 않는 compact radius, tail, copy markup, explicit tile/wide variant와 sizing은 [`ha-design-device-compact.js`](../../www/ha-design/ha-design-device-compact.js)의 소유다. curtain은 scene과 상세 UI만 확장한다.
- 모든 button/range/select는 최소 block size `44px`; focus-visible은 3px outline이다. disabled control은 `not-allowed` cursor와 낮은 opacity를 사용하되 상태 텍스트를 유지한다.
- dialog는 `min(460px, 100vw - 24px)`, 최대 높이 `100dvh - 24px`이고 `.curtain-detail`만 세로 scroll을 소유한다. hero 장식 계층은 pointer event를 받지 않는다.
- panel `inline-size` transition은 220ms이며 `prefers-reduced-motion: reduce`에서 제거한다. 색만으로 위치, fault, disabled 상태를 전달하지 않는다.

## 정확한 회귀 게이트와 live QA

다음 명령/표면이 이 계약의 정확한 회귀 게이트다.

```sh
node tools/curtain-card-test.mjs
node tools/curtain-motion-test.mjs
node tools/curtain-deployment-test.mjs
```

- `curtain-card-test.mjs`: cold-load 등록, config/feature/service 경계, 고급 select 확인/fail-closed, dashboard entity·시간, template/style 계약을 검사한다.
- `curtain-motion-test.mjs`: open/close 중간 보간, authoritative reconcile, proportional partial travel, 정지 정수화와 이후 HA snap을 fake RAF로 검사한다.
- `curtain-deployment-test.mjs`: resource ID/module URL 형식과 전체/inline dashboard의 Sections, 양쪽 entity, 이동 시간을 검사한다.
- 브라우저 계약은 [`tools/curtain-visual-test.html`](../../tools/curtain-visual-test.html)에서 두 카드의 geometry, keyboard/dialog/focus, focused range의 HA update, 서비스 순서, fault/select/stroke, unknown disabled를 검사한다. [`tools/adaptive-compact-test.html`](../../tools/adaptive-compact-test.html)은 폭 `164→492`에서도 `164px` 높이와 동일 launcher DOM을, [`tools/stable-dom-test.html`](../../tools/stable-dom-test.html)은 열린 dialog의 node/scroll/focus 보존을, [`tools/card-picker-test.html`](../../tools/card-picker-test.html)은 editor/stub/picker의 curtain filter를 검사한다.

live QA는 실제 `ha_design`의 `거실`·`안방` Sections view에서 커튼 카드와 resource URL을 확인한 뒤 수행한다. 두 card가 config error 없이 렌더되는지, Layout 탭에서 columns 변경·저장·실측 후 원래 저장값으로 복원되는지, desktop과 mobile에서 가로 overflow가 없는지 확인한다. 거실은 `0% → position 10% → open_cover → stop_cover → close_cover → closed/0%` 순으로 실제 state/event를 확인하고, stop 뒤 실제 중간 위치가 오면 추정 정수 대신 그 값으로 바뀌는지 확인한다. 안방의 원래 `closed/0%`와 모든 QA 전 실제 기기 상태·dashboard config를 복원한다. unknown/unavailable, disabled advanced control, keyboard open/close와 focus 복귀도 실표면에서 확인하며, 승인 없는 서비스 호출로 상태를 바꾸지 않는다.
