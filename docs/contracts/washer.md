# WD25DB8690BE 세탁기 카드 계약

이 문서는 `custom:ha-design-washer-card`가 실제 SmartThings 세탁기를 어떤 의미로
표시하고 조작하는지 설명하는 사람용 계약이다. 대상은 `ha_design` 대시보드의
`다용도실`(`utility-room`) Sections view에 있는 WD25DB8690BE 한 대다.

## 권위 원천과 구성 범위

- 구현의 권위 원천은 `www/ha-design/ha-design-washer-card.js`,
  `ha-design-washer-card.config.js`, `ha-design-washer-state.js`,
  `ha-design-washer-card.template.js`, `ha-design-washer-card.controls.js`,
  `ha-design-washer-card.styles.js`다.
- 실제 엔티티 연결의 권위 원천은 `dashboards/ha-design-washer.yaml`이다. 카드에는
  의미 있는 SmartThings 엔티티 21개가 모두 연결되어 있다.
- 배포 resource의 권위 원천은 `dashboards/ha-design-washer-resource.yaml`이다. 이
  파일의 기존 resource ID와 module URL만이 실제 HA가 불러올 배포본을 결정한다.
  이 문서는 그 URL의 구현 pin 또는 cache key를 복제하지 않는다.
- visual editor는 제목, eyebrow, 모델, 히어로 설정 5개와 아래 엔티티 21개, 총
  26개 필드를 제공한다. 운전 제어, 전원, 원격 제어, 기기 상태, 작업 상태, 완료
  예정 시각의 6개는 필수이고 나머지는 선택 연결이다.
- 카드의 기본 Sections 폭은 12 columns이며 허용 범위는 4--12 columns다. 실제
  대시보드는 `washer` 경로의 단일 카드로 이 구성을 사용한다.

## 엔티티 역할

모든 ID는 현재 대시보드에 연결된 실제 ID다. “조작”은 카드가 해당 서비스 요청을
보낼 수 있다는 뜻이지, 요청 직후 성공을 확정한다는 뜻이 아니다.

| 엔티티 | 사람에게 보이는 역할 | 카드에서의 사용 |
|---|---|---|
| `select.dayongdosil_setaggi` | 운전 명령 통로 | `run`, `pause`, `stop` 옵션이 모두 있을 때에만 일시정지·계속·정지 명령을 보낸다. 코스 선택기는 아니다. |
| `binary_sensor.dayongdosil_setaggi_power` | 제품의 운전 가능/대기 상태 | `on`일 때만 운전 제어 영역과 운전 관련 설정을 연다. `off`는 정상 대기다. |
| `binary_sensor.dayongdosil_setaggi_remote_control` | 제품에서 켠 Smart Control 상태 | `on`이어야 원격 운전과 운전 관련 설정을 노출한다. 카드에서 켤 수 없다. |
| `sensor.dayongdosil_setaggi_machine_state` | 본체의 운전 상태 | `run`, `pause`, `stop`으로 운전 버튼, 대기 여부, 완료 시각의 수명주기를 판단한다. |
| `sensor.dayongdosil_setaggi_job_state` | 현재 세탁 단계 | 세탁·헹굼·탈수·건조 등 사람이 읽는 단계 문구를 만든다. |
| `sensor.dayongdosil_setaggi_completion_time` | 완료 예정 시각 | 실제 운전 또는 일시정지 중에만 “완료 예정”으로 표시한다. |
| `select.dayongdosil_setaggi_water_temperature` | 물 온도 | Smart Control이 켜진 운전 설정에서만 선택한다. |
| `number.dayongdosil_setaggi_rinse_cycles` | 헹굼 횟수 | Smart Control이 켜진 운전 설정에서 entity의 최소/최대 범위 안에서 선택한다. |
| `select.dayongdosil_setaggi_spin_level` | 탈수 강도 | Smart Control이 켜진 운전 설정에서만 선택한다. |
| `select.dayongdosil_setaggi_detergent_dispense_amount` | 자동 세제함 투입량 | 대기·Smart Control OFF에서도 실제 반영이 검증된 선택값으로 남긴다. |
| `select.dayongdosil_setaggi_flexible_compartment_dispense_amount` | 유연제 칸 투입량 | 대기·Smart Control OFF에서도 실제 반영이 검증된 선택값으로 남긴다. |
| `switch.dayongdosil_setaggi_bubble_soak` | 버블 불림 | Smart Control이 켜진 운전 설정에서만 on/off 한다. |
| `switch.dayongdosil_setaggi_wrinkle_prevent` | 구김 방지 설정 | Smart Control이 켜진 운전 설정에서만 on/off 한다. |
| `binary_sensor.dayongdosil_setaggi_child_lock` | 차일드 락의 실제 상태 | 잠김/해제 정보만 표시하며 카드에서 바꾸지 않는다. |
| `binary_sensor.dayongdosil_setaggi_wrinkle_prevent_active` | 구김 방지가 실제 동작 중인지 | 동작 중/대기 정보만 표시하며 설정 switch와 혼동하지 않는다. |
| `sensor.dayongdosil_setaggi_power` | 현재 전력 | compact 요약과 사용량의 읽기 전용 측정값이다. |
| `sensor.dayongdosil_setaggi_energy` | 누적 에너지 | 사용량의 읽기 전용 누적값이다. |
| `sensor.dayongdosil_setaggi_energy_difference` | 에너지 차이 | 사용량의 읽기 전용 비교값이다. |
| `sensor.dayongdosil_setaggi_energy_saved` | 절약 에너지 | 사용량의 읽기 전용 절약값이다. |
| `sensor.dayongdosil_setaggi_power_energy` | 전력 에너지 | 사용량의 읽기 전용 누적값이다. |
| `sensor.dayongdosil_setaggi_water_consumption` | 누적 물 사용량 | 사용량의 읽기 전용 누적값이다. |

## 상태 의미와 Idle

- `power_entity=off`는 전원 코드가 빠졌거나 고장 났다는 뜻이 아니라, Home
  Assistant가 보고한 **정상 대기**다. compact와 상세 히어로의 주 상태는 `대기`로
  표시하고 운전 경고 상자와 운전 제어 섹션은 숨긴다.
- 본체 상태가 `stop`이면 내부 단계는 `idle`이며 badge는 `준비`다. 다만 전원이
  `off`이면 화면 문구는 언제나 `대기`가 우선한다. 남아 있는 세탁 옵션값을 현재
  운전값이나 다음 코스로 강조하지 않는다.
- `run`과 `pause`만 활성 운전으로 취급한다. `pause`는 작업 단계보다 `일시정지`를
  우선 표시한다. 활성 운전 중 알려진 작업 단계는 에어워시, AI 세탁/헹굼/탈수,
  예비 세탁, 세탁, 헹굼, 탈수, 건조, 냉각, 예약 대기, 세탁량 감지, 구김 방지,
  완료, 동파 방지로 번역한다.
- `run`인데 작업 단계가 알 수 없거나 사용할 수 없으면 대기로 둔갑시키지 않고
  `상태 확인 중`으로 표시한다. 완료 예정 시각은 `run` 또는 `pause`이고 시각값이
  사용 가능할 때만 표시한다. 정지 후 남은 과거 시각은 숨긴다.
- Smart Control 상태는 전원 상태와 별도다. 대기 화면에도 `스마트컨트롤 켜짐` 또는
  `스마트컨트롤 꺼짐`을 별도 상태로 보여 준다.

## Smart Control 및 기능별 게이트

### 운전 명령 게이트

원격 명령이 가능한 상태는 다음 조건을 모두 만족할 때다.

1. 전원 상태가 정확히 `on`이다.
2. 제품에서 Smart Control을 켜 `remote_control_entity=on`이다.
3. 운전 명령 select가 존재하며 `unknown`/`unavailable`이 아니고,
   options에 `run`, `pause`, `stop` 세 값이 모두 있다.
4. 새 운전을 판단하는 경우 본체 상태가 정확히 `stop`이다.

화면의 명령은 이보다 더 보수적이다.

| 상태 | 보이는 운전 제어 |
|---|---|
| 전원 OFF | 운전 제어 섹션 자체를 숨긴다. 경고로 취급하지 않는다. |
| 전원 ON, Smart Control OFF | “제품에서 스마트컨트롤을 켜주세요.” 안내만 보이고 명령 버튼은 없다. |
| Smart Control ON, 명령 통로 미확인 | 연결 상태 확인 안내만 보이고 명령 버튼은 없다. |
| `machine_state=run` | `일시정지`, `정지`를 제공한다. |
| `machine_state=pause` | `계속`, `정지`를 제공한다. `계속`은 select의 `run` 옵션을 보낸다. |
| `machine_state=stop`이고 명령 조건 충족 | 코스를 SmartThings 앱에서 확인하라는 안내만 보인다. 새 운전 시작 버튼은 제공하지 않는다. |
| 그 밖의 기기 상태 | 기기 상태 확인 안내만 보인다. |

카드는 `select.select_option`만 사용한다. `일시정지`는 `pause`, `정지`는 `stop`,
`계속`은 `run`을 해당 `control_entity`로 보낸다. HA의 다음 상태 갱신이 결과의
권위 원천이다.

### 설정 게이트

| 기능 묶음 | 노출 조건 | 개별 entity 상태가 불명확할 때 |
|---|---|---|
| 코스 | 항상 앱 전용 안내 | 코스를 조회하거나 바꾸는 UI를 만들지 않는다. |
| 물 온도, 헹굼 횟수, 탈수 강도 | 전원 ON **그리고** Smart Control ON | entity가 있으면 비활성화하고 “상태 확인 중”을 표시한다. entity가 없으면 행을 숨긴다. |
| 버블 불림, 구김 방지 설정 | 전원 ON **그리고** Smart Control ON | entity가 있으면 switch를 비활성화한다. entity가 없으면 행을 숨긴다. |
| 세제 투입량, 유연제 투입량 | 전원·Smart Control과 무관하게 표시 | 해당 select가 사용 가능하면 대기와 Smart Control OFF에서도 조작 가능하다. 사용 불가면 비활성화한다. |
| 차일드 락, 구김 방지 실제 동작, 여섯 사용량 | 항상 읽기 전용 정보 | 값이 없거나 불명확하면 `—`으로 표시한다. |

세제·유연제만 대기에서도 남기는 것은 추측이 아니라 실기기에서 지연 반영이
검증된 예외다. 다른 세탁 옵션과 추가 기능을 같은 방식으로 열어서는 안 된다.

## `unknown`/`unavailable`과 fail-closed

- 명령 select가 없거나 `unknown`/`unavailable`이거나 세 필수 options를 모두
  보고하지 않으면 `commandReady=false`다. 시작·일시정지·계속·정지 명령을 새로
  노출하지 않는다.
- 전원 또는 Smart Control 값이 정확히 `on`이 아닌 모든 경우는 원격 운전을
  허용하지 않는다. 누락도 각각 OFF로 해석한다.
- 본체 상태가 없거나 `unknown`/`unavailable`이면 `status_check`이며 새 운전은
  허용하지 않는다. 활성 `run` 중 작업 상태만 불명확한 경우에도 이를 Idle로
  표시하지 않는다. 안전한 정지/일시정지 여부는 여전히 본체 상태와 명령 통로가
  확인된 경우에만 결정한다.
- 완료 예정 시각이 `unknown`/`unavailable`이면 실제 시각처럼 표시하지 않는다.
  형식이 잘못된 비어 있지 않은 시각도 `확인 중`으로만 표시한다.
- 선택·숫자·switch 설정은 각 entity 자신이 `unknown`/`unavailable`일 때 disabled
  상태와 “상태 확인 중”을 표시한다. 사용량과 읽기 전용 binary 상태는 `—`이다.
- fail-closed는 명령 권한과 해당 기능의 상태에 적용한다. 다른 entity가 사용
  가능하다는 이유로 누락한 코스, 명령 options, 또는 실제 운전 단계를 보완해서는
  안 된다.

## 허용되는 조작과 금지되는 가정

허용되는 조작은 조건을 만족한 운전 중의 일시정지·계속·정지, 조건을 만족한 물
온도·헹굼·탈수·버블 불림·구김 방지, 그리고 사용 가능한 세제·유연제 투입량뿐이다.
그 밖의 6개 사용량과 두 binary 상태는 표시 전용이다.

다음 가정은 위험하므로 금지한다.

- `power=off`를 물리적 전원 차단, 고장, 또는 경고 상태라고 단정하지 않는다.
- `canStart=true` 또는 `primaryAction=start`라는 내부 파생값을 새 코스 시작 권한으로
  사용하지 않는다. 카드는 선택된 코스를 알 수 없으므로 정지 상태에서 `run`을
  보내는 시작 버튼을 렌더링하지 않는다.
- 운전 명령 select를 코스 select로 취급하거나, 이전 코스·남아 있는 설정값에서
  코스를 추론하지 않는다. 코스 확인과 변경은 SmartThings 앱의 책임이다.
- Smart Control을 카드에서 켜거나, 원격 OFF를 우회해 명령을 보내지 않는다.
- 오래된 완료 시각, `unknown`/`unavailable` 값, 읽기 전용 사용량을 실제 운전 또는
  조작 성공으로 표현하지 않는다.
- 지원하지 않는 세탁 기능, 가짜 선택지, 임의 기본값을 추가하지 않는다. 서비스
  요청 후에도 낙관적으로 상태를 확정하지 않는다.

## 승인된 시각 방향과 반응형/접근성

- 운영 대시보드에는 승인 A안 **Warm Utility**만 사용한다. `hero_variant: warm`,
  삼성 공식 WD25DB8690BE 정면 제품 컷, 따뜻한 차콜·토프·아이보리의 절제된 장면을
  유지한다. `deep`, `linen`은 로컬 비교용이며 운영 dashboard/resource에 넣지 않는다.
- 목록은 공통 Compact Device Card의 164px 계약(154px hero와 10px 흰 tail)을
  사용한다. 카드 전체가 유일한 상세 진입점이며 목록 안에 즉시 조작을 추가하지
  않는다.
- 상세는 native `dialog`로 열리고 최대 폭은 620px, 폭은 viewport에서 24px를 뺀
  값을 넘지 않는다. 바깥 문서는 잠그고 모달 본문만 세로 스크롤한다. 520px 이하
  에서는 상태와 사용량 grid를 한 열로 바꿔 375px에서 가로 넘침 없이 읽는다.
- launcher는 `role=button`, `tabindex=0`, `aria-haspopup=dialog`,
  `aria-expanded`를 제공하며 click, Enter, Space로 연다. 닫기 버튼·배경 클릭·Escape로
  닫고 launcher로 초점을 되돌린다. native dialog의 focus trap을 유지한다.
- select는 native 키보드 의미를 유지한다. switch는 `role=switch`, `aria-checked`,
  이름을 가지며 모든 버튼·select·switch의 터치 목표는 최소 44px다. 색만으로
  제한을 알리지 않고 Smart Control 안내와 상태 문구를 함께 제공한다.
- 포커스는 눈에 보이는 outline으로 표시하고, `prefers-reduced-motion: reduce`에서는
  전환과 scroll 동작을 제거한다. 장식 제품 이미지는 빈 `alt`이고 상태는 텍스트로
  전달한다.

## 정확한 회귀 테스트

다음은 이 계약의 검사 표면이다.

| 실행 또는 표면 | 확인하는 계약 |
|---|---|
| `node tools/washer-state-test.mjs` | 단계 파생, 활성/Idle 수명주기, 오래된 완료 시각 숨김, 명령·기기 entity 누락 또는 unavailable fail-closed, 운전 중 불명확 작업 단계, 명령 서비스 매핑을 검사한다. |
| `node tools/washer-deployment-test.mjs` | 독립 washer dashboard와 전체 dashboard의 모델·Warm Utility·21개 entity 연결, resource ID·module URL 형식을 검사한다. |
| `tools/washer-interaction-test.html` | mock HA에서 Idle/Smart Control 기능별 gate, 코스 시작 금지, unavailable control disabled, pause/stop 서비스, 44px switch, modal 초점·배경 스크롤 수명주기를 검사한다. 페이지의 `data-result=pass`가 성공 조건이다. |
| `node tools/non-light-feature-coverage-test.mjs` | registry snapshot의 세탁기 감사 entity 21개가 dashboard 구성에서 빠지지 않았는지 검사한다. |
| `tools/card-picker-test.html` | native visual editor의 세탁기 26개 필드와 4--12 column grid metadata를 검사한다. |
| `tools/adaptive-compact-test.html`, `node tools/sections-resize-contract-test.mjs` | 세탁기 카드의 12-column 기본값과 Sections resize 계약을 검사한다. |

## 기록된 라이브 QA와 한계

`PROJECT-STATUS.md`에 기록된 2026-08-31 검증에서는 실제 desktop에서 본체와 하위
모듈이 같은 배포본으로 로드됐고, Idle에서 세제·유연제 두 control만 남으며 시작
버튼은 0개, 문서와 모달의 가로 overflow 및 구성 오류는 0개였다. 로컬 375px 실제
iframe에서도 한글 잘림·비정상 줄바꿈과 가로 overflow가 없었다. 앞선 실제 HA
검증에서는 visual editor 26개 필드, Layout의 `12 columns / 480px -> 6 columns /
236px -> 12 columns / 480px` 저장·원복, 최종 `grid_options: { columns: 12, rows:
auto }` readback을 확인했다.
