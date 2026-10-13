# ha-design 작업 현황과 인수인계

새 세션은 이 문서를 먼저 읽고 실제 Home Assistant 상태를 다시 확인한 뒤 작업한다. 사용자별 주소·인증 정보는 저장소에 기록하지 않는다.

HA custom card 표준 계약, Sections resize 조건, visual editor 완료 기준은
[HA-STANDARD.md](HA-STANDARD.md)를 따른다. 새 카드 추가나 기존 카드 변경은 해당 체크리스트를
통과하기 전까지 완료로 기록하지 않는다.

## 현재 배포 기준

- 브랜치: `main`
- 실제 storage 대시보드: `ha_design` (표시 이름 `홈`)
- **현재 resource URL, ID, 구현 SHA, cache key의 유일한 정본:**
  - `dashboards/ha-design-light-resource.yaml`
  - `dashboards/ha-design-resource.yaml` — climate
  - `dashboards/ha-design-curtain-resource.yaml`
  - `dashboards/ha-design-cold-storage-resource.yaml`
  - `dashboards/ha-design-washer-resource.yaml`
  - `dashboards/ha-design-camera-resource.yaml`
  - `dashboards/ha-design-air-purifier-resource.yaml` — 거실 view가 사용하므로 live 등록이 필요하다
- 이 문서의 SHA와 resource URL은 날짜가 있는 검증 이력이다. 현재 pin을 이곳에 복사하거나 이력 SHA를 live URL로 사용하지 않는다.
- 전체 회귀와 browser 검증의 정본 절차는 [DEPLOYMENT.md의 검증 섹션](DEPLOYMENT.md#nodesyntax-검증)을 따른다. 문서별 책임은 [docs/README.md](docs/README.md)를 따른다.
- 홈 메뉴 정본은 장소 다섯 Sections view다(`dashboards/ha-design.yaml`, `dashboards/ha-design-inline.yaml`).
  - `거실` (`living-room`) — `custom:ha-design-climate-card` 1개, `custom:ha-design-curtain-card` 1개, `custom:ha-design-air-purifier-card` 1개, `custom:ha-design-camera-card` 1개(거실 카메라)
  - `안방` (`bedroom`) — `custom:ha-design-light-card` 1개, `custom:ha-design-climate-card` 1개, `custom:ha-design-curtain-card` 1개
  - `아기방` (`baby-room`) — `custom:ha-design-camera-card` 1개(아기 카메라)
  - `주방` (`kitchen`) — `custom:ha-design-cold-storage-card` 2개(냉장고, 김치냉장고)
  - `다용도실` (`utility-room`) — `custom:ha-design-washer-card` 1개, 승인 A안 `Warm Utility`
- 기기 종류 view(`climate`, `curtain`, `cold-storage`, `washer`, `camera`, `air-purifier`)는 메뉴에서 제거됐다. `bedroom` 경로는 안방 view가 유지한다.
- 실제 `ha_design` storage config의 저장 여부와 실서버 QA는 아래 2026-10-13 장소 중심 홈 메뉴 항목을 따른다.
- 카메라 resource는 `dashboards/ha-design-camera-resource.yaml`이 소유한다. C120은 `stream_name: c120_1`을 사용하며, C225와 C120은 각자의 실제 capability만 표시한다.
- 대시보드 registry는 `dashboard_unknown`, `ha_design` 두 개를 유지한다.

### 현재 카메라 상태

- 이벤트 히스토리는 HA 시간대의 오늘을 포함한 **최근 7개 달력 날짜**를 기본 오늘 선택으로 제공한다. Frigate `recordings/summary`와 `recordings/get`의 실제 segment로 녹화 범위·공백·bounded VOD를 구성한다. 기존 31일 달력과 이벤트별 70초 고정 clip은 현재 UI가 아니라 날짜가 있는 과거 이력이다.
- Tapo 재등록 뒤 `_2`가 붙은 신규 active entity 77개를 기존 canonical ID로 되돌리고, 구형 legacy registry 항목 77개를 제거했다. config entry 재로드 후 `_2`가 재생성되지 않았고, PTZ 방향·이동 각도와 소리 이벤트는 canonical ID를 사용한다.

### 다음 세션의 view 작업 주의사항

- 장소 다섯 view는 모두 Sections이고 `max_columns: 1`이며, 기존 카드·entity 설정을 장소별로 재배치했다.
- 거실 view는 `custom:ha-design-air-purifier-card`를 포함하며, 해당 resource는 live에 등록돼 있다(실서버 렌더 확인).
- 카드별 `grid_options.columns`는 Sections view에서 작동한다. 기본값은 조명·에어컨·세탁기·카메라 `12`, 커튼·냉장 기기 `6`, 공통 범위는 `4–12` columns다.
- `getGridOptions()` 존재 여부만으로 resize 완료를 선언하지 않는다. 실제 HA Layout 탭에서 저장·실측·원복하고 storage config를 확인한다.
- resize QA에서 임시로 폭을 바꿀 때는 전후 storage config를 읽고 원래 columns로 복원한다.

## 완료된 안방 조명 UI

### 실제 기기 계약

- 엔티티: `light.anbang_jomyeong` (2026-10-13 이름 정리, 이전 `light.anbang_jomyeong_2`)
- 통합: Tapo (TP-Link L535, device `안방 조명`, area `anbang`)
- 지원 기능:
  - 전원
  - 밝기
  - 색온도 `2500–6500K`
  - HS 색상
- 미광고 기능: transition(`supported_features: 0`), effect, flash
- 이전 SmartThings 엔티티 `light.anbang_anbang_jomyeong`은 entity registry에 없다. 2026-08-30 기록의 안방 view 누락 문구가 이 때문이며, 2026-10-13에 카드가 실제 엔티티를 가리키도록 정리했다.

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

### 2026-09-05 에어컨 취침 타이머·에너지 UI 배포

- 취침 타이머 설정값은 실제 1시간 단위에 맞춰 `0시간`처럼 시간만 표시하고, 고정 `0분`과 LG ThinQ 설명문을 제거했다.
- 0 또는 미수신 상태만 제공하는 에너지 기록과 오늘 에너지 UI를 숨기고, 남은 습도·필터 지표는 빈 칸 없이 같은 폭 2열로 배치했다. 양수 에너지 값이 들어오면 기존 에너지 UI를 다시 표시한다.
- 실제 HA 에어컨 resource ID `e2e7fd13a2aa432997f35046344b5b1c`를 유지하고 구현 SHA `18d9ab60e0a370a6942b1967e444279f9982331e`, cache key `shared-compact-20260904-1`로 갱신했다.
- 라이브 desktop과 실제 375px browsing context에서 `0시간`, 설명문 0개, 에너지 기록 0개, 상태 지표 2개, 가로 overflow 0을 확인했다.
- 에어컨 서비스는 호출하지 않아 실제 기기 설정과 운전 상태를 변경하지 않았다.

### 2026-08-31 WD25DB8690BE Idle 기능별 게이트 배포

- Home Assistant `power=off`를 전원 코드 분리가 아닌 정상 `대기`로 표시하고, compact 카드와 상세 모달에 `스마트컨트롤 꺼짐`을 별도 표기한다.
- 실기기 검증에서 Idle·스마트컨트롤 OFF 상태에서도 지연 반영된 세제·유연제 투입량만 조작 가능하게 유지했다.
- 같은 조건에서 반영되지 않은 물 온도·헹굼·탈수·버블 불림·구김 방지는 숨기고, 코스를 조회할 수 없어 새 운전 시작 버튼을 제거했다.
- 실제 HA resource ID `d99a02a5345c419f9d807eb2fe4bbf53`를 유지하고 구현 SHA `7f760a2a6711cbe8d4bbe8f7886591e0628f7eff`와 cache key `washer-all-entities-20260831-3`으로 갱신했다.
- 라이브 desktop에서 본체와 `config/state/styles/template/controls` 하위 모듈이 모두 같은 구현 SHA에서 로드됨을 확인했다.
- 라이브 DOM은 Idle에서 세제·유연제 두 control만 노출하고 시작 버튼 0개, 문서·모달 가로 overflow 0, 구성 오류 0개다.
- 로컬 375px 실제 iframe 렌더는 문서·모달 가로 overflow 0이며 한국어 잘림이나 비정상 줄바꿈이 없다.
- 전체 `tools/*test.mjs`, 세탁기 상호작용 브라우저 계약, 카드 picker, JavaScript syntax, LSP, `git diff --check`가 PASS다.

### 2026-08-30 표준 visual editor·Sections resize·취침 타이머 배포

- 다섯 view를 모두 Sections로 이전하고 기존 카드·entity 설정을 보존했다. 조명·에어컨·세탁기는 기본 `12` columns, 커튼·냉장 기기는 기본 `6` columns이며 모든 카드가 HA 표준 Layout 탭을 제공한다.
- 실제 HA에서 냉장 기기 카드의 native visual editor 22개 필드와 세탁기 카드의 native visual editor 26개 필드, entity selector, live preview를 확인했다. 두 editor 모두 `비주얼 편집기가 지원되지 않습니다` 문구가 없다.
- 실제 세탁기 카드의 HA `레이아웃` 탭에서 `열 수` slider를 사용해 `12 columns / 480px → 6 columns / 236px → 12 columns / 480px`로 저장·검증·원복했다. 최종 storage readback은 `grid_options: { columns: 12, rows: auto }`다.
- 거실 에어컨이 `cool`로 운전 중인 실제 모달에서 취침 타이머 `+`로 `0시간 0분 → 1시간 0분`, `−`로 `0시간 0분` 복귀를 확인했다. `input[type=number]`는 0개이고 `적용`은 활성 상태였지만 누르지 않아 기기 서비스는 호출하지 않았다.
- desktop `1440×900`과 mobile `375×812`에서 다섯 view를 fresh capture했다. 비조명 네 view는 구성 오류가 없고 모든 view의 `scrollWidth == clientWidth`로 가로 넘침이 없다.
- 조명 제외 범위 밖인 `안방` view에는 기존 `light.anbang_anbang_jomyeong` entity 누락 문구가 남아 있다. 이번 editor·resize·timer 배포에서는 수정하지 않았다.
- 다섯 resource ID는 유지하고 모두 구현 SHA `fa0c279f6afb5c76ab5c7d0ce4fc9deff2baa1ac`와 새 cache-bust query로 갱신했다.

### 2026-08-30 idle telemetry 의미 보정 실서버 배포

- LG ThinQ의 알림 event와 취침 타이머 number/sensor는 30일 history 전체가 `unknown/unavailable`였고, 에너지 8개 sensor는 `0.0/unavailable` 외 값을 한 번도 내지 않았다.
- 알림 event의 `event_types=["water_is_full"]`, `event_type=null`은 기능 미지원이 아니라 아직 발생한 알림이 없는 상태로 해석해 `새 알림 없음 · 정상`으로 표시한다.
- 취침 타이머 number는 현재값이 `unknown`이어도 유효한 `min/max/step`과 Home Assistant `number.set_value` 구현을 가지므로, 에어컨 전원이 켜졌을 때 입력과 명시적 적용을 활성화한다. 실제 기기 타이머 값은 QA 중 변경하지 않았다.
- 오늘·어제·이번 달·지난달 에너지가 모두 0이면 측정값처럼 `0Wh`를 표시하지 않고 `LG ThinQ 데이터 미수신`과 `—`로 표시한다.
- Zigbee2MQTT motor fault 2개는 30일 동안 실제 `on/off`를 한 번도 발행하지 않았으므로 영구 `확인 중` 행을 숨긴다. 향후 `on/off`가 오면 고장/정상 행을 다시 표시한다.
- 실제 desktop과 375px에서 에어컨 알림·타이머·에너지와 커튼 모달을 확인했다. 두 모달 모두 `scrollWidth == clientWidth`, 문서 `scrollWidth=375`, console/page error 0개였다.

### 2026-08-30 비조명 전체 기능 A안 실서버 배포

- 사용자가 승인한 Option A의 조밀한 정보 구조를 에어컨 2대, 커튼 2대, 냉장고, 김치냉장고 상세 UI에 배포했다.
- 조명·에어컨·커튼·냉장 기기 resource ID를 유지하고 구현 SHA `ab9c196b56bd8e39d610bb9cac41aa8226c91bf9`와 새 cache-bust query로 갱신했다. 세탁기 resource는 기존 검증 SHA를 유지했다.
- 실제 `ha_design` storage config는 에어컨 26개, 커튼 14개, 냉장 기기 20개, 세탁기 21개로 의미 있는 비조명 엔티티 81개를 모두 연결하며 누락 entity는 0개다.
- 냉장고는 실제 온도 sensor와 목표 온도 number를 분리했고, 김치냉장고는 가짜 zones/mode 없이 문 상태와 5개 실제 에너지 지표만 표시한다.
- 실제 desktop과 375px에서 에어컨 알림·예약·취침 타이머·기간별 에너지, 커튼 모터 상태·방향·작동 모드·상중하 스트로크, 냉장고 목표 온도·급속냉각·급속냉동·5개 에너지, 김치냉장고 5개 에너지를 모달에서 확인했다.
- 세 모달 모두 375px에서 `scrollWidth == clientWidth`, 문서 `scrollWidth=375`, console/page error 0개였다. 실제 기기 상태를 바꾸는 서비스는 호출하지 않았다.

### 2026-08-30 WD25DB8690BE 세탁기 A안 실서버 배포

- 사용자가 승인한 Option A `Warm Utility`를 구현 SHA `c5cc83ebe40a3d66288f1cb80abd2bc9af1a457b`에 고정해 resource로 등록했다.
- 실제 `ha_design` storage 대시보드에 `세탁기` (`washer`) Sections view와 WD25DB8690BE 카드 1개를 추가했다.
- 실제 SmartThings `dayongdosil_setaggi` prefix의 전원·원격 제어·운전·작업·완료 시각·세탁 설정·사용량 엔티티를 연결했다.
- storage 대시보드 ID와 URL path는 유지하고 표시 이름만 `ha-design`에서 `홈`으로 변경했다.
- 전원과 원격 제어가 꺼진 현재 상태에서는 시작·설정이 fail-closed로 표시되며 실제 기기 서비스는 호출하지 않는다.
- 전원 OFF는 정상 대기 상태이므로 경고 아이콘·경고 박스·운전 제어 섹션을 숨기고 `다음 세탁을 기다리고 있어요.`만 중립적으로 표시한다. 원격 제어 경고는 전원 ON 상태에서만 노출한다.
- SmartThings가 노출한 세탁기 엔티티 21개를 모두 매핑한다. 기존 조작·운전·사용량 외에 차일드 락, 구김 방지 실제 활성, 에너지 차이, 절약 에너지, 전력 에너지를 상세 모달에 추가했다.

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

## 2026-08-31 거실 카메라 배포

- 실제 `ha_design` storage 대시보드에 `camera` view를 추가했다.
- 배포 카드: `custom:ha-design-camera-card`
- 구현 SHA: `066b27e5e04c91215341709a323e7fbf98067416`
- resource ID: `645f25c65a1c4da0be1962ffa526157d`
- resource URL:
  - `https://cdn.jsdelivr.net/gh/jaeryun/ha-design@066b27e5e04c91215341709a323e7fbf98067416/www/ha-design/ha-design-camera-card.js?v=camera-local-20260903-21`
- 상세 영상의 `LIVE` 배지를 제거하고, 녹화 중에만 빨간 점과 `REC`를 표시한다.
- REC 배지는 `left: 12px`, `bottom: 52px`의 반투명 A안으로 네이티브 비디오 컨트롤과 8px 간격을 유지한다.
- CDN 본체와 재귀 의존 모듈 17개는 모두 HTTP `200`을 확인했고, 라이브 HA는 같은 구현 SHA의 카메라 모듈 16개를 로드했다.
- 실시간 영상은 HA 인증 Frigate go2rtc 프록시의 비동기 WebRTC 영상·소리를 `<video controls>`로 재생한다.
- 첫 프레임은 기존 HLS `7.28s`에서 WebRTC `0.39s`로 줄었고, 실제 재생은 `1920×1080`, `readyState=4`를 확인했다.
- `전체화면`은 브라우저 권한에 의존하지 않는 `100vw × 100dvh` 플레이어 모드이며 `Escape`로 복귀한다.
- WebRTC player는 상세 모달이 열려 있는 동안에만 생성하고, 모달 종료 시 peer와 socket을 제거한다.
- WebRTC ICE 후보는 LAN `10.10.10.2:30196`과 Tailscale `100.73.56.15:30196`만 사용한다.
- C225 메인 RTSP는 펌웨어 제한 `2048kbps`에서 이동 화질을 확보하도록 `1920×1080`으로 설정했다.
- 실제 Tapo·Frigate 상태를 반영한다.
  - 프라이버시 모드: `off`
  - 연속 녹화: `off`
  - 소리 이벤트 센서: `off`
  - 이동 각도: `15°`
  - PTZ 버튼: 사용 가능
  - 움직임·사람 감지: `normal`
  - 나머지 영상·소리 감지: `off`
- 이벤트 히스토리는 HA history API의 지난 31일 사람·움직임·소리 기록을 사용한다.
  - 실제 705개 원본 이벤트를 5분 무감지 기준 16개 활동 구간으로 정리
  - 사람·움직임·소리 독립 다중 선택과 이벤트 없는 달 탐색
  - 달력의 단순 활동 점과 `00·04·08·12·16·20·24` 4시간 눈금
  - 타임라인은 초·밀리초 단위의 실제 시작 위치와 지속시간을 86400초 비율로 표시
  - 활동 목록은 시간 범위·지속시간·감지 종류만 표시하고, 상세는 구간의 원본 이벤트 전체를 최신순으로 표시
  - 실제 `15:36:02–16:25:34` 활동 상세에서 소리 원본 57개와 첫 `16:25:34`·마지막 `15:36:02` 확인
  - 활동 상세 breadcrumb는 `거실 카메라 › 이벤트 히스토리 › 2026년 9월 2일 › 02:08:59 이벤트`처럼 연도·날짜·최신 원본 감지 시각을 구분해 표시
  - 녹화 패널은 감지 15초 전부터 55초 후까지 signed Frigate HLS를 사용자 요청 시에만 로드하고, 툴바에 `02:08:44–02:09:54 · 1분 10초` 범위를 표시
  - 실제 과거 영상은 `1920×1080`, `readyState=4`, native controls, 음소거 인라인 재생을 확인
  - 단발성 활동도 같은 70초 window를 사용하며 날짜 breadcrumb 복귀 시 player와 signed URL을 제거
  - HA iOS 앱의 WKWebView 호환을 위해 Frigate master의 H.264/AAC codec metadata를 유지하고, master가 광고한 `index-v1-a1.m3u8`를 별도로 서명한 client-side master wrapper를 사용
  - 직접 index는 HA player에서 `hasAudio=false`, `hasVideo=false`였고 wrapper는 `hasAudio=true`, `hasVideo=true`, `1920×1080`, `readyState=4`를 확인
  - iOS HLS 수정은 Chromium·HA proxy runtime과 upstream WebKit 경로로 검증했으며, 실제 HA iOS 앱 기기 확인 전까지 배포 상태는 provisional이다.
  - 날짜 breadcrumb로 돌아갈 때 진행 중 master/child 요청의 generation을 폐기해 stale player가 다시 나타나지 않도록 한다.
  - child playlist body await 직후에도 generation을 재확인해 늦게 끝난 응답이 취소된 player를 복원하지 못하게 한다.
  - 실제 HA iOS 앱에서 Hls.js `MEDIA_ERROR`가 확인돼 iPhone/iPad의 native HLS 지원을 feature-detect하고, Apple mobile에서는 별도 서명 child를 plain `<video>`에 연결해 AVFoundation 경로를 사용한다.
  - native HLS에서 재생 시간은 진행하지만 화면이 검게 나오는 실기기 증상은 녹화 조각 경계의 init·timestamp 연속성 문제로 좁혔다.
  - Frigate `/vod/clip/` 경로는 같은 기존 녹화본을 사용하면서 원본 조각마다 `EXT-X-DISCONTINUITY`와 별도 init segment를 제공한다. HA signed proxy에서 6개 조각·5개 discontinuity·6개 init·`ENDLIST`를 확인했다.
  - 카드의 master와 child 요청을 모두 `/vod/clip/`으로 전환했다. 라이브 Chromium에서 기존 이벤트가 `1920×1080`, `readyState=4`, `duration=71.202`, 오류 없음으로 재생되고 실제 영상 프레임이 표시됐다.
  - 실제 HA iOS 앱에서 새 discontinuity playlist를 확인하기 전까지 최종 iPhone 상태는 provisional이다.
  - Chromium과 비 Apple 브라우저는 기존 `ha-hls-player` master wrapper 경로를 유지하며 두 분기 browser contract가 각각 PASS다.
  - 네이티브 video의 `src`는 HA 상태 patch에서 보존하고, 모든 상세 종료 경로에서 `pause()`·`src` 제거·`load()`를 실행해 재시작과 백그라운드 다운로드를 막는다.
- 실제 HA에서 확인한 동작:
  - compact 카드와 native 카메라 상세 모달
  - 프라이버시·녹화·감지·방향 제어의 실제 상태
  - 이벤트 전용 화면과 필터
  - 달력 → 24시간 활동 타임라인 → 활동 상세 → 원본 이벤트 탐색
  - `Escape` 활동 상세 → 이벤트 → 카메라 → 카드 복귀와 목록 스크롤·구간 초점 복원
  - 문서 스크롤 잠금과 해제
- C120 `아기 카메라`를 기본 `picture-entity`에서 두 번째 `custom:ha-design-camera-card`로 교체했다.
  - 실제 Tapo C120 엔티티의 프라이버시·사람·움직임·반려동물·차량·울음·짖음·고양이·유리 파손 감지와 사람·움직임·소리 이벤트를 연결했다.
  - C120에 없는 PTZ·이동 각도·자동 추적·가림 감지는 설정과 상세 UI에서 표시하지 않는다.
  - HA 카메라 이름 `c120`과 실제 go2rtc stream `c120_1`이 달라 `stream_name` override를 추가했다.
  - 실제 C120 WebRTC는 `connected`, `readyState=4`, `2560×1440`, dropped frame `0`으로 확인했고, 기존 C225도 `1920×1080`, PTZ 1개를 유지했다.
  - C120 이벤트 히스토리는 실제 428개 원본 이벤트·15개 활동 구간을 로드했고, 녹화 영상은 `2560×1440`, `readyState=4`, 오류 없음으로 재생됐다.
- Frigate MQTT를 활성화해 HA의 `switch.main_camera_recordings`와 `switch.c120_recordings`가 실제 Frigate 저장 상태를 권위 있게 반영한다.
  - 두 카메라 모두 움직임이 있는 구간을 10일 저장하고 continuous recording은 사용하지 않는다.
  - UI는 `Frigate 녹화`, `움직임이 있는 구간을 10일 저장`, `카메라 SD카드와 별도`로 의미를 구분한다.
  - C120 녹화 스위치를 실제 UI에서 `on → off → on`으로 검증하고 최종 `on`과 Frigate `record.enabled=true`를 확인했다.
  - compact의 오해를 부르는 `LIVE` 배지는 제거하고, 실제 녹화 중 상세 영상에만 좌측 하단 `REC`를 표시한다.
  - desktop과 393px에서 두 compact 카드와 C120·C225 상세를 확인했고, 모바일 문서 `393/393`, dialog `369/369`, CJK 잘림·가로 overflow 0이다.
- 배포 후 실제 `recording=off`, `privacy=on` 상태에서는 영상 배지가 0개임을 확인했다.
- 기기 서비스 호출 없이 카드의 브라우저 입력만 일시적으로 바꿔 desktop·393px·전체화면에서 `REC` 1개, `LIVE` 0개, 좌측 12px·하단 52px, 컨트롤·닫기 버튼 무충돌을 확인하고 페이지 재로드로 실제 상태를 복원했다.
- PTZ 지연 측정에서는 이동 화면 반영 `0.74s`, packet loss·dropped frame `0`을 확인하고 같은 각도의 역방향 이동으로 위치를 복원했다.
- grouped history 구현은 `e7faa65`, 과거 녹화 재생 구현은 `51bf3cc`, native iPhone HLS는 `a83e2b5`·`5ceb4d4`, discontinuity VOD 전환은 `d42ee45`, C120 custom UI는 `ad2c8a2`, C120 WebRTC stream override는 `066b27e`, 최신 resource pin 릴리스는 `218f270`이다.
- `node tools/*test.mjs`, 전체 카메라 모듈 `node --check`, LSP, `git diff --check`가 PASS다.

## 2026-09-07 카메라 시간 히스토리·PTZ 복구 배포

- 시간 중심 카메라 히스토리 구현 SHA: `916d9b4fd2c0fe1f13469fdd08338839618e0cdf`
- resource pin 릴리스: `a750061`
- 활성 소리 이벤트 엔티티 후속 수정: `67f9d72` 이후 entity registry canonical 마이그레이션으로 원래 ID를 복원했다.
- HA resource ID `645f25c65a1c4da0be1962ffa526157d`:
  - `https://cdn.jsdelivr.net/gh/jaeryun/ha-design@916d9b4fd2c0fe1f13469fdd08338839618e0cdf/www/ha-design/ha-design-camera-card.js?v=camera-time-history-20260906-2`
- 기존 31일 이벤트 달력과 이벤트별 70초 고정 클립을 최근 7일 시간 중심 탐색으로 교체했다.
  - Frigate `recordings/summary`와 `recordings/get` WebSocket 응답으로 날짜·세그먼트·정확한 녹화 공백을 구성한다.
  - 이벤트와 녹화 범위는 하나의 타임라인 프레임·절대 시간축·line-only playhead를 공유한다.
  - 이벤트 표시는 버튼이 아니며, 5분 활동 구간화 후 화면 폭에 따른 충돌 군집화를 적용한다.
  - 녹화 있음·공백·확인 불가·조회 실패·미래를 구분하고, 미래 구간에는 guide나 반복 무늬를 표시하지 않는다.
  - 절대 시각 선택은 해당 시간의 bounded Frigate VOD를 불러오고 실제 세그먼트 길이를 합산한 media offset으로 이동한다.
  - 날짜 조회 중 새 pointer·keyboard·event seek가 발생해도 조회 완료가 최신 사용자 선택을 덮어쓰지 않는다.
  - 같은 video 노드가 재로딩돼도 마지막 유효 offset을 복원하고 reset 시각 `0`을 재생 진행으로 전달하지 않는다.
- 메인 카메라 Tapo 재등록으로 생긴 PTZ 엔티티 드리프트를 수정했다.
  - Tapo 기기명이 `카메라1`에서 `거실카메라`로 바뀌며 새 unique ID가 생성돼 활성 엔티티 77개에 `_2`가 붙은 원인을 확인했다.
  - 구형 restored/unavailable 엔티티를 임시 legacy ID로 옮기고, 신규 unique ID 엔티티 77개를 기존 canonical ID로 변경했다.
  - Tapo config entry 재로드 후 `_2`가 재생성되지 않고 canonical 상태가 유지됨을 확인한 뒤 구형 legacy registry 항목 77개를 제거했다.
  - 이동 각도와 네 방향은 원래 canonical ID를 사용한다.
  - 실제 UI에서 `15°`, 네 방향 활성화와 up/down/left/right `button.press`를 확인하고 상쇄 순서로 위치를 복원했다.
  - 각도 상태가 비정상이면 `NaN°` 대신 `—°`를 표시하고 각도 증감 버튼을 비활성화한다.
  - 소리 이벤트는 canonical `binary_sensor.geosil_geosilkamera_noise`를 사용한다.
- 실제 HA 검증:
  - 데스크톱: 최근 7일, 실제 세그먼트 349개, `HA-HLS-PLAYER`, `1920×1080`, `readyState=4`, 오류 없음
  - 실제 선택 시각 `1788708543.998476`과 타임라인 target이 일치하고, media offset `1745.468476`으로 이동
  - 393px: 실제 세그먼트 357개, 모바일 축 `00·06·12·18·24`, 이벤트·녹화 간격 `4px`, `1920×1080`, `readyState=4`
  - 데스크톱·393px 모두 문서와 dialog 가로 overflow `0`
  - CDN 본체와 새 recording player를 포함한 `camera-time-history-20260906-2` 하위 모듈을 실제 로드했다.
- 전체 `tools/*test.mjs`, 375·768·1280px browser matrix, native/HA HLS, LSP diagnostics, `git diff --check`가 PASS다.

## 2026-09-26 과거 영상 독립 조회와 DVR 탐색 재구성 (배포 전 기록)

배포 전 구현 검증 기록이다. 실제 배포와 실서버 QA는 2026-09-27 항목이 가진다.

- 후보 라이브러리 차용 검토(구현 전):
  - `dermotduffy/advanced-camera-card` v8.1.0 — 1170 star, MIT, 활성 유지. 그러나 로케일이 en/ca/de/fr/it/pl/pt-BR/pt-PT/sk 9개로 **한국어가 없고**, release가 해시된 다중 chunk 디렉터리(entry는 `export * from './card-CQqYRFuj.js'` 36바이트)라 git tag에 `dist/`가 없어 이 저장소의 jsDelivr 단일 URL pin 규약을 쓸 수 없다. 카메라 한 화면 전체를 대체하는 카드이며 `shared` 479KB + `timeline-core` 760KB를 포함한다. timeline은 `show_recordings`가 "어느 시간에 녹화가 있는지"만 표시하는 이벤트 중심 축이다.
  - `Blueion76/sightline-for-frigate` — 27 star이고 **license가 없어** 채택 불가.
  - 결론: 전체 채택은 한국어·디자인·배포 규약을 깨므로 하지 않는다. ACC가 실제로 더 나은 지점인 "카메라 entity에 `client_id`가 없으면 사용자가 직접 지정한다"는 접근만 우리 config로 가져왔다.
- 실시간 연결과 독립된 과거 영상:
  - 실서버 확인: `camera.c120`이 `unavailable`이면 attribute가 `device_class`·`entity_picture`·`friendly_name`·`supported_features` 4개뿐이고 `client_id`/`camera_name`이 사라진다. 기존 코드는 이 attribute에만 의존해 과거 영상이 영구 `확인 불가`였다.
  - `frigate_client_id`/`frigate_camera_name` config를 출처로 추가하고, attribute가 사라지면 같은 `camera_entity`에서 마지막으로 본 값을 재사용한다.
  - 실서버 확인(2026-09-26): `camera.c120 = unavailable` 상태에서 `frigate/recordings/summary`(기록 있는 날짜 있음)와 `recordings/get`(하루 205 segment), `auth/sign_path` 후 `master.m3u8` HTTP `200`, `2560×1440`, `avc1.640032`. main_camera는 같은 방식으로 283 segment, `1920×1080`, `avc1.640028`.
  - Chromium fixture `?unavailable-config`에서 entity `unavailable` + config 지정 조합이 실제로 day query를 보내고 `coverageStatus=ready`, recorded segment 3개, player 생성, live player 미생성을 확인했다.
- 진입 구조와 DVR 탐색:
  - `과거 이벤트 보기` 버튼을 이벤트 section 하위에서 제거하고, sticky header의 `실시간`/`과거 영상` 상단 메뉴(`aria-pressed`)로 옮겼다. `data-view`도 `history`로 정리했다.
  - `이전 녹화`/`다음 녹화`를 gap/오류 상태 전용에서 상태 무관 상시 노출로 바꿨다.
  - timeline drag: 문지르는 동안에는 playhead·시각·slider ARIA만 갱신하고 VOD를 요청하지 않으며, 놓을 때 master/child 1쌍만 서명한다(browser evidence: `drag preview must not load media`, 놓을 때 `+2`).
  - 날짜를 열 때 첫 녹화 구간이 아니라 기준 시각에 가장 가까운 녹화로 들어가고, 구간 끝에서 60초를 남긴다. fixture에서 06–07시와 11:30–12:30 구간, 기준 13시일 때 `12:00:00`을 선택함을 확인했다.
  - 이벤트 표시는 녹화 범위보다 가볍게 조정했다(dot 6→5px, cluster 20→16px). 4px lane 간격, square-ended 구간, 축·guide 좌표는 그대로다.
  - camera entity가 `unavailable`이면 상세 실시간 프레임이 `카메라에 연결할 수 없습니다`를 표시하고 toolbar 부제가 `연결 끊김`이 된다.
- 검증: `tools/*test.mjs` 전체 PASS, Chromium 375/768/1280에서 4px 간격·`event-panel button 0`·square·overflow 0 유지, offline-config 시나리오 PASS, `node --check`, `git diff --check` PASS. LSP는 이 저장소에 JS language server가 없어 실행할 수 없다.
- 배포 대기: 구현 commit과 resource pin 갱신, 실제 HA UI QA는 승인 후 진행한다.

## 2026-09-27 과거 영상 DVR 카드 배포와 실서버 QA

- 배포 revision chain
  - 구현: `cae69f5bfe2196b645a028e4c9bc5a19e940ee8e` — 실시간 연결과 분리된 과거 영상, 상단 `실시간`/`과거 영상` 메뉴, 드래그 스크럽
  - pin: `446f50d` (`chore(release): repin camera resource to cae69f5`)
  - live resource ID `645f25c65a1c4da0be1962ffa526157d` 유지, URL을 `@cae69f5…/ha-design-camera-card.js?v=camera-history-dvr-20260926-1`로 교체
  - 같은 배포에서 세 dashboard 사본과 live storage config 두 카드에 `frigate_client_id: frigate`, `frigate_camera_name: main_camera`/`c120`를 저장했다
  - 그 사이 중간 revision(`31d8214`, `a8c2559`, `e7a7276`)도 push했으나 최종 live pin은 `cae69f5`다
- 배포 전 발견과 수정
  - `events.js`·`recording-player.js`는 이번 릴리스에서 변경되지 않았는데 importer에 따라 새 key와 이전 key가 섞여 **같은 파일을 두 번 내려받았다**. 모듈별 실제 revision key로 통일하고, 배포 테스트에 "한 모듈은 한 cache key로만 참조한다" 검사를 추가했다.
  - 실서버 드래그에서 **미리보기가 되돌아가는 실제 결함**을 발견했다. 드래그 중에는 playhead만 옮기지만, 아직 재생 중인 이전 구간의 `timeupdate`가 `playbackTime()`을 통해 `selectedTime`을 덮어써 6시에서 18시로 끌어도 6시로 돌아갔다. fixture의 fake player는 필요할 때만 이벤트를 내보내 이 결함이 드러나지 않았다. 드래그 중 media timeupdate를 무시하도록 수정하고 browser contract에 회귀 검사를 추가했다(수정 전 FAIL, 수정 후 PASS를 실제로 확인).
- 배포 후 실서버 QA (`ha.jrlee.kr`, Chromium desktop)
  - 현재 revision 모듈 17개 로드, 같은 revision 안 중복 로드 0 (`performance` resource 기준)
  - sticky header에 `실시간`/`과거 영상` 메뉴(`aria-pressed`), `data-action="events"` 없음
  - **아기 카메라(`camera.c120` = `unavailable`)** 에서 `과거 영상` → 2026-09-22: segment 5,320개, recorded 표시 2,815개, `recording.status=ready`, `HA-HLS-PLAYER` `readyState=4`, `2560×1440`, `currentTime 3203.9s` 재생 중. 이전 배포에서는 이 화면이 영구 `확인 불가`였고 video 요소도 생성되지 않았다.
  - 거실 카메라 `과거 영상`: 오늘 segment 4,655개, recorded 표시 2,951개, `HA-HLS-PLAYER` `readyState=4`, `1920×1080`, duration `3598.2s`
  - 드래그: 6시에서 15시로 끄는 동안 playhead `50%→63.91%`, 라벨 `15:20:18`, 문지르는 동안 m3u8 요청 증가 0. 녹화 구간에서 놓으면 master/child 1쌍만 추가 로드(`readyState=4`, `currentTime 729.9s`), 공백 구간에서 놓으면 로드 없이 gap 상태를 유지한다.
  - live WebRTC: 거실 카메라 실시간 프레임은 배포 후에도 `HD · 내부망 연결`이고 player가 생성된다. 아기 카메라는 `카메라에 연결할 수 없습니다`와 `연결 끊김`을 표시한다.
- LSP: 사용자 config `~/.omp/agent/lsp.json`에 `typescript-language-server`의 `rootMarkers`(`package.json`/`tsconfig.json`/`jsconfig.json`/`.git`)를 추가해 이 저장소처럼 package.json이 없는 프로젝트에서도 서버가 뜨게 했다. 변경한 카메라 모듈 16개와 테스트 6개, dashboard yaml에서 diagnostics 0이다.
- 롤백 기준: 이전 resource URL은 `@916d9b4fd2c0fe1f13469fdd08338839618e0cdf/…?v=camera-time-history-20260906-2`이고 resource ID는 그대로다. live storage config는 두 카드에서 `frigate_client_id`/`frigate_camera_name`만 제거하면 이전 동작으로 돌아간다. Frigate 설정은 이 작업에서 변경하지 않았다.
- 남은 확인: iPhone/iPad 실제 HA app WebKit에서 새 과거 영상 화면과 드래그를 확인해야 한다(`docs/contracts/camera.md` 실기기 QA 5번).
- 이 항목의 문서 변경(`docs/contracts/camera.md`, `DESIGN.md`, 이 문서)은 사용자의 진행 중인 docs 재편과 같은 파일에 있어 commit하지 않았고 작업 트리에 남아 있다. 배포된 구현·테스트·dashboard·resource pin은 모두 commit/push되었다.

## 2026-09-27 이전/다음 녹화 기준을 3분 녹화 블록으로 변경

- 문제: 버튼 기준이 정확한 Frigate segment 경계여서, 모션 녹화의 약 10초 segment와 1초 미만 경계 오차 때문에 하루가 수천 조각으로 남았다. 실측(거실카메라 09-21~27) 하루 구간 수 `4112/3821/3389/3121/2336/1562/3085` → 버튼이 10~50초씩만 이동했다.
- 실측 시뮬레이션(7일 × 2카메라, 실제 segment): 허용 오차별 하루 블록 수 평균 — 거실 `0초 3,061 / 1분 31 / 3분 18 / 5분 14 / 10분 1.3`, 아기(데이터 2일) `0초 2,597 / 1분 21 / 3분 5 / 5분 3.5 / 10분 1`. 5분 이상은 블록 하나가 20시간 이상을 덮는 날이 생겨(09-21 p90 20.4시간) 이동이 하루 단위가 된다.
- 결정: 사용자가 **3분**을 선택했다.
- 구현: `ha-design-camera-recording.js`에 `RECORDING_BLOCK_GAP = 180`과 `cameraRecordingBlocks(segments, day, tolerance)`를 추가하고, `cameraStateNeighbour`가 coverage가 아니라 블록 사이를 이동하게 바꿨다. 착지는 `다음`=블록 시작, `이전`=블록 끝 1초 전, 현재 선택이 속한 블록은 제외, 선택 날짜 밖으로 이동하지 않는다.
- 회귀 방지: coverage·gap 표시·VOD offset은 **원본 segment 그대로**다. 3분 이하 공백도 `녹화 없음`으로 남고, 재생은 실제 segment 안에서만 시작한다(병합 구간 안을 선택해도 error 상태가 생기지 않는다).
- 배포: 구현 `6ef052625580698032af255c7fabe7a5670ae77d`, pin `7b5e08a`, resource ID 유지, entry cache key `camera-block-nav-20260927-1`, CDN entry+child HTTP 200.
- 실서버 QA(2026-09-27, 거실카메라): segment `5,003` → **블록 8개**(시뮬레이션과 일치), 블록 경계 `00:00:01–04:42:10`, `04:46:11–04:46:20`, `04:50:51–04:52:12`, `04:55:32–05:14:12`, `05:17:42–05:26:30`, `05:31:01–05:43:32`, `05:47:13–13:22:32`, `13:28:42–16:11:41`. `다음 녹화`는 마지막 블록에서 disabled, `이전 녹화`는 `13:22:31 → 05:43:31 → 05:26:29 → 05:14:11`로 이동했고 모두 `recording.status=ready`(실제 영상 위 착지)였다.
- coverage는 그대로 정확하다: 같은 화면에서 recorded span `3,117`개, gap span `3,118`개가 유지된다(블록은 이동 기준에만 적용).
- 아기카메라(오늘 0 segment)는 이전/다음 모두 disabled다.
- 검증: 블록 병합(≤180초)·분리(>180초)·날짜 클립, 같은 블록 안에서 다음 segment로 이동하지 않음, 공백 위 기준점을 테스트로 고정했다. `tools/*test.mjs` 전체 PASS, `node --check`, LSP diagnostics 0.

## 2026-09-27 표시 띠 렌더링과 지금 라벨 충돌 수정

사용자가 띠 화면을 보고 이상하다고 지적해 실측한 결과 3가지가 확인됐다(2026-09-27, 거실카메라, plot 554px).

- **줄무늬**: `.coverage-segment`가 `6,259`개(recorded `3,128`, gap `3,129`) 그려지고 그중 `6,241`개가 1px 미만이었다. 모션 녹화의 약 10초 segment 사이 1초 미만 경계 오차가 그대로 조각으로 그려져 앞부분이 줄무늬로 보였다.
- **지금 라벨 충돌**: `.now-boundary i`("지금") 중심 x=`810`, 16시 눈금 라벨 중심 x=`806` — 완전히 겹쳤다.
- **playhead 가림**: playhead `z-index 4` < visual cluster `5`라 이벤트 군집 배지가 현재 위치 선을 덮었다.

수정:
- `cameraRecordingCoverage()`에 `mergeGap` 인자를 추가하고, 표시용 `cameraStateTape()`가 `RECORDING_BLOCK_GAP`(3분)으로 병합한 결과를 띠와 날짜 요약에 쓴다. 상태 판정·gap 문구·VOD offset은 정확한 segment를 그대로 쓴다.
- "지금"과 1시간 이내에 걸리는 시간 눈금 **라벨**만 감춘다(guide 선은 유지).
- playhead `z-index`를 6으로 올려 군집 위에 그린다.

실서버 확인(같은 화면): span `8 recorded + 9 gap + 1 unknown + 1 future = 19`개, 1px 미만 `5/19`, 축 라벨 `0·4·8·12·20·24`(16 감춤), "지금"과 가장 가까운 눈금 라벨 간격 `84px`, `z-index` playhead `6` > cluster `5`.

배포: 구현 `e623746d934d4851d7635b8b224d2a1f8f4d5a05`, pin `3ef6a0c`, entry cache key `camera-tape-20260927-1`. 테스트: `cameraRecordingCoverage` 병합/정확 분기, 렌더된 띠 span 수, 눈금 라벨 감춤/유지, 브라우저에서 "지금"과 눈금 라벨 간격 `>=16px`를 고정했다. `tools/*test.mjs` PASS, `node --check`, LSP diagnostics 0.

알려진 한계(의도): 띠는 3분 이하 공백을 병합해 그리지만, 그 지점을 정확히 선택하면 상태는 정확한 segment 기준이라 `녹화 없음`과 이동 버튼이 뜬다. 24시간 띠에서 1초 공백은 0.006px라 사실상 클릭되지 않는다.

## 2026-09-27 오늘 과거 영상 시작 지점을 라이브 끝으로 변경

- 문제: 날짜 기준 시각이 `min(현지 정오, 현재)`라서, 오후에 `오늘`을 열면 최신 영상이 몇 시간 뒤에 있어도 항상 **정오**에서 시작했다(실제로 16:21에 열어도 12:00:00이 선택됐다).
- 변경: 기준 시각을 **오늘이면 현재(라이브 끝), 지난 날짜면 현지 정오**로 정한다. 기존 "가장 가까운 블록 + 끝 60초 여유" 규칙이 그대로 적용돼 라이브 끝 1분 전에서 시작한다.
- 실서버 확인(2026-09-27, 거실카메라): 오늘 → 현재 `16:34:25`, 선택 `16:33:41`(**44초 전**), `recording.status=ready`, player 생성. 지난 날짜(09-25) → 선택 `11:59:55`(정오 기준, 블록 끝 60초 여유로 5초 앞당김).
- 테스트: pending day query 중 사용자 입력이 우선한다는 케이스가 정오 기준 절대값을 기대하고 있어, 시드를 캡처해 `시드-60초`로 검증하도록 일반화하고 라이브 끝 시간대의 fixture segment를 추가했다. 오늘/지난 날짜 시드를 각각 고정하는 케이스도 추가했다.
- 배포: 구현 `c5508ddbc8217b9e0fd2498de2f5e2094c1ca562`, pin `5cdcc5c`, entry cache key `camera-edge-20260927-1`. `tools/*test.mjs` PASS, `node --check`, LSP diagnostics 0. (CDN 최초 요청 1건이 503이었고 재시도에서 200 — jsDelivr 콜드 캐시였다.)

## 2026-09-27 채워진 구간을 눌러도 영상이 나오지 않던 문제 수정

- 신고: 띠에서 채워진 구간을 눌렀는데 `녹화 없음 / 09:15:16–09:16:06에는 저장된 영상이 없어요.`가 떴다(2026-09-24 09:15).
- 원인: 띠는 3분 이하 공백을 병합한 **블록**으로 그리는데, media 상태와 gap 문구는 **정확한 segment** 기준이었다. 그 결과 50초짜리 구멍이 채워진 구간으로 보이지만 선택하면 gap으로 판정됐다. 앞선 기록에서 "1초 공백은 0.006px라 사실상 클릭되지 않는다"고 본 판단이 틀렸다(실제로 50~70초 구멍이 여러 곳 있다).
- 수정: `cameraStateInterval()`과 media 상태가 띠와 같은 3분 블록을 쓰고, 블록 안의 구멍을 선택하면 `cameraRecordingSnap()`이 가장 가까운 실제 segment로 붙인다. VOD window·offset은 정확한 segment 그대로다. 3분을 넘는 공백만 `녹화 없음`이다.
- 실서버 확인(2026-09-24, 6,080 segment):
  - 신고 지점 `09:15:30` → `09:15:15`로 스냅(구멍 직전 마지막 프레임), `data-state=recorded`, `recording.status=ready`, `HA-HLS-PLAYER` `readyState=4`, `1920×1080`, `currentTime 691.4s` 재생 중
  - 병합 구멍(70초, 00:07:29) → `00:08:05`로 스냅, `recorded`/`ready`, player 생성
  - 실제 공백(530초, 02:26:30) → 스냅 없음, `data-state=gap`, `recording.status=idle`, player 없음(정직한 `녹화 없음` 유지)
- 테스트: `cameraRecordingSnap` 경계 3종(영상 위/구멍 앞/구멍 뒤), 3분 이하 구멍은 `recorded`·초과 공백은 `gap`, 컨트롤러 `seek`가 구멍에서 가장 가까운 영상으로 붙어 `ready`가 되는 케이스, interaction fixture에서 100초 구멍 선택이 player를 만드는 케이스를 고정했다.
- 배포: 구현 `168b802d8b9bc50f95baa5e42158a209596e16a0`, pin `03fd349`, entry cache key `camera-snap-20260927-1`. `tools/*test.mjs` PASS, `node --check`, LSP diagnostics 0.

## 2026-09-27 timeline 입력을 녹화 지점으로만 해석

- 신고: (1) 영상이 없는 구간을 누르면 `녹화 없음` 문구가 뜨는데 그 문구를 보려고 클릭하는 사람은 없다, (2) 짧은 녹화 구간은 터치 영역이 좁아 주변 공백을 잘못 선택한다.
- 변경: `seek()`이 입력 시각을 **항상 가장 가까운 실제 segment로 스냅**한다(이전에는 병합 블록 안의 구멍만 스냅). 그래서 공백은 선택 대상이 아니고, 짧은 녹화는 양옆 공백 전체가 터치 영역이 된다. `녹화 없음`은 녹화가 전혀 없는 날짜와 조회 상태(미확인·실패)에만 남는다.
- 실서버 확인(2026-09-24, 6,080 segment, 블록 25개):
  - 신고한 520초 공백(03:02:16–03:10:56) 중앙 `03:06:36` 클릭 → `03:10:54`로 스냅(+258초), `recorded`, `ready`
  - 70초 블록(02:20:55–02:22:05, 앞 공백 290초·뒤 공백 530초): 앞 공백 안 `02:20:25` 클릭 → 블록 시작 `02:20:55`, 뒤 공백 안 `02:22:35` 클릭 → 블록 끝 `02:22:04` — 둘 다 `recorded`, `ready`
  - 공백 안 릴리즈 위치 `03:03:56` → `03:02:15`로 스냅(-101초), `recorded`, `ready`
- 테스트: 짧은 블록(10초) 양옆 공백 30분 지점이 그 블록으로 붙는 케이스, 실제 공백 입력이 공백 상태로 남지 않고 `recorded`가 되는 컨트롤러 케이스, 미확인 구간 문구·재시도 유지 케이스를 고정했다. browser contract에서 8.5시간 공백 클릭이 9시로 붙고 미확인 구간 클릭이 마지막 프레임으로 붙는 것을 확인한다.
- 배포: 구현 `9f2d09bad92d320dadf772a05282e797004fdd55`, pin `4645cf1`, entry cache key `camera-footage-only-20260927-1`. `tools/*test.mjs` PASS, `node --check`, LSP diagnostics 0.

## 2026-10-11 녹화 보관과 Tapo 감지 책임 분리

- 사용자 승인: Frigate는 녹화·보관, Tapo 감지는 탐색 보조, Tapo는 기기 제어를 담당하는 역할 분리형을 적용했다.
- NAS Frigate 0.17.2:
  - `/config/config.yaml`의 `main_camera`와 `c120`에 `record.continuous.days: 3`, `detect.enabled: false`를 추가했다. 기존 `record.motion.days: 10`, 입력 스트림, MQTT, 카메라 설정은 유지했다.
  - 설치된 `/api/config/set`의 schema 검증을 거쳤고, 저장 후 YAML을 이전 설정과 비교해 위 네 leaf 외 변경이 없음을 확인했다. `/api/restart`로 적용했다.
  - 원본 백업은 NAS `/mnt/SSD_R0/apps/frigate/config/config.before-continuous-20261011-103440.yaml`이며 권한은 `0600`이다. 롤백은 백업 설정을 Frigate 설정 저장 API로 검증·복원한 뒤 재시작한다.
  - 재시작 후 `/api/config`: 두 카메라 모두 continuous `3`, motion `10`, detect `false`, motion.enabled `true`, audio `false`. uptime 431초 시점 거실 camera FPS `5.1`, 아기 `0.0`; 아기 전원은 조작하지 않았다.
  - 재시작 후 거실 녹화 42개를 확인했다. 관측 구간에는 모두 움직임이 있어 무모션 녹화 실측 증거는 없다. 설치된 `SegmentInfo.should_discard_segment`를 직접 실행해 motion=objects=regions=dBFS=0 입력을 기존 motion 모드에서는 폐기하고 continuous가 선택하는 all 모드에서는 유지함을 확인했다.
  - 새 정책은 적용 이후 영상에 유효하다. 이미 삭제된 과거 공백이나 카메라 연결 중단 구간은 복구하지 않는다. 두 보관 기간은 촬영 시점 기준이며 합산 13일이 아니다.
- 카드:
  - `Tapo 감지 이력`과 `Frigate 저장 영상` 범례를 추가하고, 감지가 영상 저장을 보장하지 않음을 표시했다. 감도 제어가 Tapo 자체 설정임을 명시했다.
  - 감지 선택의 원래 시각을 `selectedEventTime`에 유지한다. 가까운 녹화로 스냅하거나 재생이 진행돼도 감지 시각은 변하지 않는다. 일반 녹화 탐색과 날짜 변경은 감지 선택을 해제한다.
  - 해당 감지 시각의 영상 유무는 병합 표시 블록이 아닌 실제 segment coverage로 판단한다. 영상이 없으면 원래 감지 시각과 가까운 녹화로 이동했음을 함께 알린다. 기존 녹화 스냅·드래그·3분 블록 이동은 유지한다.
  - 수정 전 fixture에서 08:30 감지 → 09:00 영상으로 이동했지만 `사람 1`만 표시됨을 재현했다. 수정 후 동일 입력은 감지 기준 `08:30:00`, 해당 시각 녹화 없음, 가까운 녹화 이동을 표시하며 실제 선택은 09:00이다.
- 배포:
  - 구현 `b60cd5ca77d45dc548b9b84bc9507986df8722cf`, resource pin commit `c69d49e`; origin/main에 push했다.
  - 기존 HA resource ID를 유지하고 `camera-responsibilities-20261011-1`로 변경했다. CDN 재귀 module 17개가 모두 HTTP 200이며 작업 트리 파일과 byte 단위로 일치했다.
  - 이전 resource revision은 `9f2d09bad92d320dadf772a05282e797004fdd55`, cache key는 `camera-footage-only-20260927-1`이다. Dashboard entity와 storage config는 변경하지 않았다.
- 검증:
  - camera Node 게이트 5개, Chromium browser matrix 375/768/1280px의 HA/native HLS 모두 PASS. 감지 시각/재생 시각 분리, 작은 병합 공백, 무녹화·조회 실패·로딩, 날짜 변경, pending query 중 event 선택을 검증했다.
  - 옛 cache key와 정확한 문구만 고정하던 테스트는 새 값으로 다시 고정하지 않고 제거했다. source syntax와 camera module LSP diagnostics도 통과했다.
  - 실제 HA desktop: 새 source 범례와 보관 정책 표시, 거실 segment 3,435개, `recording=ready`, video `readyState=4`, `1920×1080` 재생을 확인했다.
  - 실제 Tapo 감지 marker 기준 `00:38:53`, 사람 7건, 해당 시각 녹화 있음 표시와 실제 `1920×1080` 영상 재생을 확인했다.
  - 아기 camera entity가 `unavailable`인 상태에서도 오늘 segment 1,916개를 조회하고 recorded/player 표면을 생성했다. 전원이나 Tapo 제어는 변경하지 않았다.
  - 실제 iPhone/iPad HA app 검증은 하지 않았다. 반응형 증거는 Chromium fixture이며 실기기 WebKit 검증을 대체하지 않는다.
- `docs/contracts/camera.md`, `DESIGN.md`, 이 문서를 갱신했다. 세 문서는 기존 사용자 문서 재편과 함께 작업 트리에 남겼으며, 해당 재편 전체를 이번 source/resource commit에 포함하지 않았다.

## 2026-10-11 Tapo 감지 종료와 Frigate 움직임 구간 전환

- 사용자 요청: 상세 감지 종류는 필요 없으며 Tapo 감지를 끄고 Frigate 모션으로 통일한다.
- 기기:
  - C225 감지 select 9종 모두 `off`로 readback했다. 실제 변경은 사람·아기 울음 `normal → off`이며 나머지 7종은 이미 OFF였다.
  - privacy `off`, 이동 각도 `15.0`, auto_track `off`, Frigate recordings `on`을 유지했다. 영상 전송·수동 PTZ·카메라 전원은 조작하지 않았다.
  - C120 select 8종은 모두 `unavailable`이다. 실제 카메라에 OFF 명령을 보낼 수 없어 HA에 일회성 자동화 `automation.ha_design_c120_detection_shutdown`을 등록했다. 설정 ID는 `ha_design_c120_disable_tapo_detection_20261011`이다.
  - 자동화는 HA 시작 또는 대상 select 상태 변경 시 사용 가능한 감지를 끄며, 8종 모두 OFF로 확인되면 자신을 비활성화한다. 오프라인 실행 trace `80e944f9dd3c851016fb981a0f275bde`는 `script_execution=finished`, current `0`이고 자동화는 `on`으로 대기 중이다. C120 실제 OFF 확인은 재연결까지 미완료다.
- 카드와 데이터:
  - HA `frigate/recordings/get`의 실제 응답에 `motion`이 있음을 확인했다. Tapo sensor history 조회·최근 감지 목록·감도 select·자동 추적 UI 및 관련 config를 제거했다.
  - 이미 조회하는 녹화 segment에서 `motion > 0`을 시간 구간으로 만든다. 녹화와 통계가 이어지는 범위에서 30초 이하 조용한 간격을 병합하며, 녹화 공백과 통계 누락은 합치지 않는다.
  - `motion=0`인 연속 녹화는 재생 가능하지만 움직임의 근거로 쓰지 않는다. 통계 누락 안내도 녹화 재생을 막지 않는다.
  - 타임라인은 `Frigate 움직임`/`저장 영상`의 두 lane이며, 개별 감지 건수·군집 숫자·사람/소리 분류를 제거했다. 키보드 Enter와 motion lane 입력으로 구간 안의 영상을 탐색한다.
  - 세 dashboard 사본과 live camera view에서 폐기한 entity 설정 24개를 제거했다. PTZ·privacy·recording·Frigate source config와 다른 view는 보존했다. registry snapshot에는 제거된 감지 entity를 `camera-detection-delegated-to-frigate`로 분류했다.
- 배포:
  - 구현 `80dd27fbbc79b50d05cfa704b9b57f1a37fe5102`, pin `6100435`, cache key `camera-frigate-motion-20261011-1`; origin/main push 및 기존 HA resource ID 갱신을 완료했다.
  - CDN module 17개가 HTTP 200이고 로컬 파일과 byte 단위로 일치했다. 실제 HA에서도 새 revision module 17개를 로드했다.
  - 롤백 baseline은 `/tmp/ha-camera-motion-baseline.json`에 이전 resource와 dashboard config를 저장했다. UI 롤백은 이전 resource(`b60cd5c…`, `camera-responsibilities-20261011-1`)와 이전 camera view를 함께 복원해야 한다. 다른 view의 이후 변경을 덮어쓰지 않는다.
- 검증:
  - camera Node 게이트 5개, non-light feature coverage, 375/768/1280px browser matrix와 HA/native HLS interaction이 PASS다. 모션 0/누락/양수, 30초 경계, 녹화 공백·unknown 통계의 병합 차단, 날짜·조회 시각 clipping, 입력·seek·cancellation을 검증했다.
  - 변경 source 12개의 `node --check`와 camera module LSP diagnostics가 통과했다.
  - 실제 HA 거실: segment 3,660개 중 모션 3,658개, 무모션 2개, 움직임 구간 281개. 이 구간 수는 내부 데이터이며 감지 건수로 표시하지 않는다.
  - 실제 키보드 Enter 입력으로 `10:52:09–11:16:29` 움직임 구간을 선택하고 VOD `readyState=4`, `1920×1080` 재생을 확인했다. 감지 숫자 요소 0개, desktop overflow 0이다.
  - 아기 entity `unavailable` 상태에서도 segment 1,916개·움직임 구간 148개를 조회하고 recording `ready`를 확인했다.
  - Frigate 설정은 continuous 3일 / motion 10일 / 객체·오디오 감지 OFF / 모션 ON을 유지한다. 최종 거실 FPS `5.1`, 아기 FPS `0.0`이다. 객체 추론을 새로 켜지 않았다.
  - 실제 iPhone/iPad WebKit은 미검증이며, 모바일 증거는 Chromium fixture다.
- 기존 사용자 문서 재편은 별도 작업 트리로 보존했다. `docs/contracts/camera.md`, `DESIGN.md`, 이 문서에는 새 계약과 C120 재연결 대기 상태를 기록했다.

## 2026-10-11 과거 영상 MP4 다운로드 배포

- 과거 영상 아래 `영상 다운로드` 버튼과 중첩 native 범위 선택 dialog를 추가했다. 움직임 구간 또는 현재 재생 위치를 기본값으로 하고, HA timezone 기준 시작·종료 날짜/초를 수정할 수 있다.
- `CameraDownloadController`는 범위 확인·서명 준비·요청 상태를 관리한다. 최근 7일 밖·미래·역전·무녹화 범위는 거부한다. DST 누락·중복 시각, 날짜 경계, 겹치는 segment, 편집 중 HA/video 갱신, 닫기·날짜/config 변경 중 늦은 응답, 서명 만료를 처리한다.
- 설치된 Frigate 0.17.2의 `recording_clip`과 HA Frigate `RecordingProxyView`를 확인하고 실제 경로를 실행했다. HA `/api/frigate/{instance}/recording/{camera}/start/{start}/end/{end}`를 600초 서명하고, 브라우저의 native download로 MP4를 직접 스트리밍한다. 전체 파일을 카드 메모리에 모으거나 영구 export를 만들지 않는다.
- 준비 완료는 구간과 서명 링크 확인을 뜻한다. MP4 생성·저장은 다운로드 클릭 후 브라우저가 수행한다. 카드에는 `requested`만 표시하며 저장 완료·서버 스트림 실패·취소 상태를 추정하지 않는다.
- 최초 배포의 새 창 target은 Aside에서 다운로드 이벤트를 원래 페이지가 받지 못했다. 동일 화면에서 target을 제거했을 때 저장이 완료되는 것을 확인한 뒤, 새 창을 지정하지 않는 native download 링크로 수정·재배포했다.
- 최종 배포: 구현 `aa025e6d47b1c923c9842c294885f9819578496c`, pin `f0b4196`, entry cache key `camera-download-20261011-2`. 최초 구현은 `8a629b7`이다. origin/main push와 기존 HA resource ID 갱신을 완료했다.
- CDN entry와 재귀 child 19개가 모두 HTTP 200이고 로컬 소스와 byte 단위로 일치했다. Dashboard config, 카메라 설정, Frigate 보관 정책은 변경하지 않았다.
- 실제 HA 다운로드:
  - 거실 `2026-10-11 00:01:20–00:02:10`을 UI에서 입력했다. 선택 범위 50초 중 녹화 `19.989초`, 공백 `30.011초`를 준비 화면에 안내했다.
  - native download로 `거실 카메라_2026-10-11_000120-000210.mp4`, `1,548,287 bytes` 저장을 확인했다. 코드 주입이나 DOM 수정 없이 최종 배포본을 사용한 결과다.
  - 완성 파일을 ffprobe로 검사했다: H.264 `1920×1080`, 영상 500프레임, AAC 음성, 길이 `20.114125초`. C225 원본의 SEI metadata 경고는 stream-copy 파일에도 남지만 프레임을 읽을 수 있었다.
  - 저장 파일 자체를 Chromium에서 열어 `readyState=4`, `paused=false`, `error=null`, `1920×1080`, `20.114125초` 실제 재생을 확인했다.
  - NAS export DB 행은 전후 모두 `0`이고, 완료한 다운로드의 임시 concat playlist는 남지 않았다.
- 자동 검증: 새 `camera-download-test.mjs`와 기존 camera Node 게이트, 375/768/1280px browser matrix·HA/native HLS가 PASS다. browser 검증은 선택 움직임 기본값, 5분 공백 안내, 입력값 보존, 역전 범위 후 링크 제거, 중첩 Escape/초점 복원, 무녹화 버튼 비활성화를 포함한다. 변경 JS syntax와 camera module LSP diagnostics도 통과했다.
- 실제 desktop과 375px fixture의 다운로드 dialog에서 가로 overflow가 없음을 확인했다. 실제 iPhone/iPad HA app 파일 저장·공유는 미검증이다.
- 롤백은 기존 resource ID를 `80dd27fbbc79b50d05cfa704b9b57f1a37fe5102` / `camera-frigate-motion-20261011-1` URL로 복원하면 된다. 이번 변경은 dashboard config migration이 없다.
- `docs/contracts/camera.md`, `DESIGN.md`, 이 문서를 갱신했으며, 기존 사용자 문서 재편과 함께 작업 트리에 보존했다. 이전 C120 감지 종료 작업은 여전히 카메라 재연결 대기이고 일회성 자동화는 등록되어 있다.

## 2026-10-11 화면을 보며 드래그하는 영상 자르기

- 날짜 입력 중심의 다운로드 창을 독립 HLS 미리보기와 시작·끝 손잡이가 있는 편집 화면으로 바꿨다. 주변 시간축의 확대/축소·이동·맞춤, 시작/끝 화면 보기와 선택 구간 재생을 제공한다. 직접 시간 입력은 접힌 보조 기능이다.
- 기존 history와 preview가 같은 `loadCameraRecording()`과 media binding을 사용한다. 같은 1시간 VOD 안의 드래그는 manifest를 다시 만들지 않고 native video를 seek한다. 실제 decode 준비와 seek 완료를 확인한 프레임만 확정하며, 공백에서는 이전 영상을 가린다.
- 실제 브라우저는 paused seek에서도 `timeupdate`를 `seeked`보다 먼저 보낼 수 있었다. 최초 구현에서 재생 요청이 있어도 영상이 paused로 남는 문제를 발견했고, 실제 `video.paused` 상태와 재생 의도를 구분해 수정했다. fixture도 이 순서로 수정하여 회귀 검사에 포함했다.
- 실서버 검증:
  - 시작 손잡이를 잡은 상태에서 선택 `1791696690`, 표시 프레임 `1791696689.999999`, `readyState=4`, `1920×1080`을 확인했다.
  - 끝 손잡이를 잡은 상태에서 종료 `1791696695`, 끝 직전 프레임 `1791696694.95`를 확인했다. 두 영상 프레임의 실제 pixel hash가 달랐다.
  - 선택한 5초 구간의 재생 후 `playing=false`, native video `paused=true`, 표시 프레임이 종료 0.05초 전으로 돌아와 정지함을 확인했다.
  - `거실 카메라_2026-10-11_143130-143135.mp4`를 실제 저장했다(`616,337 bytes`, H.264 `1920×1080`, AAC, `6.122375초`). 기존 stream-copy 경로의 키프레임 여유 때문에 파일 길이는 정확한 5초가 아니며 이 제한을 UI에 계속 표시한다.
  - 실제 편집 화면에서 영상이 보이고 가로 overflow가 없음을 확인했다. 시간 라벨이 부동소수점 오차로 이전 초를 표시하지 않도록 밀리초 단위로 정규화했다.
- 자연스러운 media end와 선택 끝이 일치할 때 잘못된 gap 화면 대신 마지막 포함 프레임을 유지하는 경계 회귀를 추가했다. 수정 전 FAIL, 수정 후 PASS를 확인했다.
- 검증: camera Node 게이트, 375/768/1280px browser matrix, HA/native HLS preview, drag 중 프레임 갱신, 확대/맞춤, gap 처리, 구간 재생 정지, 날짜 입력 보존, Escape/종료 정리가 통과했다. JS syntax와 camera module LSP diagnostics도 통과했다. 실제 iPhone/iPad 실기기는 미검증이다.
- 최종 구현은 `04965076fdd90597dea49f44d33c206bbdc3601a`, entry key는 `camera-visual-trim-20261011-4`다. 최초 구현 `13c6f1c`, 재생 순서 보정 `44dec33`, 시간 라벨 보정 `2c470fa`를 포함한다. CDN 20개 module이 HTTP 200이고 작업 트리와 byte 단위로 일치했다.
- 롤백 기준은 이전 날짜 입력형 resource `aa025e6d47b1c923c9842c294885f9819578496c` / `camera-download-20261011-2`다. Dashboard config와 카메라/Frigate 설정은 변경하지 않았다. 기존 사용자 문서 재편은 작업 트리에 보존했다.

## 2026-10-11 사용자 재생 실패 신고와 운영 롤백

- 사용자가 “녹화영상이 하나도 안나온다”고 보고했다. 이전 desktop QA 결과로 사용자의 실패를 부정하거나 원인을 단정하지 않았다.
- 복구 우선으로 기존 resource ID를 유지한 채 `aa025e6d47b1c923c9842c294885f9819578496c`의 MP4 다운로드 버전으로 롤백했다. 새 entry key는 `camera-playback-recovery-20261011-1`이다. 드래그 편집은 운영에서 임시 철회했으며, 기본 과거 영상·Frigate 움직임 구간·기존 MP4 다운로드는 유지한다.
- NAS 확인: Frigate uptime `17874초`, main_camera FPS `5.0`, 최근 한 시간 main_camera 녹화 DB 행 `358개`였다. 녹화 파일·보관 정책·카메라 설정은 변경하지 않았다.
- 롤백 후 실제 HA desktop에서 거실 segment `5,243개`, coverage/recording `ready`, 영상 `readyState=4`, `1920×1080`, `error=null`을 확인했다. 명시적으로 재생을 시작한 뒤 `paused=false`, currentTime `2408.09초`와 실제 영상 화면을 확인했다.
- HA system log에는 Frigate upstream의 502/500 이력이 있었지만, 이번 신고와 연결되는 frontend stack은 없었다. 원인을 확정한 상태가 아니다.
- 사용자에게 실패 화면이 기본 과거 영상인지 자르기 미리보기인지, 사용 기기·앱이 무엇인지 요청했다. 접근 가능한 세션에는 해당 실패 화면이 열려 있지 않았다. 이 정보 없이 추정 수정이나 드래그 버전 재배포를 진행하지 않는다.

## 2026-10-11 임의 롤백 취소

- 사용자는 실패 위치가 일반 과거 영상 화면임을 명확히 했고, 증상 확인 전에 롤백한 뒤 사라진 문제 화면의 캡처를 요구한 대응을 지적했다.
- 임의 롤백을 취소하여 요청했던 `04965076fdd90597dea49f44d33c206bbdc3601a` / `camera-visual-trim-20261011-4`로 resource를 복원하고 HA readback으로 확인했다. 기능 수정이나 녹화/보관 설정 변경은 하지 않았다.
- 별도 진단 카드에서 해당 버전의 오늘·어제·10월 5일 조회와 master/child HTTP 200, desktop decoder 및 autoplay 진행을 확인했다. 이 결과는 사용자가 보고한 실패를 반박하거나 원인을 확정하는 증거가 아니다. 이전 502/500 로그는 Frigate 재시작 시점의 것이었다.
- 일반 과거 영상의 사용자 환경 실패 원인은 여전히 미확정이며, 원상복원을 해결 완료라고 보고하지 않는다. 캡처 요청은 철회했다.







## 2026-10-11 Tapo 감지와 Frigate 연속 녹화 분리

- 사용자 요청: 감지는 Tapo 자체 기능을 사용하고 Frigate는 단순 녹화만 담당한다. 사용자가 기존 녹화 재생은 정상이라고 확인했으며 재생·다운로드·시각 트림을 유지했다.
- NAS Frigate 0.17.2의 두 카메라에 `motion.enabled: false`, `detect.enabled: false`, `audio.enabled: false`, `record.continuous.days: 10`, `record.motion.days: 0`, alerts/detections retain days `0`을 적용했다. 기존 최대 10일 보관을 줄이지 않았으며 적용 전 NAS 여유 공간은 약 2.8TB였다.
- `/api/config/set` 저장·검증과 `/api/restart`를 거쳤다. 재시작 후 두 카메라 모두 약 5FPS, detection FPS 0이며 최근 녹화 segment가 각각 4개 추가되고 `motion=0`, `objects=0`임을 확인했다. HA의 두 motion switch도 `off`로 동기화했다.
- Frigate 원본 백업: NAS `/mnt/SSD_R0/apps/frigate/config/config.before-tapo-recording-only-20261011.yaml`, 권한 `0600`.
- C225 감지 select 9종과 C120 8종을 `normal`로 켜고 실제 상태를 확인했다. 아기 카메라가 재연결되면 감지를 끄던 자동화 `ha_design_c120_disable_tapo_detection_20261011`을 삭제했다. 자동 경보는 두 카메라 모두 `off`를 유지했으며 전원·프라이버시·수동 PTZ 위치는 변경하지 않았다.
- 기존 Tapo ONVIF webhook이 카메라에서 접근할 수 없는 Docker IP를 사용하고 있었다. HA `internal_url`을 NAS LAN의 HA 포트(`http://10.10.10.2:30103`)로 지정하고 Tapo integration을 다시 연결했다. 실제 webhook 처리와 거실 사람/움직임, 아기 움직임의 `on`/`off` 전환을 확인했다. 별도 HA FFmpeg `Noise` 분석은 사용하지 않으므로 껐고 임시 ONVIF debug logging을 해제했다.
- 카메라의 감지 설정 지원과 HA 이벤트 전달 지원은 별개다. 운영 카드에는 실제 존재하는 움직임·사람 센서를 연결했다. 아기 울음은 현재 Tapo 연동에서 이벤트 전달이 지원되지 않으며 `Noise`로 대체하지 않는다. 다른 감지 종류도 실제 HA binary sensor가 있을 때 선택형 `event_entities` 배열로 연결할 수 있다.
- 카드에서 Frigate `motion` 통계·30초 구간 병합·`selectedMotion`을 제거했다. HA history의 `entity_id`로 종류를 구분하고 감지 시점·종류 필터·원래 감지 시각을 표시한다. 조회 시작에 HA가 합성한 이월 `on` 상태는 새 이벤트로 세지 않는다. 현재 센서가 `unavailable`이어도 과거 이력과 녹화 재생은 유지한다.
- 실제 HA 응답 `10:10:00–10:14:03 UTC`를 새 파서로 처리하여 거실 사람 1건·움직임 1건·아기 움직임 28건을 확인했다. 감지 이력 지연/실패와 녹화 로드를 분리했고, 실시간 `on` 전환은 매번 하루 이력을 재조회하지 않고 병합한다. 새 실시간 감지가 이력 조회 오류를 성공 상태로 덮어쓰지 않도록 회귀 검증했다.
- 검증: camera Node 게이트 6개, non-light coverage, 카메라 JS 19개 syntax, LSP diagnostics 통과. Chromium 375/768/1280px의 HA/native HLS browser matrix에서 이벤트 선택·필터·이력 오류/빈 상태·녹화 우선 로드·트림/다운로드·입력 보존을 확인했다. 증거: `/tmp/ha-design-production-camera-history`.
- 배포: 구현 `1e5a96886a88b0454ce7fdbc234fc8d00673c907`, resource pin `88d19fd`, cache key `camera-tapo-events-20261011-1`. CDN entry와 재귀 module 20개가 HTTP 200이며 로컬 소스와 일치했다. 기존 HA resource ID를 유지하고 카메라 view 두 카드에 감지원만 추가했다.
- 실서버 Google Chrome에서 거실 사람 감지 `19:12:29`를 실제 타임라인 점으로 선택해 `readyState=4`, `1920×1080` 디코딩을 확인했다. 아기 카메라도 실제 움직임 이벤트에서 `readyState=4`, `2560×1440`, 재생 중(`paused=false`)을 확인했다. 두 시나리오의 page/HLS 오류는 0이었으며 393px 화면을 캡처했다.
- Aside 검증 브라우저에서는 같은 거실 HLS 구간이 준비 중에 머무르다 오류가 났다. 동일한 배포본·동일한 `19:12:29` 이벤트는 일반 Chrome에서 정상 디코딩됐다. 이를 사용자의 재생 실패나 앱 코드 원인으로 단정하지 않았으며 임의 롤백·추가 재생 코드 변경을 하지 않았다. 실제 iPhone/iPad HA 앱은 이번 작업에서 검증하지 않았다.
- 기존 사용자 문서 재편은 별도로 보존했다. `DESIGN.md`, `docs/contracts/camera.md`, 이 문서는 새 책임 분리와 운영 근거를 갱신하되, 기존 재편 전체를 source/resource commit에 섞지 않았다.

## 2026-10-13 감지 이벤트 5분 활동 묶음 복원

- 사용자 요청에 따라 Tapo 전환 중 누락된 5분 활동 묶음을 복원했다. `groupCameraEvents()`는 현재 필터의 인접 감지 간격이 300초 이하이면 연결하고, 300초 초과 또는 HA 현지 날짜 변경 시 분리한다. 구간은 첫 감지부터 마지막 감지까지이며 ON 지속 시간이나 추가 여유 시간을 쓰지 않는다.
- 타임라인은 활동당 하나의 띠/단일 시각 표시를 렌더링한다. 선택한 활동의 시각 범위와 건수를 알리며, 실제 선택·VOD·다운로드 기준은 원본 감지 시각을 유지한다. 감지 설정, Frigate 분석/녹화 정책, dashboard entity 구성은 변경하지 않았다.
- 실제 10월 12일 거실 이력으로 실행: 전체 3,123건 → 26개 활동, 움직임 1,272건 → 39개 활동, 사람 1,851건 → 28개 활동이다. 원본 이벤트를 삭제하거나 카메라 오탐을 보정한 수치가 아니다.
- 검증: 300초 경계·300초 초과·연쇄 연결·현지 자정·필터 제외 이벤트의 연결 차단 회귀 검증을 추가했다. camera Node 게이트 6개와 Chromium 375/768/1280px HA/native HLS matrix를 통과했고, 활동 안의 원본 감지 선택·재생·트림·다운로드를 유지했다. 변경 event module LSP diagnostics는 오류가 없다.
- 배포: 구현 `dd5c7ae17d2db4f4ee5866e2340d87cdbabea9ca`, resource pin `79ff113`, cache key `camera-events-grouped-20261013-1`. CDN module 20개의 HTTP 200 및 로컬 소스 일치를 확인한 뒤 기존 HA resource ID의 URL만 갱신했다. 기존 사용자 문서 재편은 source/resource commit에 섞지 않았다.
- 실서버 Chrome에서 10월 12일 거실을 열어 전체/움직임/사람 필터가 각각 26/39/28개 활동으로 표시됨을 확인했다. `11:13:04–13:23:35 · 519건` 활동 안의 실제 `11:59:55` 감지 선택 후 `recording=ready`, video `readyState=4`, `1920×1080` 디코딩과 page error 0을 확인했다. desktop/393px 모바일 화면을 캡처했으며 실제 iPhone/iPad HA 앱은 이번에 검증하지 않았다.

## 2026-10-13 활동 묶음 기준을 30분으로 변경

- 후속 사용자 요청에 따라 인접 감지 사이의 허용 간격을 5분에서 **30분(1,800초)**으로 변경했다. 정확히 30분은 연결하고 초과하면 분리한다. 현지 날짜 분리·종류 필터·원본 감지 시각·영상 탐색은 유지했으며, 활동의 총 길이를 30분으로 제한하는 방식은 아니다.
- 화면 범례와 안내, 설계/카메라 계약을 갱신했다. 실제 10월 12일 거실 이력으로 실행한 결과 전체·움직임·사람 필터 모두 4개 활동으로 묶였다.
- 검증: 1,800초 경계·초과·연쇄·자정·필터 회귀 검증과 375/768/1280px HA/native HLS browser matrix를 통과했다. 변경 event module LSP diagnostics는 오류가 없다.
- 배포: 구현 `bb238b39ec8e86743441d2a49a2a3e5316ee0a56`, resource pin `2d6a7da`, cache key `camera-events-grouped-20261013-2`. CDN module 20개의 HTTP 200 및 로컬 소스 일치를 확인하고 기존 HA resource ID를 유지해 URL을 갱신했다. 원본 이벤트·감도·녹화 정책은 변경하지 않았다.
- 실서버 Chrome의 10월 12일 거실 화면에서 전체·움직임·사람 필터가 각각 4개 활동을 표시하고 `30분 묶음` 안내가 나타남을 확인했다. `09:49:04–13:30:06 · 845건` 활동 안의 원본 감지를 선택해 `1920×1080`, `readyState=4` 영상 디코딩과 page error 0을 확인했다. 393px 실제 화면을 캡처했으며 iPhone/iPad HA 앱은 별도로 검증하지 않았다.

## 2026-10-13 카메라 UI 설명·기술 용어 축소

- 사용자 요청에 따라 비전문가용 카메라 화면에서 상시 설명문과 중복 정상 상태를 제거했다. 과거 영상 범례는 `감지 / 녹화`, 선택 정보는 감지 종류·원래 시각만 보이며, 30분 묶음 규칙과 활동 범위·건수는 화면 설명문으로 나열하지 않는다. 원본 이벤트와 30분 묶음 동작은 유지했다.
- 상세 제목의 기술 부제, 실시간 녹화 상태의 중복 박스, 없는 저장 위치 안내를 제거했다. privacy와 snapshot을 `촬영 일시 중지`, `사진 저장`으로 표현하며 제어 service와 상태 판정은 그대로다.
- 다운로드에서 NAS/export·키프레임·링크 만료·파일명·키보드 조작 설명을 걷어냈다. 날짜·시간 직접 입력을 펼쳤을 때만 시간대를 표시하며, 실제 녹화 공백과 저장 파일의 시작·끝 차이는 짧게 알린다. 다운로드 완료를 임의로 단정하지 않는다.
- 검증: camera Node 게이트 6개, 375/768/1280px HA/native HLS browser matrix, 변경 template LSP diagnostics를 통과했다. 고정 문구와 삭제된 장식 박스를 검사하던 테스트는 제거했고, 오류 재시도·무녹화 감지 시각 안내·오프라인 과거 영상·PTZ·트림·다운로드 동작 검증은 유지했다.
- 배포: 구현 `0da89bc5ffd2c6a5efc93e5715b60bd212fff52f`, resource pin `8729dde`, cache key `camera-simple-ui-20261013-1`. CDN module 20개의 HTTP 200과 로컬 소스 일치를 확인하고 기존 HA resource ID의 URL만 갱신했다. 기존 사용자 문서 재편은 source/resource commit에 섞지 않았다.
- 실서버 Chrome 393px에서 실시간·과거 영상·다운로드 화면을 확인했다. 10월 12일 거실의 30분 활동 4개와 원본 감지 선택을 유지하며, 과거 영상은 `1920×1080`, `readyState=4`로 디코딩됐다. 범례는 `감지 / 녹화`, 선택 문맥은 `움직임 · 11:59:55`이고 상시 설명·활동 건수 행은 없다.
- 실제 파일 다운로드는 준비·미리보기·링크 생성까지 확인했으나 두 번의 Chrome 파일 수신이 `canceled`로 끝났다. 클릭 전후 anchor가 같은 연결된 DOM 노드이고 상태는 `requested`였다. 같은 60초 구간은 Frigate 내부 API와 HA 컨테이너의 인증된 Frigate upstream에서 HTTP 200, 7,471,953바이트 전체 수신을 확인했다. HA 서명 프록시를 통한 브라우저 fetch는 30초 검증 도구 timeout이 났으며, 파일 저장 성공이나 원인을 단정하지 않는다. 이 UI 작업에서 서버/프록시 설정은 변경하지 않았다.

## 2026-10-13 장소 중심 홈 메뉴 재편

- 사용자 요청: 홈 메뉴를 기기 종류가 아니라 장소 기준으로 바꾸고, 순서를 `거실` → `안방` → `아기방` → `주방` → `다용도실`로 두며 `전체` view는 두지 않는다.
- `dashboards/ha-design.yaml`과 `dashboards/ha-design-inline.yaml`을 장소 다섯 Sections view로 다시 썼다. 경로는 `living-room`, `bedroom`(기존 유지), `baby-room`, `kitchen`, `utility-room`이고 카드의 entity 설정·`grid_options`·hero는 그대로 옮겼다.
- 개별 `dashboards/ha-design-*.yaml` 여섯 파일은 live view를 정의하지 않는 도메인별 카드 선언으로 정리하고, 각 카드가 어느 장소 view에 배치되는지 머리말에 남겼다.
- 기기 배치: 거실(거실 에어컨, 거실 커튼, 공기청정기, 거실 카메라), 안방(안방 조명, 안방 에어컨, 안방 커튼), 아기방(아기 카메라), 주방(냉장고, 김치냉장고), 다용도실(세탁기).
- 계약 테스트를 새 구조로 갱신했다. `tools/sections-resize-contract-test.mjs`는 view 제목·경로·순서, `전체` view 부재, Sections·`max_columns: 1`, 카드별 `grid_options`를 검사한다. 도메인 deployment 테스트는 개별 파일이 view를 정의하지 않는지와 카드가 어느 장소 view에 있는지 검사한다.
- 검증(저장소): `tools/*test.mjs` 20개 전부 PASS, 이전 11개 카드의 entity·`grid_options`·hero·capability 키가 새 구성에 그대로 남고 추가·삭제 키 0개, 두 dashboard의 `views:` 이하 블록 동일, 모든 dashboard YAML 파싱 성공.
- 실서버 반영(2026-10-13): live `ha_design` storage config에 저장했다. 저장 후 `lovelace/config` 되읽기에서 object 타입과 `거실:living-room`, `안방:bedroom`, `아기방:baby-room`, `주방:kitchen`, `다용도실:utility-room` 다섯 view 순서를 확인했다.
- 실서버 QA(2026-10-13, aside 브라우저 실제 렌더): 다섯 view 모두 상단 탭이 `거실 → 안방 → 아기방 → 주방 → 다용도실` 순서이고 `전체` 탭이 없다. 카드 수와 구성은 거실 4개(climate, curtain, air-purifier, camera), 안방 3개(light, climate, curtain), 아기방 1개(camera), 주방 2개(cold-storage), 다용도실 1개(washer)이며 각 view에서 구성 오류 문자열은 0건이다.
- 사고와 교훈: 첫 저장에서 `lovelace/config/save`에 YAML **문자열**을 넘겨 live 앱이 `Cannot use 'in' operator to search for 'strategy'` 오류로 대시보드를 렌더하지 못했다. 파싱된 객체로 다시 저장해 복구했고, 위 QA는 복구 후 화면에서 확인한 결과다. 같은 실수를 막기 위해 저장 형식 계약을 `DEPLOYMENT.md`에 추가했다.
- 롤백: 이전 live 구성은 형식 오류를 고치기 전에 덮어써 파일로 남기지 못했다. 카드 설정은 모두 보존됐으므로, 기기 종류 view로 되돌리려면 `git show HEAD:dashboards/ha-design-inline.yaml`을 파싱해 같은 방식(구조 object)으로 저장한다. 당시 live는 view 순서만 달랐다.
- 확인 필요: 안방 커튼 카드는 `columns: 6`이라 안방 view에서 행의 오른쪽 절반이 비어 보일 수 있다. 실서버 화면에서 정렬을 확인하고 필요하면 폭 결정을 이 항목에 기록한다.

## 2026-10-13 안방 조명 엔티티 정리와 실서버 점검

- 문제: 안방 view의 조명 카드가 `엔티티를 찾을 수 없습니다: light.anbang_anbang_jomyeong`(높이 `22px`)만 표시했다. 2026-08-30 기록에도 같은 누락 문구가 남아 있던 기존 결함이며, 장소 view 재편은 카드 설정을 그대로 옮겼을 뿐 원인이 아니다.
- 원인: `light.anbang_anbang_jomyeong`이 entity registry에 없다. 안방 조명은 Tapo(TP-Link L535, device `안방 조명`, area `anbang`)로 재등록되며 live 엔티티가 `light.anbang_jomyeong_2`가 됐다. 참조하는 automation·script·그룹은 없었다(`search/related` 결과 비어 있음).
- 조치(사용자 승인: registry 이름 정리): `config/entity_registry/update`로 `light.anbang_jomyeong_2`를 `light.anbang_jomyeong`으로 이름 정리하고, live storage config와 `dashboards/ha-design.yaml`·`ha-design-inline.yaml`, `tools/light-deployment-test.mjs`, `docs/contracts/lighting.md`, `docs/archive/phase-1-button-card.md`의 엔티티 참조를 새 ID로 갱신했다.
- 계약 정정: 실제 장치는 색온도 `2500–6500K`와 HS를 지원하고 `supported_features: 0`이라 transition을 광고하지 않는다. 이전 계약의 SmartThings·`2000–9000K`·transition 기술을 Tapo 실측값으로 바꿨다.
- 실서버 QA(2026-10-13, OFF 상태): 카드 `500×164px`, hero `154px`, 표시 문구 `꺼짐` · `LIGHTING · BEDROOM` · `안방 조명` · `조명이 꺼져 있어요`, 구성 오류 문자열 0건. 모달은 전원 switch(`aria-checked=false`)만 활성이고 밝기 range `1–100 step 1`(값 `50`, `—`), 색온도 range `2500–6500 step 100`(`—`), 컬러 프리셋 5종이 모두 비활성이며 비활성 이유 문구가 보인다. launcher 클릭으로 `aria-expanded=true`와 dialog open, 초점은 닫기 버튼으로 이동하고, 실제 Escape로 `aria-expanded=false`와 launcher 초점 복귀를 확인했다.
- 서비스 호출 없음: 조명 전원·밝기·색온도·프리셋을 누르지 않았고 기기 상태는 `off` 그대로다.
- 남은 확인: ON 상태의 밝기·색온도·프리셋 값 표시는 실제 전원을 켜야 하므로 이번 점검에서 다루지 않았다.
- 검증: `tools/*test.mjs` 20개 PASS(엔티티 갱신 후 `tools/light-deployment-test.mjs` 포함).

## 2026-10-13 방 온습도 카드 추가 (현재값 + 기록 차트)

- 사용자 요청: 대시보드에는 현재 온습도만 두고, 카드를 누르면 다이얼로그에서 과거 기록을 차트로 본다. 안방은 IR리모컨 내장 센서, 아기방은 Tuya LCD 온습도계 값을 쓴다.
- 승인 시안: `tools/temp-humidity-card-variants.html`의 A안(사진 없는 밝은 톤 패널 + 큰 온도·습도 숫자). 사용자는 실사 사진을 쓰지 말고 기존 카드와 어울리는 밝은 톤 배경을 쓰라고 지시했고, `tools/temp-humidity-fixture.js`의 실제 통계값으로 375/768/1440px에서 검증했다.
- 카드: `ha-design-temp-humidity-card`를 구현·스타일·템플릿·기록 모듈로 분리했다. 기록은 `recorder/statistics_during_period`로 24시간(1시간)·7일(1시간 6표본)·30일(1일)을 읽고, 차트는 최저–최고 띠 + 평균선, 요약은 최저·평균·최고로 표시한다. 값 등급은 배지 문구로 전달한다.
- 배치: 안방 `columns: 6`(커튼 카드와 같은 행), 아기방 `columns: 12`. 도메인 선언은 `dashboards/ha-design-temp-humidity.yaml`이고 resource는 `dashboards/ha-design-temp-humidity-resource.yaml`이 소유한다.
- 테스트: `tools/temp-humidity-card-test.mjs`, `tools/temp-humidity-interaction-test.html`, `tools/temp-humidity-deployment-test.mjs`를 신규로 추가하고, `tools/sections-resize-contract-test.mjs`, `tools/non-light-feature-coverage-test.mjs`(registry snapshot 2건 추가), `tools/card-picker-test.html`을 새 카드에 맞춰 갱신했다.
- 문서: `docs/contracts/temp-humidity.md` 신규, DESIGN·HA-STANDARD·DEPLOYMENT·README·문서 지도·SUBAGENT 가이드에서 카드와 resource를 여덟으로 맞췄다. 공통 계약에는 `renderDeviceCompact()`로 표현되지 않는 큰 숫자 레이아웃을 위한 copy 마크업 예외를 명시했다.
- 배포: 구현 commit `53f6ae71f236e9ea3ec4ddf9bfa767f6d2dd78ce`, resource pin commit `80a4b69`. live resource id는 `4dad6c09399c4b9385f902d3933e2541`이고 URL은 구현 SHA와 cache key `temp-humidity-20261013-1`에 고정했다. CDN에서 본체와 하위 모듈 5개가 모두 HTTP 200임을 확인했다.
- live 반영: `ha_design` storage config를 구조(object)로 저장하고 되읽기에서 열세 장의 카드 구성을 확인했다(거실 4, 안방 4, 아기방 2, 주방 2, 다용도실 1).
- 실서버 QA(2026-10-13, 실 Chrome): 안방 카드 `246×164px`에 `쾌적해요`·`TEMPERATURE & HUMIDITY · BEDROOM`·`안방 온습도`·`22.8°C`·`65%`, 아기방 카드 `500×164px`에 `24.1°C`·`63%`·배터리 `75%`를 표시했고 두 view에서 구성 오류 문자열이 0건이다. 다이얼로그는 현재값 3칸, 24시간 차트 23점, 요약(안방 `최저 22.8°C · 평균 22.8°C · 최고 22.8°C`, 아기방 `최저 23.0°C · 평균 24.3°C · 최고 24.9°C`, 습도 `최저 54% · 평균 65% · 최고 71%`)과 기간 탭 3종을 정상 표시했다.
- 관찰: 안방은 IR리모컨 내장 센서가 변화 시에만 보고하므로 24시간·7일 구간이 `22.8`로 평평하게 그려진다. 값 변화가 적은 구간은 차트가 단조로울 수 있다.
- 디자인 변경(2026-10-13 사용자 요청): 톤 패널 대신 사진 hero + 하단 프로스트 크림 바(4안)로 compact를 바꿨다. 사진은 늘리지 않고 `cover`로 자르며, 카드 폭 `280px` 이하에서는 미리 잘라 둔 정사각 자산으로 전환한다(`hero_image`/`hero_image_narrow`). hero를 설정하지 않은 카드는 기존 톤 패널로 동작한다.
- hero 자산: `www/ha-design/images/temp-humidity/hygrometer-wide.jpg`(1600×600)와 `hygrometer-square.jpg`(1200×1200). 출처는 Unsplash `photo-1610389337008-84e005329867`이고 초점 크롭(`fp-x=0.70`, `fp-y=0.55`)으로 기기를 프레임에 남겼다. 출처 문장은 README에 있다.
- 배포(hero): 구현 commit `a8981ceac49f637edcdaf540a0fd931d6646a5ce`, pin commit `d5358ed`. live resource id `4dad6c09399c4b9385f902d3933e2541`를 유지한 채 URL을 구현 SHA와 cache key `temp-humidity-20261013-2`로 갱신하고 대시보드를 다시 저장했다.
- 실서버 QA(hero): 안방 카드는 폭 `246×164px`에서 정사각 자산(`hygrometer-square.jpg`)을, 아기방 카드는 `500×164px`에서 와이드 자산(`hygrometer-wide.jpg`)을 쓴다. 두 카드 모두 `background-size: cover`이고 값 바는 `온도 22.8°C 습도 65%` / `온도 24.1°C 습도 62%`를 표시하며 구성 오류가 0건이다. 사진에서 흰 디지털 온습도계가 보이고 값 바 숫자가 읽히며, 다이얼로그는 23점 차트와 요약을 정상 표시한다.
- 검증(hero): `tools/*test.mjs` 22개 PASS, 브라우저 계약이 375/768/1280px에서 PASS(console error 0, 가로 넘침 0). 카드 폭 240px·190px 강제 검사에서 정사각 자산 전환과 값 축소(22px·19px)를 확인했다.

## 다음 세션 시작 절차

1. `git status --short --branch`와 `git rev-parse HEAD`를 확인한다.
2. 일곱 resource YAML과 `ha_design`의 장소 다섯 view를 확인한다. live URL, ID, SHA, cache key는 resource YAML을 기준으로 비교한다.
3. 실제 기기 상태를 조작 전에 저장한다.
4. [DEPLOYMENT.md의 검증 절차](DEPLOYMENT.md#nodesyntax-검증)를 먼저 실행한다.
5. 새 모듈 배포 시 구현 commit을 먼저 push하고, 영향을 받은 resource YAML의 40자리 SHA와 cache-bust query만 갱신한다.
6. 실제 UI QA 후 원래 기기 상태를 복원한다.

## 보호 규칙

- `ha_design` 밖의 dashboard를 변경하지 않는다.
- 조명 작업 중 `안방` view의 에어컨 카드 설정을 수정하지 않는다.
- live 서비스 호출 전 정확한 엔티티 상태를 저장하고 완료 시 복원한다.
- source URL은 commit SHA에 고정하고 iOS cache-bust query를 매 배포마다 올린다.
- 디버그 파일과 스크린샷은 저장소에 남기지 않는다.

## 남은 부채

- 실제 SmartThings 응답 지연은 외부 왕복에 의존하며 별도 로딩 스피너 없이 다음 HA 상태 갱신으로 확정한다.
- 기존 `www/ha-design/templates.yaml`과 조명 ON/OFF SVG 두 장은 Phase 1 호환 자료로 남아 있지만 현재 live card는 button-card를 사용하지 않는다.
