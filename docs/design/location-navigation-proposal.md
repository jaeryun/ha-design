# 장소 중심 홈 메뉴 제안

상태: `A. 장소 탭`을 승인해 2026-10-13 저장소 dashboard에 반영했다. 승인된 순서는 `거실 / 안방 / 아기방 / 주방 / 다용도실`이고 `전체` view는 두지 않는다. 아래 A/B/C 비교는 승인 전 검토 기록이다. 실제 `ha_design` storage 저장과 실서버 QA는 [PROJECT-STATUS.md의 2026-10-13 항목](../../PROJECT-STATUS.md)을 따른다.

## 결정 기록

- 채택: `A. 장소 탭`. 첫 화면 `전체` 요약은 사용자 결정으로 제외했다.
- view 경로: `living-room`, `bedroom`, `baby-room`, `kitchen`, `utility-room`.
- 반영 범위: `dashboards/ha-design.yaml`, `dashboards/ha-design-inline.yaml`, 그리고 live view를 정의하던 도메인별 `dashboards/ha-design-*.yaml`의 view 래퍼 제거.
- 변경하지 않은 것: custom card JavaScript, entity 매핑, compact `164px` 문법, 카드별 기본 `grid_options.columns`, 상세 모달 동작.

## 목표

현재 기기 종류가 중심인 `안방 / 에어컨 / 커튼 / 냉장 기기 / 세탁기 / 공기청정기 / 카메라` 구조를
사람이 집을 떠올리는 순서인 `거실 / 안방 / 아기방 / 주방 / 다용도실` 구조로 바꾼다.

## 기기 배치

| 장소 | 기기 |
|---|---|
| 거실 | 에어컨, 커튼, 공기청정기, 거실 카메라 |
| 안방 | 조명, 에어컨, 커튼 |
| 주방 | 냉장고, 김치냉장고 |
| 다용도실 | 세탁기 |
| 아기방 | 아기 카메라 |

## 비교안

### A. 장소 탭

- Home Assistant의 view 자체를 장소별로 나눈다.
- 첫 화면인 `전체`에는 장소별 핵심 상태만 요약하고, 각 장소 탭에는 기존 compact card를 그대로 둔다.
- 현재 기기 종류 탭과 가장 비슷하게 작동하므로 학습 비용과 구현 위험이 가장 낮다.
- 모바일에서는 Home Assistant가 소유하는 가로 탭 스크롤을 그대로 사용한다.

### B. 한 화면 장소 섹션

- view는 `홈` 하나만 두고, 장소별 제목 아래에 기기 카드를 모두 배치한다.
- 집 전체를 한 번에 훑기 쉽지만 기기가 늘수록 세로 스크롤이 길어진다.
- 상단 장소 바로가기는 본문 위치로 이동하는 보조 탐색이다.

### C. 장소 카드 허브

- 첫 화면에는 장소별 요약 카드만 둔다.
- 장소 카드를 누르면 해당 장소 상세 view로 이동한다.
- 가장 차분하고 확장성이 높지만, 기기 제어까지 한 번 더 눌러야 한다.

## 채택 결과

**A. 장소 탭**을 채택했다. 현재 대시보드의 compact card와 상세 모달 계약을 바꾸지 않고 view의 분류와 순서만 재구성할 수 있으며, 자주 쓰는 장소로 바로 이동할 수 있다.

`전체` 요약 view는 사용자 결정으로 두지 않는다. 집 전체 요약이 필요해지면 별도 view가 아니라 장소 view 안의 상태 표현으로 해결한다.

## 공간 계약

- 채택 패턴: StyleGallery `tab-strip` + `card-grid`
- 문제: 동등한 장소 탐색을 안정적으로 유지하고, 각 장소 안에서 반복되는 기기 카드를 정렬한다.
- 스크롤 소유권: 데스크톱은 문서 본문만 세로 스크롤한다. 모바일 상단 view 탭의 가로 스크롤은 Home Assistant가 소유한다.
- 읽기·초점 순서: `거실 → 안방 → 아기방 → 주방 → 다용도실` 순서를 DOM과 시각 순서에서 동일하게 유지한다.
- production card의 `164px` 높이, `24px` radius, 전체 카드 launcher, 상세 모달 동작은 변경하지 않는다.
- 위치 정보는 장소 제목과 각 카드의 eyebrow에 중복 제공하여 색이나 배치만으로 의미를 전달하지 않는다.
- 비교 시안의 보조 텍스트는 크림·눌림 배경에서 WCAG AA를 충족하도록 `#6B675F`를 사용한다. 기존 전역
  `--text-secondary` 값의 보정 여부는 아직 결정하지 않았다.

## 승인 후 변경 범위

- 완료: `dashboards/ha-design.yaml`, `dashboards/ha-design-inline.yaml`, 도메인별 `dashboards/ha-design-*.yaml`의 view 래퍼 제거
- 남음: 실제 `ha_design` storage dashboard view 구성 저장과 실서버 QA

custom card JavaScript와 실제 기기 entity 연결은 변경하지 않는다.

