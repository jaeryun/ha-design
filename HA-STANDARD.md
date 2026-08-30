# Home Assistant 표준 custom card 계약

이 문서는 `ha-design` 카드에서 말하는 **HA 표준**의 범위와 완료 조건을 고정한다.
`엔티티가 YAML에 연결됨`만으로 기능 완료를 선언하지 않는다.

## 기준 문서

- Home Assistant Developer Docs — [Custom card](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- Home Assistant Docs — [Sections view](https://www.home-assistant.io/dashboards/sections/)
- Home Assistant Docs — [Selectors](https://www.home-assistant.io/docs/blueprint/selectors/)

## “HA 표준”의 정확한 의미

이 프로젝트의 카드는 Home Assistant core 내장 카드가 아니라 **표준 custom card 확장 API를
사용하는 외부 카드**다.

다음은 현재 준수한다.

1. `customElements.define()`으로 custom element 등록
2. `setConfig(config)`에서 경계 입력 검증 및 잘못된 설정 예외 처리
3. `hass` property 갱신 시 실제 entity 상태 재렌더
4. `getCardSize()`로 Masonry 높이 힌트 제공
5. `getGridOptions()`로 Sections grid 크기 규칙 제공
6. `getConfigForm()`과 HA selector schema로 native visual editor 제공
7. `getStubConfig()`으로 card picker 기본 설정 제공
8. `window.customCards` metadata로 card picker 등록
9. Sections view와 `grid_options`를 사용한 HA native Layout 탭 resize

다음은 별도 범위다.

- 카드 내부 디자인과 상세 dialog는 `ha-design`의 custom UI이며 HA core 기본 widget은 아니다.
- `hacs.json`은 아직 theme package 기준이다. 카드는 Lovelace module resource로 정상 동작하지만,
  HACS frontend plugin 배포 패키징은 아직 완료되지 않았다.

## 카드별 현재 계약

| 카드 | Config form | Stub config | Config/state/sizing API | Picker metadata | Form fields | API 기본 columns | live columns |
|---|---|---|---|---|---:|---:|---:|
| 조명 | 표준 | entity 자동 선택 | 표준 | 표준 | 4 | 12 | 12 |
| 에어컨 | 표준 | entity 자동 선택 | 표준 | 표준 | 18 | 12 | 12 |
| 커튼 | 표준 | curtain entity 자동 선택 | 표준 | 표준 | 11 | 4 | 6 |
| 냉장 기기 | 표준 | 다중 entity용 일반 stub | 표준 | 표준 | 22 | 6 | 6 |
| 세탁기 | 표준 | 다중 entity용 일반 stub | 표준 | 표준 | 26 | 12 | 12 |

냉장 기기와 세탁기는 한 장의 카드가 여러 domain의 entity를 함께 사용한다. 기존 카드의 native
visual editor는 모든 필드를 편집할 수 있지만, 새 카드 추가 시 한 entity만으로 전체 기기 구성을
자동 발견하는 device-aware stub은 제공하지 않는다. 사용자가 visual editor에서 필요한 entity를
선택해야 한다. 이를 “HA 표준 editor 미지원”과 혼동하지 않는다.

## Sections와 resize 계약

- `getGridOptions()`만 구현해서는 실제 resize가 보장되지 않는다.
- resize 대상 view는 반드시 `type: sections`여야 한다.
- 각 live 카드에는 `grid_options.columns`와 `grid_options.rows: auto`를 저장한다.
- 카드 API 범위는 `min_columns: 4`, `max_columns: 12`다.
- 실제 완료 판정은 edit mode의 **레이아웃** 탭에서 columns를 변경하고 저장한 뒤 실제 폭과
  storage config를 확인하고 원래 값으로 복원하는 것이다.
- Masonry view에서는 HA가 `grid_options`를 사용하지 않으므로 resize 불가를 카드 결함으로
  진단하지 않는다.

## Visual editor 완료 조건

소스에 `getConfigForm()`이 존재하는 것만으로 완료하지 않는다.

1. 기존 카드의 edit dialog를 실제 HA에서 연다.
2. `비주얼 편집기가 지원되지 않습니다` 문구가 없는지 확인한다.
3. HA selector, 현재 config 값, live preview가 표시되는지 확인한다.
4. 필드 변경 시 저장 버튼이 활성화되는지 확인하되, QA가 실제 기기 서비스를 호출하지 않도록 한다.
5. picker metadata와 stub을 별도로 검사한다.

## Entity 의미 검증

`unknown`, `unavailable`, `0`은 곧바로 “기능 미지원”이나 실제 측정값으로 해석하지 않는다.

1. entity attributes의 `min`, `max`, `step`, `supported_features`를 확인한다.
2. 실제 HA service 계약을 확인한다.
3. integration 소스와 history를 확인한다.
4. UI에서 기능 미지원, 아직 미설정, idle, 데이터 미수신을 서로 다른 상태로 표현한다.

## 변경 완료 체크리스트

- [ ] 다섯 카드의 `setConfig`, `hass`, `getCardSize`, `getGridOptions` 계약 유지
- [ ] 다섯 카드의 `getConfigForm`, `getStubConfig`, picker metadata 유지
- [ ] 모든 view가 Sections이며 모든 카드가 명시적 `grid_options` 보유
- [ ] visual editor를 기존 냉장·세탁 카드에서 실제로 열어 확인
- [ ] Layout 탭 resize 저장·실측·원복
- [ ] desktop `1440px`와 mobile `375px`에서 가로 overflow 없음
- [ ] 실제 modal에서 happy path와 disabled/unknown 상태 확인
- [ ] QA 후 dashboard config와 실제 기기 상태 원복
- [ ] 관련 `tools/*test.mjs`와 browser contract PASS

## 현재 검증 증거

- 냉장 기기 native editor: 22 fields, unsupported-editor 문구 없음
- 세탁기 native editor: 26 fields, unsupported-editor 문구 없음
- 세탁기 resize: `12 columns / 480px → 6 columns / 236px → 12 columns / 480px`
- 최종 live storage: `grid_options: { columns: 12, rows: auto }`
- 취침 타이머: keyboard number input 0개, `− / +`, `0시간 0분 → 1시간 0분 → 0시간 0분`
- 비조명 desktop/mobile view: 구성 오류 및 가로 overflow 없음
