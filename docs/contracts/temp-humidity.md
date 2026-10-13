# 방 온습도 카드 계약

## 범위와 권위

이 문서는 `ha-design-temp-humidity-card`의 구현·설정·기록 조회·검수 계약이다. 카드 구현의 권위 원천은 `www/ha-design/ha-design-temp-humidity-card.js`, 목록·상세 DOM과 ARIA의 권위 원천은 `www/ha-design/ha-design-temp-humidity-card.template.js`, 기간 설정·응답 파싱·차트 기하·요약·문구 계산은 `www/ha-design/ha-design-temp-humidity-history.js`다. 실제 인스턴스와 엔티티 매핑은 `dashboards/ha-design-temp-humidity.yaml`이 소유한다.

운영 Lovelace module의 ID, URL, 고정 배포 리비전과 cache key는 오직 `dashboards/ha-design-temp-humidity-resource.yaml`이 소유한다. 이 문서나 다른 파일에 이를 복제하지 않는다. 공통 compact 높이·폭·focus 규칙은 [공통 compact·modal 운영 계약](shared.md), 배포 이력과 실서버 확인 기록은 `PROJECT-STATUS.md`, 제품·접근성·시각 시스템의 상위 규칙은 `DESIGN.md`가 권위다.

## 사용자 표면과 배치

- custom element 이름은 `ha-design-temp-humidity-card`다. `안방`(`bedroom`) view와 `아기방`(`baby-room`) view에 각각 한 장씩 배치한다.
- 카드는 실사 사진을 쓰지 않는다. 기존 카드와 같은 크림·흰색 계열의 밝은 톤 패널을 배경으로 두고, 온도·습도를 큰 숫자로 읽게 한다. 사진 없는 톤 패널은 이 카드의 승인된 시각 계약이며 실사 hero 이미지로 대체하지 않는다.
- 목록은 hero `154px`와 내용 없는 흰 tail `10px`를 포함한 `164px` 카드이며 radius는 `24px`이다. 목록 안에 즉시 제어를 두지 않고, 카드 전체가 상세 native `dialog`를 여는 단일 진입점이다.
- 공통 primitive는 그대로 재사용한다: `DEVICE_COMPACT_HERO_HEIGHT`·`DEVICE_COMPACT_TAIL_HEIGHT`·`deviceCompactStyles`·`escapeDeviceText()`·`patchCardDom()`을 import하고 compact 높이는 두 상수의 합으로 계산한다. 다만 `renderDeviceCompact()`의 고정 copy 모델(하단 고정 eyebrow·제목과 11px 상태 한 줄)로는 승인된 `큰 숫자 우선` 레이아웃을 만들 수 없어 copy DOM만 자체 마크업으로 둔다([공통 계약](shared.md) 확장 규칙 1의 예외). 이때도 `164px` 높이, `24px` radius, adaptive container query, launcher 단일 진입점 규칙은 다시 선언하지 않는다.
- 목록 위계는 eyebrow, 제목, 큰 온도·습도 숫자, 쾌적도 배지 순서다. 기본 제목은 `온습도`, 기본 eyebrow는 `TEMPERATURE & HUMIDITY`다.
- 승인된 시안은 A안(사진 없는 밝은 톤 패널 + 큰 온도·습도 숫자)이다. 비교 시안과 실측 fixture는 `tools/temp-humidity-card-variants.html`과 `tools/temp-humidity-fixture.js`에 있다. 승인되지 않은 variant를 production launcher로 사용하지 않는다.

## 설정과 grid

| 설정 키 | 요구 사항 | 기본값과 의미 |
| --- | --- | --- |
| `temperature_entity` | 필수. 존재하는 `sensor`이며 `device_class: temperature` | 없거나 잘못되면 설정 오류다. |
| `humidity_entity` | 선택. `sensor`이며 `device_class: humidity` | 없으면 습도 값은 `—`이고 습도 차트에 `습도 센서가 설정되지 않았어요`를 표시한다. |
| `battery_entity` | 선택. `sensor`이며 `device_class: battery` | 없으면 배터리 값은 `—`이다. |
| `title` | 텍스트 | 기본 `온습도` |
| `eyebrow` | 텍스트 | 기본 `TEMPERATURE & HUMIDITY` |

- `getConfigForm()`은 위 다섯 필드를 HA selector로 편집하게 한다. `temperature_entity`, `humidity_entity`, `battery_entity`는 각각 해당 `device_class`의 entity selector를 쓴다.
- `getStubConfig()`는 HA 상태에서 `device_class: temperature`인 첫 `sensor`를 `temperature_entity`로 자동 선택하고, 그 리스트에서 찾지 못하면 id에 `temperature`가 포함된 첫 `sensor`를 사용한다. 선택한 id에서 `temperature`를 `humidity`로 바꾼 습도 센서가 실제로 존재할 때만 `humidity_entity`도 함께 채운다. 짝이 되는 습도 센서가 없으면 비워 두고, `battery_entity`와 제목·eyebrow는 비운다. 기기 종류를 자동 발견하는 다중 entity stub은 제공하지 않는다.
- `getGridOptions()`는 `{ columns: 6, min_columns: 4, max_columns: 12 }`를 반환한다. live dashboard의 `안방` 카드는 `columns: 6`, `아기방` 카드는 `columns: 12`이고 두 카드 모두 `rows: auto`를 명시한다.
- `setConfig()`는 위 키만 읽고, 잘못된 domain이나 필수 키 누락을 조용히 넘기지 않는다. `hass` 갱신마다 현재값과 배터리 표시를 다시 계산한다.

## 상태 의미

| HA 상태 | 표시 | 의미 |
| --- | --- | --- |
| 숫자 상태 | 값과 단위(온도 `°C`, 습도 `%`, 배터리 `%`) | 온도는 소수 첫째 자리, 습도와 배터리는 정수로 표시한다. |
| `unknown`, `unavailable`, 그 밖의 비수치 | `—` | 상태 문자열을 그대로 노출하지 않고 값 자리를 비운다. |

- 온도나 습도 중 하나라도 읽을 수 없으면 카드와 다이얼로그는 그 값을 `—`로 둔다. 읽을 수 있는 나머지 값이 아래 조건에 해당하면 그 문구를 그대로 쓰고, 어떤 조건에도 해당하지 않으면 쾌적도 문구 자리에 `확인 필요`를 표시한다. 두 값 모두 읽을 수 없으면 항상 `확인 필요`다. 없는 측정값을 추정하거나 마지막 값을 현재값처럼 유지하지 않는다.
- 배터리는 정보용이다. 배터리만 읽을 수 없을 때 온도·습도 표시를 막지 않는다.
- 상태는 색만으로 전달하지 않는다. 쾌적도는 항상 완성된 한국어 문구로 함께 표시한다.

## 쾌적도 문구 규칙

쾌적도는 온도와 습도를 함께 읽어 한 문장으로 표현하며, 판정 순서는 다음과 같다.

| 조건 | 문구 |
| --- | --- |
| 습도 `70%` 이상 | `조금 습해요` |
| 습도 `40%` 미만 | `조금 건조해요` |
| 온도 `26°C` 이상 | `조금 따뜻해요` |
| 온도 `20°C` 미만 | `조금 서늘해요` |
| 그 밖 | `쾌적해요` |

습도 조건을 온도 조건보다 먼저 판정한다. 어느 조건에도 해당하는 값이 없고 온도나 습도 중 하나를 읽을 수 없으면 `확인 필요`를 표시하며, 두 값 모두 읽을 수 없으면 판정 자체를 하지 않고 `확인 필요`다. 카드의 배지와 다이얼로그 문장은 같은 판정 결과를 사용하고, 두 곳에 서로 다른 문구를 만들지 않는다.

## 기록 조회 API

- 기록은 `hass.callWS({ type: "recorder/statistics_during_period", start_time, end_time, statistic_ids, period, types: ["mean", "min", "max"] })` 한 경로로만 조회한다. 응답은 `{ entity_id: [{ start(ms), mean, min, max }] }`이며 카드가 원시 history를 직접 집계하지 않는다.
- `statistic_ids`는 설정된 온도·습도 entity다. 차트 자리에는 다음 우선순위로 문구를 표시한다.

| 우선순위 | 상태 | 차트 문구 |
| --- | --- | --- |
| 1 | 해당 entity 미설정 | `온도 센서가 설정되지 않았어요`, `습도 센서가 설정되지 않았어요` |
| 2 | 조회 실패 | `기록을 불러오지 못했어요` |
| 3 | 유효 표본 2개 미만, 조회 중 | `기록을 불러오는 중이에요` |
| 4 | 유효 표본 2개 미만, 조회 끝 | `기록이 아직 없어요` |

온도 entity는 필수이므로 1번은 실제로는 습도 차트에서만 발생한다. 이미 그린 점이 있는 상태에서 같은 기간을 다시 요청하면 새 응답이 올 때까지 기존 점을 유지하고 3·4번 문구를 띄우지 않는다.

- 어떤 상태에서도 목록과 현재값 행의 값은 유지한다. `hass.callWS`를 사용할 수 없거나 통계 대상 entity가 없으면 요청을 보내지 않는다.
- 기간을 바꾸면 이전 기간의 점을 버리고 새로 요청한다. 같은 기간을 다시 요청하면 직전 점을 유지한 채 갱신한다. 조회 중 기간이 다시 바뀌면 늦게 도착한 이전 응답은 폐기한다.
- 기간별 조회는 다음과 같다.

| 기간 | period | 표본 |
| --- | --- | --- |
| 24시간 | `hour` | 1시간 통계 전체 |
| 7일 | `hour` | 1시간 통계를 6개마다 표본으로 사용 |
| 30일 | `day` | 1일 통계 전체 |

- 표본의 `mean`이 없으면 그 점을 건너뛴다. `min` 또는 `max`만 없으면 띠의 해당 경계를 `mean`으로 대체한다. 카드가 통계를 다시 평균하거나 없는 구간을 보간해 채우지 않는다.

## 차트 구성

- 다이얼로그는 온도 차트와 습도 차트를 각각 하나씩 그린다. 각 차트는 min–max 띠, 평균선, 마지막 표본 점을 함께 표시한다.
- 띠는 최저–최고 범위를 옅은 채움(`fill-opacity: 0.16`)으로, 선은 평균을 굵은 stroke(`stroke-width: 2.2`)로 표현하고 마지막 표본에 점(`r: 3.4`)을 찍는다. 온도 차트는 gold `#8A641F`, 습도 차트는 accent `#315F6F`다.
- 유효 표본이 2개 미만이면 차트를 그리지 않고 위 우선순위 표의 문구를 대신 표시한다.
- 요약 문구는 `최저 … · 평균 … · 최고 …` 형식이며 온도는 소수 첫째 자리, 습도는 정수로 표시한다. 요약은 차트와 같은 표본에서 계산한다.
- 각 차트의 SVG는 `role="img"`이고 `aria-label`은 `온도 기록 차트. …` 형식으로 요약을 담는다. 요약이 없으면 같은 자리에 상태 문구를 담는다. 다이얼로그 하단에는 기록 출처와 현재 범위 설명을 문장으로 남긴다.

## 상세 다이얼로그

표시 순서는 현재값, 기간 탭, 온도 차트, 습도 차트, 출처 순서다.

1. 현재값 행은 온도·습도·배터리 세 항목을 항상 같은 순서로 표시하고, 설정되지 않았거나 읽을 수 없는 값은 `—`로 표시한다. 항목을 숨기거나 자리를 옮기지 않는다.
2. `24시간`, `7일`, `30일` 기간 탭을 `tablist`/`tab`과 `aria-selected`로 제공하고, 좌우 화살표와 Home/End로 이동한다.
3. 기간을 바꾸면 두 차트와 요약, 출처 설명을 새 표본으로 다시 그린다. 조회 중 상태를 완료된 값처럼 미리 확정하지 않는다.
4. 창 크기가 바뀌면 열려 있는 차트를 실제 폭에 맞춰 다시 그린다.
5. 다이얼로그가 열려 있는 동안 바깥 문서는 스크롤을 잠그고, 상세 본문만 세로 스크롤을 소유한다.

## 반응형과 접근성

- launcher는 `role="button"`, `tabindex`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`를 제공하며 click, Enter, Space로 연다. 열리면 닫기 버튼으로 초점을 옮기고, 닫기 버튼·backdrop·`Escape`로 닫으며 닫은 뒤 launcher로 초점을 복원한다.
- 다이얼로그는 `min(620px, calc(100vw - 24px))` 안에 놓고 상세 본문만 세로 스크롤한다. `480px` 이하에서는 `calc(100vw - 16px)`와 viewport 높이 안쪽 여백을 쓰고, `360px` 이하에서는 현재값 행이 두 열로 접힌다.
- 모든 조작점은 최소 `44×44px`다. 기간 탭과 닫기 버튼을 포함하며, 시안의 축소된 탭 높이를 그대로 옮기지 않는다.
- 큰 숫자와 쾌적도 문구는 색이 없어도 의미가 완결되어야 한다. 배지는 문구를 포함하고 배경색만으로 판정을 전달하지 않는다.
- 장식용 톤 패널에는 대체 텍스트가 필요 없다. 측정값과 확인 필요 상태는 텍스트로 전달한다.
- `focus-visible`과 `prefers-reduced-motion: reduce`를 유지한다. `375px`에서 가로 스크롤 없이 읽혀야 한다.

## 소스 소유권

| 책임 | 정본 파일 |
| --- | --- |
| HA 상태 해석, config form, stub, WS 기록 호출, dialog 초점 수명주기 | `www/ha-design/ha-design-temp-humidity-card.js` |
| 상세·목록 DOM, 문구 렌더링, ARIA | `www/ha-design/ha-design-temp-humidity-card.template.js` |
| 톤 패널, 큰 숫자 typography, 차트, 44px target, 반응형·reduced motion | `www/ha-design/ha-design-temp-humidity-card.styles.js` |
| 기간 설정, 요청 생성, 응답 파싱, 표본 선택, 차트 기하, 요약, 쾌적도·출처 문구 | `www/ha-design/ha-design-temp-humidity-history.js` |
| 공통 compact 높이·폭 적응·focus ring | `www/ha-design/ha-design-device-compact.js`, [공통 계약](shared.md) |
| 인스턴스 entity/title/eyebrow/grid 설정 | `dashboards/ha-design-temp-humidity.yaml` |
| Lovelace resource ID, URL, 구현 SHA, cache key | `dashboards/ha-design-temp-humidity-resource.yaml` |
| Node 계약(순수 로직·카드 소스)과 browser 상호작용 회귀 | `tools/temp-humidity-card-test.mjs`, `tools/temp-humidity-interaction-test.html` |
| dashboard 배선과 resource pin 계약 | `tools/temp-humidity-deployment-test.mjs` |
| 승인 전 시안과 실측 fixture | `tools/temp-humidity-card-variants.html`, `tools/temp-humidity-fixture.js` |

## 정확한 회귀 게이트

변경 시 다음 검사를 실행한다.

```sh
node tools/temp-humidity-card-test.mjs
node tools/temp-humidity-deployment-test.mjs
node tools/device-compact-contract-test.mjs
node --check www/ha-design/ha-design-temp-humidity-card.js
node --check www/ha-design/ha-design-temp-humidity-card.template.js
node --check www/ha-design/ha-design-temp-humidity-card.styles.js
node --check www/ha-design/ha-design-temp-humidity-history.js
```

- `tools/temp-humidity-card-test.mjs`는 custom element 등록, config 키 검증, `getGridOptions()` 값, stub 자동 선택과 짝 습도 센서 채움, 쾌적도 판정 순서, 기간별 period·표본을 검사한다.
- `tools/temp-humidity-interaction-test.html`은 mock `hass`와 실제 통계 응답으로 dialog 열기·닫기, 기간 탭 이동과 재조회, 차트 띠·평균선, `—`와 `확인 필요`, 미설정 습도 센서의 안내 문구, 44px target을 브라우저로 검사한다.
- `tools/temp-humidity-deployment-test.mjs`는 두 dashboard와 도메인 선언의 카드 인스턴스·eyebrow·grid columns·entity 매핑, `bedroom`/`baby-room` view 유지, 사진 히어로 미사용과 resource module의 고정 SHA URL·cache key를 검사한다.
- 두 카드 모두 `164px` 높이를 유지하는지는 `tools/device-compact-contract-test.mjs`가 검사한다.

실제 HA에서의 visual editor, Layout 저장·원복, desktop/mobile overflow와 실측 온습도·기록 일치 확인은 `PROJECT-STATUS.md`에 날짜와 함께 기록한다. 카드 source에 `getConfigForm()`과 `getGridOptions()`가 있다는 이유로 실기기 검증을 생략하지 않는다.
