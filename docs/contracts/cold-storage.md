# 냉장 기기 카드 계약

## 범위와 권위

이 문서는 `ha-design-cold-storage-card`의 구현·설정·검수 계약이다. 카드 구현의 권위 원천은 `www/ha-design/ha-design-cold-storage-card.js`, 편집기 필드의 권위 원천은 `www/ha-design/ha-design-cold-storage-card.config.js`다. 실제 인스턴스와 엔티티 매핑은 `dashboards/ha-design-cold-storage.yaml`이 소유한다.

운영 Lovelace module의 ID, URL, 고정 배포 리비전과 cache key는 오직 `dashboards/ha-design-cold-storage-resource.yaml`이 소유한다. 이 문서나 다른 파일에 이를 복제하지 않는다. 배포 이력과 실서버 확인 기록은 `PROJECT-STATUS.md`, 제품·접근성·시각 시스템의 상위 규칙은 `DESIGN.md`가 권위다.

## 제품 변형과 화면 구조

- 허용 `kind`는 `refrigerator`와 `kimchi`뿐이다. 다른 값은 설정 오류다.
- 두 변형은 하나의 custom element와 공통 compact renderer를 사용한다. 목록은 hero 154px와 빈 흰 tail 10px를 포함한 164px 카드이며, 카드 전체만 상세 native `dialog`를 여는 단일 진입점이다.
- 기본 제목/eyebrow/detail eyebrow는 냉장고 `냉장고`/`APPLIANCE · KITCHEN`/`FRESH STORAGE`, 김치냉장고 `김치냉장고`/`KIMCHI STORAGE · KITCHEN`/`FERMENTATION STORAGE`다. 설정값이 있으면 제목과 eyebrow는 이를 우선한다.
- `zones`는 배열이어야 하며 각 항목은 `name`, 현재 온도 `entity`를 가진다. zones가 없으면 적어도 하나의 에너지 엔티티가 필요하다. 목록은 zone 우선 앞 두 개, zone이 없으면 에너지 앞 두 개를 상태 요약으로 사용한다.
- 상세 순서는 히어로, 칸별 현재 온도, 설정된 목표 온도, 설정된 급속 운전, 읽을 수 있는 보관 모드, 에너지 사용량, 연결 기능 요약이다. 실제로 없는 섹션을 채우기 위한 가짜 zone, 모드, 제어는 금지한다.

## 문, 온도, 목표 온도

- 문 입력은 `door_entities`가 우선이며, 없을 때 `door_entity` 하나를 사용한다. `on`, `open`, `opening` 중 하나라도 있으면 문 열림이다. 입력이 없거나 하나라도 `unknown`/`unavailable`/누락이면 상태는 `확인 필요`이며 문 열림으로 추정하지 않는다.
- zone의 현재값과 단위는 해당 `sensor` 상태가 권위다. `unknown`/`unavailable`은 `—`로 표시한다. 사용자 정의 설명이 없으면 `실제 센서값`을 표시한다.
- `zones[].target_entity`는 `number` 엔티티다. 현재값과 `min`/`max`/양수 `step`이 모두 유효할 때만 +/- 조작을 활성화한다. 범위 끝 버튼은 비활성화하고, 요청값은 범위 안으로 clamp한 뒤 step에 맞춘다.
- 목표 온도 변경은 확인 대화상자 승인 뒤에만 `number.set_value`를 호출한다. 요청 성공을 화면에 미리 확정하지 않으며 다음 Home Assistant 상태 갱신이 표시값의 권위다.

## 급속 운전과 보관 모드

- `quick_cool_entity`, `quick_freeze_entity`가 설정된 경우에만 각각 급속냉각, 급속냉동 스위치를 렌더링한다. 엔티티 상태가 정확히 `on` 또는 `off`일 때만 조작 가능하다.
- 급속 운전은 현재 상태의 반대 서비스(`switch.turn_on` 또는 `switch.turn_off`)를 한 번 요청한다. 요청 뒤 상태는 낙관적으로 바꾸지 않는다.
- 보관 모드는 `mode_entity`가 있고 그 엔티티의 `attributes.options` 또는 설정 `mode_options`가 비어 있지 않을 때만 보인다. 선택 시 `select.select_option`에 선택 option을 보낸다. mode 상태가 `unknown`/`unavailable`이면 버튼은 비활성화한다.
- 현재 production 김치냉장고 매핑은 실제로 제공되는 문 상태와 다섯 에너지 지표만 사용한다. zone이나 mode를 발명하지 않는다. 냉장고 매핑은 냉장실·냉동실 현재 온도와 각 목표 온도, 급속냉각·급속냉동을 연결한다.

## 에너지 의미

지원하는 선택 입력은 다음 다섯 가지이며, 설정된 것만 같은 이름으로 표시한다.

| 설정 키 | 표시 의미 |
| --- | --- |
| `power_entity` | 현재 전력 |
| `energy_entity` | 누적 에너지 |
| `energy_difference_entity` | 에너지 차이 |
| `power_energy_entity` | 전력 에너지 |
| `energy_saved_entity` | 절약 에너지 |

센서의 단위는 `unit_of_measurement`를 그대로 사용하고 수치값은 소수 첫째 자리까지 표시한다. 비수치 상태는 상태 문자열과 단위를, `unknown`/`unavailable`/누락 값은 `—`를 표시한다. 이 지표는 정보용이며 카드가 에너지 값을 계산하거나 파생값을 추정하지 않는다.

## 지원하지 않는 기능 정책

설정되지 않았거나 유효하지 않은 엔티티를 동작 가능한 제어로 표현하지 않는다. 해당 기능은 숨기며, 이미 설정됐지만 상태를 읽을 수 없는 급속 운전·목표 온도·모드만 비활성화한다. `supported_features`를 추측하거나 제조사 앱의 기능, CSS 모형, 임의 보관 모드·칸·온도·에너지 값을 추가하지 않는다. 서비스 요청은 UI 의도가 아니라 다음 `hass` 상태 갱신으로만 확정한다.

## 승인된 Warm Studio 방향

생산 히어로는 승인된 A안 `Warm Studio`만 사용한다. 코타화이트 `RF60DB9KF201` 냉장고와 `RQ33DB74D2AP` 3도어 김치냉장고의 삼성 공식 정면 제품 컷을 따뜻한 차콜·토프·아이보리 스튜디오 배경에 분리 배치한다. 제품 전체 실루엣과 텍스트 영역은 겹치지 않아야 한다.

`hero_variant: studio`와 `hero_product_image`를 두 카드에 지정한다. 히어로 비교와 승인 근거는 `tools/cold-storage-hero-variants.html`에 있으며, 승인되지 않은 주방 사진 합성 및 CSS 제품 모형은 production hero로 사용할 수 없다.

## 반응형과 접근성

- 카드의 grid 범위는 4–12 columns, 기본값은 6이다. 공통 compact renderer는 host 폭 280px 이하에서 좁은 밀도로 상태 한 줄을 사용한다.
- 상세 dialog는 최대 520px, 작은 화면에서는 viewport 여백 16px 안에 놓이며 상세 본문만 세로 스크롤한다. 420px 이하에서는 zone·목표 온도·급속 운전이 한 열이고 에너지는 두 열이다. 375px에서 가로 스크롤 없이 읽혀야 한다.
- launcher는 `role="button"`, `tabindex`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`를 제공하며 click, Enter, Space로 연다. native dialog는 Escape, backdrop 클릭, 닫기 버튼으로 닫고 launcher에 초점을 돌린다.
- 조작점은 최소 44px이다. 급속 운전은 `button[role=switch]`와 `aria-checked`, mode는 `tablist`/`tab`과 `aria-selected`, 목표 온도 출력은 `aria-live`를 사용한다. 모든 버튼에는 보이는 라벨 또는 방향을 포함한 접근 가능한 이름이 있어야 한다.
- 장식용 히어로 이미지는 빈 대체 텍스트다. 문·온도·에너지·활성 상태는 텍스트로도 전달한다. `focus-visible`과 `prefers-reduced-motion: reduce`를 유지한다.

## 정확한 회귀 검사와 live QA

변경 시 다음 검사를 실행한다.

```sh
node tools/cold-storage-contract-test.mjs
node tools/non-light-feature-coverage-test.mjs
node tools/device-compact-contract-test.mjs
```

`tools/cold-storage-contract-test.mjs`는 카드 등록, dialog, 문 상태, 목표 온도 범위·서비스, 급속냉각·급속냉동, mode 서비스, hero/모델/에너지 설정, 두 dashboard 카드와 resource module 계약을 검사한다. `tools/non-light-feature-coverage-test.mjs`는 cold-storage dashboard가 registry snapshot의 엔티티 집합과 일치하는지 검사한다. `tools/device-compact-contract-test.mjs`는 공통 154px hero/10px tail과 adaptive compact 계약을 검사한다.

`tools/cold-storage-interaction-test.html`은 mock Home Assistant로 냉장고 dialog의 열기/닫기, 급속냉각·급속냉동, 목표 온도 확인 후 설정, 김치냉장고 문 열림 badge·보관 모드, 양쪽 다섯 에너지 지표, 누락 급속 스위치의 disabled/no-service를 검증하는 브라우저 표면이다.

`PROJECT-STATUS.md`에 기록된 live QA는 실제 desktop 및 375px에서 냉장고의 목표 온도·급속냉각·급속냉동·다섯 에너지 지표와 김치냉장고의 다섯 에너지 지표를 확인했고, 가로 overflow와 console/page error가 없었다. 이 기록은 상태 관측일 뿐 새 배포의 대체 검증이 아니다. resource URL이나 dashboard 엔티티 매핑을 바꾸는 배포는 해당 resource 파일을 권위로 삼아 실제 HA에서 visual editor, Layout 저장·원복, desktop/mobile overflow와 실제 상태를 다시 확인한다.
