# 문서 지도와 소유권

문서는 시간이 지나도 유지되는 규칙, 카드별 UI 계약, 현재 배포 상태를 분리한다. 같은 사실을 여러 문서에 복사하지 않는다.

## 시작점

- [프로젝트 README](../README.md): 사용자용 개요와 현재 문서 진입점.
- [배포와 검증](../DEPLOYMENT.md): native card의 설치, 업데이트, 전체 test 실행 절차.
- [HA 표준 계약](../HA-STANDARD.md): 여덟 custom-card 유형이 지켜야 하는 editor, picker, Sections API 완료 조건.
- [현재 상태](../PROJECT-STATUS.md): 현재 dashboard 표면, 다음 작업 주의사항, 날짜가 있는 실서버 검증 이력.
- [서브에이전트 UI 제작·배포 가이드](SUBAGENT-HA-UI-DELIVERY-GUIDE.ko.md): 조사, HTML 시안, 승인, 구현, 검증, 배포, 롤백을 비용 효율적으로 수행하는 실행 절차.

## 정본의 경계

- **현재 resource URL, ID, SHA, cache key:** `dashboards/*-resource.yaml` 여덟 파일이 정본이다. 상태 문서는 이를 복사하지 않는다.
- **대시보드 인스턴스와 entity 연결:** `dashboards/ha-design.yaml`과 `dashboards/ha-design-inline.yaml`이 정본이다. 홈 메뉴의 장소 view(`living-room`, `bedroom`, `baby-room`, `kitchen`, `utility-room`) 순서와 카드 배치도 이 두 파일이 소유한다.
- **공통 UI 규칙:** [공통 compact·modal 계약](contracts/shared.md).
- **도메인 UI와 capability:** [조명](contracts/lighting.md), [에어컨](contracts/climate.md), [커튼](contracts/curtain.md), [냉장 기기](contracts/cold-storage.md), [세탁기](contracts/washer.md), [카메라](contracts/camera.md), [방 온습도](contracts/temp-humidity.md) 계약과 해당 카드 source/test가 정본이다.
- **시간을 초월한 시각·상호작용 원칙:** [DESIGN.md](../DESIGN.md).

## 보관 기록

[Phase 1 button-card 기록](archive/phase-1-button-card.md)은 역사와 호환 자료의 이유만 남긴 비실행 문서다. 현재 설치나 배포에 사용하지 않는다.
