# 안방 조명 계약

이 문서는 `ha-design-light-card`의 사용자 경험, Home Assistant 상태 해석, 배포와 검증의 기준이다. 공통 compact 카드 규칙은 [공통 계약](shared.md)을 우선하며, 프로젝트의 설치 방법·디자인·라이브 이력은 각각 [README](../../README.md), [DESIGN.md](../../DESIGN.md), [PROJECT-STATUS.md](../../PROJECT-STATUS.md)를 따른다.

## 사용자 표면

- `안방` (`bedroom`) view에는 `custom:ha-design-light-card` 한 장을 안방 에어컨·커튼 카드와 같은 페이지에 배치한다. 목록은 사진, `LIGHTING · BEDROOM`, `안방 조명`, 상태 문장, `켜짐`/`꺼짐`/`연결 끊김` 배지와 공통의 빈 10px tail로 구성한다.
- 목록 전체가 상세 native `dialog`를 여는 단일 진입점이다. 목록 안에는 전원, slider, 색상 즉시 제어를 두지 않는다.
- 상세 모달 순서는 히어로와 닫기, 전원, 밝기, 지원될 때의 색온도, 지원될 때의 HS 컬러 프리셋, 지원 기능 안내다. OFF 히어로는 같은 사진을 어둡고 저채도로 표현한다.
- 기본 grid는 `columns: 12`, `rows: auto`이고 카드 구현은 `min_columns: 4`, `max_columns: 12`를 제공한다. 공통 compact 높이 `164px`(hero `154px` + tail `10px`)와 실제 폭 적응 규칙은 [공통 계약](shared.md) 소유다.

## 정본 엔티티와 capability

- 라이브 정본 엔티티는 Tapo(TP-Link L535)의 `light.anbang_jomyeong`이다. 이전 SmartThings 엔티티 `light.anbang_anbang_jomyeong`은 registry에서 사라졌고, 재등록되며 `_2`가 붙은 `light.anbang_jomyeong_2`를 2026-10-13에 canonical ID `light.anbang_jomyeong`으로 이름 정리해 이 카드가 사용한다.
- 카드 설정 `entity`는 `light.` domain만 허용한다. 현재 대시보드와 Raw editor의 정본 인스턴스 설정은 [`dashboards/ha-design.yaml`](../../dashboards/ha-design.yaml) 및 [`dashboards/ha-design-inline.yaml`](../../dashboards/ha-design-inline.yaml)에 있다.
- 실제 장치 capability는 전원, 밝기, 색온도 `2500–6500K`, HS 색상이고 `supported_features`는 `0`이다. 장치가 광고하지 않는 transition·flash·effect는 렌더링하거나 호출하지 않는다. `supported_color_modes`에 `color_temp`가 있을 때만 색온도를, `hs`가 있을 때만 컬러 프리셋을 렌더링한다.
- 상태와 속성은 다음 `hass` 갱신이 유일한 정본이다. 서비스 호출 성공만으로 화면 상태를 확정하지 않는다.

## 상태 의미

| HA 상태/속성 | 목록과 상세 의미 | 조작 가능 여부 |
| --- | --- | --- |
| `state: on` | `켜짐`, “조명이 편안하게 켜져 있어요”를 표시한다. | 전원, 지원되는 slider와 색상 프리셋을 사용한다. |
| `state: off` | `꺼짐`, “조명이 꺼져 있어요”를 표시한다. | 전원만 켤 수 있다. 밝기·색온도·색상은 비활성화하고 `light-disabled-note`로 이유를 연결한다. |
| `state: unavailable` | `연결 끊김`, “조명 연결을 확인해 주세요”를 표시한다. | 전원과 모든 상세 제어를 비활성화한다. |
| `state: unknown` 또는 그 밖의 비-`on` 상태 | 현재 구현에서는 별도 오류 상태가 아니라 OFF 경로(`꺼짐`)로 해석한다. | 밝기·색온도·색상은 비활성화하지만 전원 스위치는 `light.turn_on`을 요청할 수 있다. |

- `brightness`와 `color_temp_kelvin`이 숫자가 아니면 출력은 `—`이다. 기본 slider 위치는 각각 50%와 3000K일 수 있으나 값이 없는 것을 실제 값처럼 출력하지 않는다.
- 알려진 제약: `unknown`을 `unavailable`과 다르게 표시하지 않으며, 비-`on` 상태에 숫자 속성이 남아 있으면 출력에는 그 숫자가 보일 수 있다. 실기기 OFF의 마지막 검증 상태는 brightness/color temperature/HS가 `null`이었다. 외부 Tapo 왕복 지연은 spinner로 추측하지 않고 다음 `hass` 상태로만 확정한다.

## 동작 계약

- 목록은 click, `Enter`, `Space`로 상세 모달을 열고 `aria-expanded`를 갱신한다. 열리면 닫기 버튼에 초점을 둔다. 닫기 버튼, backdrop, `Escape`로 닫을 수 있으며, 닫힌 뒤 연 launcher에 초점을 돌린다.
- 전원 ON은 `light.turn_on`에 `entity_id`만 보내고, 전원 OFF는 `light.turn_off`에 `entity_id`와 `transition: 0.3`을 보낸다. 밝기·색온도·색상 변경의 transition 계약과 전원 ON payload를 혼동하지 않는다.
- 밝기 range는 `1–100`, step `1`이다. `input`은 `%` 미리보기와 `aria-valuetext`만 갱신하고, `change` 한 번에 `light.turn_on`의 `brightness_pct`와 `transition: 0.3`을 호출한다.
- 색온도 range는 장치의 `min_color_temp_kelvin`/`max_color_temp_kelvin`, step `100`을 사용한다. `input`은 K와 `따뜻함`(<3000)·`중간`(<5000)·`선명함` 미리보기만 바꾸며, `change`에서 `color_temp_kelvin`과 `transition: 0.3`을 보낸다.
- 컬러 프리셋(노을, 살구, 초록, 파랑, 보라)은 선택한 HS 값과 `transition: 0.3`으로 `light.turn_on`을 호출한다. 선택 표시는 현재 `color_mode: hs`, hue 원형 거리 12 미만, saturation 40 초과일 때만 켠다.

## 반응형과 접근성

- 목록은 모든 폭에서 하나의 `role="button"` dialog launcher이며, 좁은 host(280px 이하)에서는 공통 compact 규칙에 따라 한 줄 요약과 ellipsis를 사용한다. 모달은 `min(620px, 100vw - 24px)`, 작은 화면에서는 `100vw - 16px` 안에 놓고 모달 내부만 세로 스크롤한다.
- 전원과 닫기 버튼, range, 컬러 프리셋의 조작 목표는 최소 44px이다. 전원은 `button[role="switch"]`와 `aria-checked`를, range는 native keyboard semantics 및 단위가 포함된 `aria-valuetext`를 사용한다.
- 색상 프리셋은 이름과 `aria-pressed`를 제공하므로 색만으로 선택 상태를 전달하지 않는다. 장식 히어로 이미지는 빈 `alt`이고, 상태는 텍스트로 전달한다.
- 명확한 `:focus-visible` ring, dialog 제목 참조(`aria-labelledby`), native dialog focus trap을 유지한다. `prefers-reduced-motion: reduce`에서는 이미지·switch·기타 전환을 제거한다.

## 소스 소유권과 배포 정본

| 책임 | 정본 파일 |
| --- | --- |
| HA 상태 해석, 서비스 호출, config form, dialog/초점 수명주기 | [`www/ha-design/ha-design-light-card.js`](../../www/ha-design/ha-design-light-card.js) |
| 상세 DOM, 문구, ARIA, capability 조건부 섹션 | [`www/ha-design/ha-design-light-card.template.js`](../../www/ha-design/ha-design-light-card.template.js) |
| 조명 표현, 모달, 44px target, 반응형·reduced motion | [`www/ha-design/ha-design-light-card.styles.js`](../../www/ha-design/ha-design-light-card.styles.js) |
| 공통 compact DOM, 높이, 폭 적응, focus ring | [`www/ha-design/ha-design-device-compact.js`](../../www/ha-design/ha-design-device-compact.js), [공통 계약](shared.md) |
| 대시보드 인스턴스 entity/title/hero 설정 | [`dashboards/ha-design.yaml`](../../dashboards/ha-design.yaml), [`dashboards/ha-design-inline.yaml`](../../dashboards/ha-design-inline.yaml) |

실제 Lovelace module URL, resource ID, 구현 revision과 cache-bust 값의 유일한 정본은 [`dashboards/ha-design-light-resource.yaml`](../../dashboards/ha-design-light-resource.yaml)이다. 이 계약에는 변경 가능한 SHA나 query 값을 복사하지 않는다. 조명과 에어컨 resource는 같은 구현 revision을 가리켜야 한다.

## 정확한 회귀 게이트

```sh
node tools/light-deployment-test.mjs
node tools/device-compact-contract-test.mjs
node --check www/ha-design/ha-design-light-card.js
node --check www/ha-design/ha-design-light-card.template.js
node --check www/ha-design/ha-design-light-card.styles.js
```

- [`tools/light-deployment-test.mjs`](../../tools/light-deployment-test.mjs)는 bedroom 배포, native card 사용, resource URL 형식, capability/transition, compact 구조, gold 대비, reduced motion을 검사한다.
- [`tools/light-interaction-test.html`](../../tools/light-interaction-test.html)는 mock `hass`에서 OFF/ON, dialog와 초점 복귀, slider preview와 단일 `change` 서비스 호출, HS payload, 44px target을 브라우저로 검사한다.
- [`tools/device-compact-contract-test.mjs`](../../tools/device-compact-contract-test.mjs)와 [`tools/device-compact-visual-test.html`](../../tools/device-compact-visual-test.html)는 공통 hero/tail·동일 revision·desktop/iPhone WebKit 표면을 검사한다.

## 라이브 QA 체크리스트

1. 조작 전에 `light.anbang_jomyeong`의 state와 brightness, color temperature, HS 값을 기록한다.
2. 실제 `안방` Sections view에서 조명 카드 1개, `164px` 높이, hero `154px`, 빈 tail `10px`, 목록 내부 즉시 제어 0개와 구성 오류 0개를 확인한다.
3. OFF, ON, `unavailable`을 각각 확인한다. OFF에서는 `—`와 비활성 이유, unavailable에서는 모든 제어 비활성, ON에서는 실제 capability 섹션만 표시되어야 한다.
4. keyboard로 모달을 열고 닫아 close-button 초기 초점, `aria-expanded`, Escape/backdrop 닫기와 launcher 초점 복귀를 확인한다.
5. 밝기·색온도는 drag 중 서비스 호출 없이 preview만 바뀌고 release/change에서 한 번의 올바른 payload가 나오는지, 컬러 프리셋과 전원이 다음 HA 상태 갱신에 동기화되는지 확인한다.
6. desktop과 iPhone WebKit에서 가로 overflow 없이 44px 조작점, dialog 내부 스크롤, reduced-motion을 확인한다. 실제 서비스를 호출했다면 1단계의 원래 상태로 복원한다.

## 근거와 알려진 범위

`PROJECT-STATUS.md`의 **2026-08-26 stable DOM 실서버 배포**는 실제 HA에서 compact `492×164px`, OFF/ON 모달, `aria-checked`, 44px 전원 target, 초점 복귀 및 최종 OFF/null 상태를 기록한다. 이후 **2026-08-27 adaptive compact 실서버 배포**는 Sections 폭 적응과 `164px` 높이 불변을 기록한다. 라이브 상태는 시간이 지나므로 이 날짜 증거를 현재 상태의 대체물로 사용하지 말고 위 QA를 다시 수행한다.
