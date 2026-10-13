# 공통 compact·modal 운영 계약

## 목적과 범위

`ha-design`의 기기 카드는 폭이 달라도 한 장의 사진 중심 launcher 문법과 상세 modal 진입점을 유지한다. 이 계약은 새 카드가 기존 조명·에어컨 등 기존 카드를 깨지 않고 공통 기반을 재사용하게 하는 기준이다. HA custom-card와 Sections 완료 기준은 [HA 표준](../../HA-STANDARD.md), 시각·상호작용 원칙은 [디자인 시스템](../../DESIGN.md), 설치·배포는 [README](../../README.md)와 [배포 문서](../../DEPLOYMENT.md)를 따른다.

## 공통 primitive

- `www/ha-design/ha-design-device-compact.js`는 `DEVICE_COMPACT_HERO_HEIGHT`, `DEVICE_COMPACT_TAIL_HEIGHT`, `deviceCompactStyles`, `renderDeviceCompact()`, `escapeDeviceText()`, `patchCardDom()`의 소유자다.
- `renderDeviceCompact()`에는 visual, eyebrow, title, badge, wide 상태 배열, `narrowStatusItem`, 상세 UI만 전달한다. 공통 renderer가 hero/copy/tail DOM과 상태 텍스트 escape를 만든다.
- `deviceCompactStyles`를 import해 공통 surface, radius, shadow, 전체 경계 focus ring, typography와 container query를 공유한다.
- modal은 native `<dialog>`를 사용한다. launcher 전체가 단일 진입점이며, 상세 내용만 modal 안에 둔다.

## geometry·반응형·DOM

- compact는 모든 폭에서 hero `154px` + 비어 있는 흰 tail `10px` = `164px`다. radius는 `24px`이며 host는 할당된 폭 `100%`를 채운다.
- 실제 host 폭이 `280px` 이하면 inset `12px`, title `20px`, compact badge와 한 개의 한 줄 ellipsis 상태를 사용한다. 초과 폭에서는 wide 상태 배열을 보인다. explicit wide/tile variant나 설정 필드는 없다.
- 4~12 Sections columns와 중간 폭에서도 같은 DOM을 유지한다. resize가 launcher, dialog, focus 또는 scroll state를 교체해서는 안 된다. Masonry에서는 HA가 `grid_options`를 무시하므로 해당 column 규칙을 강제하지 않는다.
- 공통 목표는 상태 갱신 뒤에도 열린 dialog, modal scroll, focus와 재생 상태를 보존하는 것이다. 여러 카드는 `patchCardDom()`으로 기존 DOM을 patch하지만, 조명 카드는 현재 `shadowRoot.innerHTML`을 교체한 뒤 dialog·focus를 복원한다. 따라서 모든 카드가 같은 DOM node identity를 보존한다고 가정하지 말고, 각 도메인 계약과 stable-DOM 테스트 범위를 확인한다.
- Sections view에서는 카드가 `getGridOptions()`로 `min_columns: 4`, `max_columns: 12`를 제공하고 dashboard에는 `grid_options.columns` 및 `grid_options.rows: auto`를 명시한다. 기본 columns는 카드별 책임이다.

## modal·focus·상태 의미

- launcher는 `role="button"`, `tabindex="0"`, `aria-haspopup="dialog"`, `aria-controls`, 실제 열린 상태의 `aria-expanded`를 제공한다. click, `Enter`, `Space`가 같은 modal을 연다.
- 열 때 native dialog top layer를 사용하고 첫 닫기 버튼으로 focus를 이동한다. 닫기 버튼, backdrop click, `Escape`를 지원하고 닫힌 뒤 **현재** launcher에 focus를 돌린 뒤 `aria-expanded="false"`로 맞춘다.
- 문서 배경은 modal이 열린 동안 잠그고, modal detail의 단일 scroll owner만 `max-height: calc(100dvh - 24px)` 안에서 세로 scroll을 가진다.
- HA의 다음 `hass` 상태가 권위 원천이다. 요청 중 UI preview가 필요한 control은 해당 입력 수명 안에서만 유지하고, 임의의 성공 상태를 확정하지 않는다. `unknown`, `unavailable`, 데이터 미수신, idle, 실제 값 및 기능 미지원을 구분한다.

## 접근성

- 모든 조작점은 최소 `44×44px`이고 `:focus-visible`이 명확해야 한다. 색만으로 상태를 전달하지 말고 text와 적절한 ARIA 상태를 함께 제공한다.
- 장식 hero 이미지는 빈 대체 텍스트로 처리하고 상태는 텍스트로 전달한다. switch는 `role="switch"`/`aria-checked`, range는 native keyboard semantics와 단위가 있는 `aria-valuetext`, tab은 roving tab semantics를 유지한다.
- 전원 OFF 또는 지원하지 않는 기능은 control을 비활성화하거나 렌더하지 않으며, 비활성 사유를 읽을 수 있는 텍스트로 제공한다. `prefers-reduced-motion: reduce`에서는 전환을 제거한다.

## 확장 규칙

1. 새 기기 카드에서 공통 hero/tail 높이, radius, copy markup, adaptive query, wide/tile 분기를 재선언하지 않는다.
   - 예외: 방 온습도 카드처럼 승인된 레이아웃(큰 숫자 우선)이 `renderDeviceCompact()`의 고정 copy 모델로 표현되지 않으면 copy DOM만 자체 마크업으로 둘 수 있다. 이때도 `DEVICE_COMPACT_HERO_HEIGHT`·`DEVICE_COMPACT_TAIL_HEIGHT`·`deviceCompactStyles`·`escapeDeviceText()`·`patchCardDom()`은 그대로 재사용하고, `164px` 높이·`24px` radius·adaptive container query·launcher 단일 진입점은 다시 선언하지 않는다. 예외는 해당 도메인 계약(예: [방 온습도](temp-humidity.md))에 이유와 범위를 적는다.
2. 기기별 scene, eyebrow/title/badge, 상태 문자열, capability-gated detail UI와 서비스 매핑만 추가한다. 실제 entity attributes·`supported_features`·service 계약으로 capability를 판정한다.
3. 목록에는 전원, slider 등 즉시 제어 또는 인라인 확장을 넣지 않는다. compact 전체는 상세 modal을 여는 하나의 launcher다.
4. import하는 공통 module과 해당 live resource의 하위 module은 같은 구현 revision을 가리켜야 한다. 배포 URL은 움직이는 branch URL 대신 배포한 구현의 40자리 commit SHA와 새 cache-bust query를 사용한다.
5. 카드 API, visual editor, picker metadata, Sections sizing을 변경하면 [HA 표준](../../HA-STANDARD.md)의 완료 조건과 실제 HA resize·복원 QA까지 수행한다.

## 검증

공통 계약과 Sections YAML은 아래 명령을 모두 통과해야 한다.

```sh
node tools/device-compact-contract-test.mjs
node tools/sections-resize-contract-test.mjs
```

브라우저에서는 `tools/device-compact-visual-test.html`에서 desktop과 iPhone WebKit의 `PASS`를 확인한다. 폭 변경과 열린 modal 상태를 함께 바꾼 경우 `tools/adaptive-compact-test.html` 및 `tools/stable-dom-test.html`도 `PASS`여야 한다.

관련 소스: `www/ha-design/ha-design-device-compact.js`, 조명 `ha-design-light-card.js`·`.template.js`·`.styles.js`, 에어컨 `ha-design-climate-card.js`, `dashboards/ha-design.yaml`, `dashboards/ha-design-inline.yaml`.
