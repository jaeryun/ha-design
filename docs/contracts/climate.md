# 에어컨 카드 계약

## 배포 대상과 권위 원천

- 실제 Home Assistant storage 대시보드는 `ha_design`이며, `custom:ha-design-climate-card` 두 장은 장소 view `거실`(`living-room`)과 `안방`(`bedroom`)에 한 장씩 배치한다.
- 카드 선언의 권위 원천은 `dashboards/ha-design-climate.yaml`이다. 거실 `climate.geosil_eeokeon`과 안방 `climate.anbang_eeokeon`은 모두 `details_presentation: modal`이며, 같은 필수·선택 capability 구성을 가진다.
- 런타임 모듈 resource의 권위 원천은 `dashboards/ha-design-resource.yaml`이다. 이 파일의 resource ID와 SHA 고정 URL/cache query를 Home Assistant resource 설정에 그대로 반영한다. 이 문서는 URL이나 현재 SHA를 복제하지 않는다.
- production 카드 모듈에는 인스턴스별 entity ID를 넣지 않고 dashboard YAML만 현재 인스턴스 entity를 지정한다.

## 설정과 엔티티

`entity`는 필수이며 존재하는 `climate.*`여야 한다. 다른 domain은 설정 폼과 `setConfig()`에서 거부한다. 자동 stub도 후보와 fallback, 이어서 HA 상태에서 첫 climate entity를 선택하며 기본 상세 방식은 `modal`이다.

| 설정 | domain/속성 | 용도 |
|---|---|---|
| `title`, `eyebrow`, `hero_image` | 텍스트 | 제목, 상단 라벨, 히어로 이미지. 제목 기본값은 `에어컨`, eyebrow 기본값은 `CLIMATE · WIND-FREE`이다. |
| `details_presentation` | `modal` 또는 `inline` | 상세를 native dialog 또는 카드 내 확장으로 표시한다. 배포된 두 카드는 modal이다. |
| `fallback_temperature` | 숫자, 기본 `25` | HA `attributes.temperature`가 없을 때 표시할 희망 온도다. |
| `humidity_entity` | humidity device class `sensor` | 없으면 climate의 `current_humidity`를 사용한다. |
| `filter_entity` | `sensor` | 필터 잔여 시간을 시간(`h`)으로 표시한다. |
| `energy_entity` | power/energy `sensor` | 오늘 에너지를 Wh로 표시한다. |
| `energy_saving_entity` | `switch` | 절전 토글을 표시한다. |
| `notification_entity` | `event` | 물받이 알림 상태를 표시한다. |
| `sleep_timer_number_entity` | `number` | 취침 타이머를 조작한다. |
| `sleep_timer_sensor_entity` | `sensor` | 취침 타이머의 남은 시간을 읽는다. |
| `schedule_turn_on_entity`, `schedule_turn_off_entity` | `sensor` | 다음 자동 시작·종료 예약 시각이다. |
| `energy_yesterday_entity`, `energy_this_month_entity`, `energy_last_month_entity` | `sensor` | 기간별 에너지 이력이다. |

두 배포 카드 모두 습도·필터·오늘 에너지·절전·알림·취침 타이머 number/sensor·켜짐/꺼짐 예약·어제/이번 달/지난달 에너지를 각각의 거실 또는 안방 entity로 연결한다. 별도 `power_entity`는 사용하지 않으며 전원은 primary climate entity가 권위 원천이다.

## 상태와 서비스 의미

- **전원과 모드:** climate state가 `off`가 아니고 사용 가능하면 운전 중이다. 전원 스위치는 `climate.turn_on` 또는 `climate.turn_off`를 호출한다. 표시 가능한 운전 모드는 `hvac_modes`에 포함된 `cool`, `dry`, `fan_only`, `auto`만이며, 선택하면 `climate.set_hvac_mode`를 호출한다. `off`는 상태 표시에만 사용한다.
- **희망 온도:** `min_temp`, `max_temp`, `target_temp_step` 범위에서 +/-를 조정한다(속성이 없으면 16–30°C, 0.5°C). 입력은 즉시 낙관적으로 표시하고 300ms 연속 입력을 묶어 마지막 값만 `climate.set_temperature`로 요청한다. 다음 `hass` 상태가 요청값을 확인하거나 외부의 새 값을 제공하면 그 상태가 다시 권위 원천이 된다. 요청 실패 또는 primary climate의 unknown/unavailable 전환은 보류값을 버리고 실패를 live region으로 알린다.
- **풍량과 스윙:** `fan_modes`만 풍량 탭으로 표시하고 선택 시 `climate.set_fan_mode`를 호출한다. 상하/좌우 스위치는 각각 `swing_mode`, `swing_horizontal_mode`의 `on`/`off`를 반전해 해당 climate service를 호출한다.
- **절전:** 설정된 switch가 사용 가능하고 에어컨이 켜졌을 때만 조작한다. 현재 `on`이면 `switch.turn_off`, 아니면 `switch.turn_on`을 호출한다.
- **습도와 필터:** 유효 숫자만 `%`, `h` 단위로 표시한다. null, none, unknown, unavailable 또는 숫자가 아닌 값은 `—`이다.
- **에너지:** 오늘 에너지는 유효한 양수일 때만 footer에 Wh로 추가한다. 기간 이력도 설정된 세 sensor 중 하나 이상이 유효한 양수일 때만 섹션을 렌더링한다. 렌더링된 각 항목은 유효하지 않으면 `—`과 `data-status="unavailable"`이며, `0`만 있는 미수신 telemetry는 에너지 UI를 만들지 않는다.
- **알림:** event의 `event_type === "water_is_full"`일 때만 경고와 `확인 필요`를 표시한다. state가 `unknown`이고 event type이 없으면 아직 알림이 없는 정상 상태(`새 알림 없음`)다. null 등 사용 불가 상태는 `상태 정보 없음`과 `data-status="unavailable"`이다.
- **예약:** 사용 가능한 ISO 시각만 한국어 월/일/시/분으로 포맷해 표시한다. 켜짐과 꺼짐은 독립적이며, unknown·unavailable·잘못된 시각은 placeholder 행을 만들지 않는다.

## 취침 타이머: 즉시 저장 계약

취침 타이머는 별도 입력이나 적용 버튼이 없는 시간 단위 +/- stepper다. 에어컨이 켜져 있고 number entity가 유효한 `min`, `max`, `step`을 가지면 state가 `unknown`이어도 쓰기 가능하다. unknown state의 초기 선택값은 최소값이며 범위를 벗어날 수 없다.

각 클릭은 새 값을 즉시 화면에 반영하고 곧바로 `number.set_value`에 `{ entity_id, value }`를 보낸다. 서버의 number state가 같은 값으로 도착하면 보류 선택을 해제한다. 응답 전 dialog를 닫으면 보류 선택을 버리므로, 다시 열 때 서버 state를 다시 표시한다. 남은 시간 sensor는 사용 가능한 양의 분일 때만 `N시간 M분` readback을 보이고, unknown·0·음수·잘못된 값은 숨긴다.

## 사용 불가 처리

primary climate의 빈값, none, null, unknown, unavailable은 연결 불가다. compact와 상세는 `연결 상태 확인`/`연결 확인`을 중립적으로 표시하고, 모든 climate 서비스 호출과 전원 제어를 막는다. 전원이 `off`일 때는 온도, 모드, 풍량, 스윙, 절전, 취침 타이머를 비활성화한다. 절전 switch 자체가 사용 불가여도 절전 토글만 비활성화한다.

보조 telemetry는 기능별로 fail-closed 한다. 숫자 metric은 `—`, 알림은 위의 idle 의미, 예약은 행 숨김, 에너지 이력은 양수 데이터가 있을 때만 표시한다. capability 행은 가능한 경우 `data-status`와 원본 숫자/시각 data attribute를 제공해 안전한 machine state를 노출한다.

## 접근성과 반응형

- modal compact는 카드 전체가 하나의 `role="button"` launcher이며 click, `Enter`, `Space`로 native dialog를 연다. `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`를 제공하고, 열면 닫기 버튼에 초점을 두며 닫으면 launcher로 돌린다. 배경 클릭과 native `Escape`도 닫는다.
- dialog가 열리면 문서 overflow를 잠그고 detail 영역만 viewport 안에서 세로 스크롤한다. 상태 갱신은 dialog, scroll owner, 현재 focus를 교체하지 않는다.
- 스위치는 `role="switch"`와 `aria-checked`, 온도/취침 출력과 요청 결과는 `aria-live`를 사용한다. HVAC/풍량은 roving tabindex tablist이며 좌우 화살표가 다음 탭을 focus하고 활성화한다. 모든 focus-visible 제어와 최소 44px 조작 영역을 제공한다.
- Compact Device Card의 공통 계약은 높이 164px(히어로 154px + 흰 tail 10px), grid options `columns: 12`, `min_columns: 4`, `max_columns: 12`이다. host 폭 280px 이하에서는 narrow 요약 한 개로 밀도를 낮추고, 높이와 launcher DOM은 유지한다.
- 상세 dialog는 기본적으로 viewport에서 24px 여백, 420px 이하에서는 16px 여백을 사용한다. 풍량 탭은 가로 스크롤 가능하며 reduced motion에서는 전환과 animation을 사실상 즉시 끝낸다.

## 구현 및 검증 표면

| 구분 | 파일 | 계약 |
|---|---|---|
| 카드 구현 | `www/ha-design/ha-design-climate-card.js` | 설정 폼, 렌더, 서비스 호출, 상태·접근성·responsive 처리 |
| 공통 compact | `www/ha-design/ha-design-device-compact.js` | compact DOM, 높이, 폭별 정보 밀도, 공통 style |
| 배포 카드 선언 | `dashboards/ha-design-climate.yaml` | 두 카드와 인스턴스 entity 매핑 |
| HA resource 선언 | `dashboards/ha-design-resource.yaml` | 런타임 module resource 권위 원천 |
| 설계 기준 | `DESIGN.md` | Compact/Modal Device Card, segment, stepper, 접근성 기준 |
| 운영 기록 | `PROJECT-STATUS.md` | storage 대시보드, 배포 및 live QA 기록 |

정확한 회귀 표면은 다음과 같다.

- `node tools/climate-deployment-test.mjs`: 에어컨 카드 선언의 정확히 두 카드, 두 modal 설정, capability entity, hero asset, resource 형식을 검증한다.
- `tools/climate-interaction-test.html`: rapid temperature, stale reconciliation, LG ThinQ capability safety and commit, idle LG telemetry semantics, unreported energy telemetry stays hidden을 검증한다.
- `tools/climate-modal-test.html`: modal launcher, dark theme의 warm ink, roving HVAC tab과 서비스 호출을 검증한다.
- `tools/stable-dom-test.html`: `climate stable DOM`에서 상태 갱신 뒤 dialog/scroll/focus identity를 검증한다.
- `tools/adaptive-compact-test.html`: climate grid options와 164px 고정 높이를 포함한 compact 폭 변경 계약을 검증한다.
- `node tools/device-compact-contract-test.mjs`와 `tools/device-compact-visual-test.html`: 공통 compact 구현과 desktop/iPhone WebKit 시각 계약을 검증한다.

## 기록된 live QA

`PROJECT-STATUS.md`의 배포 기록은 실제 `ha_design`에서 에어컨 두 카드와 상세 modal, 375px 및 desktop을 확인했다고 기록한다. 알림, 예약, 취침 타이머, 기간별 에너지와 dark-theme의 `희망 온도`/값 색상, 온도 왕복 입력 후 `state_changed` 및 modal scroll 유지가 대상이었다. 375px 기록에서는 modal과 문서의 가로 overflow가 없고 console/page error가 0개였으며, 해당 QA에서는 실제 기기 상태를 바꾸는 서비스를 호출하지 않았다. 이는 기록된 검증 결과이며 현재 runtime 상태의 대체 근거가 아니다.
