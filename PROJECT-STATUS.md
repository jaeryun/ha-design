# ha-design 작업 현황과 인수인계

이 문서는 새 세션이 저장소와 실제 Home Assistant 상태를 다시 추측하지 않고 작업을 이어가기 위한 기준 문서다. 사용자별 주소나 인증 정보는 기록하지 않는다.

## 현재 기준

- 브랜치: `main`
- 배포 기준 커밋: `a7ec0bd`
- 실제 대시보드: storage 모드 `ha_design`
- 유지해야 할 기존 view:
  - `안방` (`bedroom`) — 조명 카드 1개
  - `에어컨` (`climate`) — 에어컨 카드 2개
- 대시보드 밖의 다른 dashboard와 view는 변경하지 않는다.

## 완료된 기능

### 안방 조명 1차 버전

- 실제 엔티티: `light.anbang_anbang_jomyeong`
- 구현: `custom:button-card` 기반 단일 카드
- 상태별 밝은 방/어두운 방 히어로와 ON/OFF 토글 동작 확인
- 저장소 기준 파일:
  - `dashboards/ha-design.yaml`
  - `dashboards/ha-design-inline.yaml`
  - `www/ha-design/templates.yaml`

이 버전은 기능 확인용 기준선이다. 다음 작업에서는 실제 엔티티의 현재 지원 기능을 다시 조회한 뒤 네이티브 커스텀 카드로 교체한다.

### 에어컨 카드

- 구현: `www/ha-design/ha-design-climate-card.js`
- 실제 `거실 에어컨`, `안방 에어컨` 카드와 중앙 상세 모달 배포 완료
- iPhone Companion 앱의 `구성 오류` 원인은 1년 `immutable`로 캐시된 Lovelace 모듈 URL이었다.
- 해결: 기존 리소스 ID를 유지하고 URL에 `?v=mobile-cache-20260825-1`을 추가해 캐시를 갱신했다.
- 배포 계약: `dashboards/ha-design-resource.yaml`
- 회귀 검사: `node tools/climate-deployment-test.mjs`
- 실제 iPhone 정상 렌더 확인 완료

## 다음 작업: 안방 조명 네이티브 UI

아래 순서를 바꾸지 않는다.

1. **기능 조사**
   - 실제 `light.anbang_anbang_jomyeong` 상태와 속성을 먼저 저장한다.
   - 밝기, 색온도, 색상, 효과 등 실제 지원 범위만 UI에 노출한다.
   - 조작 전 상태를 복원 기준으로 기록한다.
2. **기준 화면과 코드 조사**
   - 현재 `안방` view를 캡처한다.
   - 기존 button-card 템플릿과 에어컨 네이티브 카드의 배포 구조를 비교한다.
3. **설계**
   - `DESIGN.md`의 warm-editorial 문법을 유지한다.
   - 조명 전용 골드 액센트, 상태 반영 히어로, 최소 44px 조작점, reduced-motion 규칙을 먼저 문서화한다.
4. **테스트 우선**
   - 배포 계약 또는 상호작용 테스트를 먼저 작성하고 의도한 이유로 실패하는지 확인한다.
5. **최소 구현**
   - 실제 지원 기능만 구현한다.
   - `ha_design`의 기존 `안방` view와 필요한 Lovelace resource만 바꾼다.
6. **검증과 배포**
   - 정적 검사, 상호작용 테스트, 데스크톱과 iPhone 크기 실제 브라우저 QA를 통과한다.
   - 다른 dashboard와 `에어컨` view가 그대로인지 확인한다.
   - 실제 조명 상태를 조사 전 값으로 복원한다.
7. **정리**
   - 임시 서버, 스크린샷, 테스트 산출물을 제거한다.
   - 검증된 변경만 커밋하고 원격 저장소에 반영한다.

## 필수 보호 규칙

- 실제 기기 조작 전에 엔티티 상태와 모든 복원 가능 속성을 기록한다.
- 테스트 중 서비스 호출은 최소화하고, 완료 시 원래 상태를 복원한다.
- live 배포 전 로컬 카드와 mock Home Assistant 객체로 먼저 상호작용을 검증한다.
- Lovelace 모듈 URL을 갱신할 때는 고유한 버전 쿼리를 사용해 iOS WebView 캐시를 무효화한다.
- 새 카드 때문에 기존 대시보드, view, 기기 상태를 정리하거나 재구성하지 않는다.
- 디버그 파일은 `.git/info/exclude`에 먼저 기록하고 완료 시 파일과 exclude 항목을 함께 제거한다.

## 검증 명령

```sh
node tools/climate-deployment-test.mjs
node --check www/ha-design/ha-design-climate-card.js
git diff --check
git status --short --branch
```

조명 카드가 추가되면 같은 형태의 조명 배포 계약과 상호작용 검사를 이 목록에 추가한다.
