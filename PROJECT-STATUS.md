# ha-design 작업 현황과 인수인계

새 세션은 이 문서를 먼저 읽고 실제 Home Assistant 상태를 다시 확인한 뒤 작업한다. 사용자별 주소·인증 정보는 저장소에 기록하지 않는다.

## 현재 배포 기준

- 브랜치: `main`
- 조명 구현 커밋: `a578be4`
- 실제 storage 대시보드: `ha_design`
- 실제 Lovelace view:
  - `안방` (`bedroom`) — `custom:ha-design-light-card` 1개
  - `에어컨` (`climate`) — 기존 `custom:ha-design-climate-card` 2개
- 조명 resource ID: `20d0fc1d032d47588004f43531b56c5e`
- 조명 resource URL: `a578be4` 고정 + `?v=light-mobile-20260825-3`
- 대시보드 registry는 `dashboard_unknown`, `ha_design` 두 개를 유지한다.

## 완료된 안방 조명 UI

### 실제 기기 계약

- 엔티티: `light.anbang_anbang_jomyeong`
- 통합: SmartThings
- 지원 기능:
  - 전원
  - 밝기
  - 색온도 `2000–9000K`
  - HS 색상
  - transition
- 미지원 기능: effect, flash
- 이름이 비슷한 `light.geosil_anbang_jomyeong`은 대상이 아니며 변경하지 않는다.

### 사용자 표면

- compact 카드:
  - 상태 반영 안방 히어로
  - `안방 조명` 제목과 상태 문장
  - 밝기·색온도 요약
  - 44px 전원 스위치
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

- `www/ha-design/ha-design-light-card.js` — HA 상태·서비스·초점 수명주기
- `www/ha-design/ha-design-light-card.template.js` — 의미 구조·ARIA
- `www/ha-design/ha-design-light-card.styles.js` — warm-editorial 표현·반응형
- `dashboards/ha-design.yaml` — 현재 전체 대시보드 예시
- `dashboards/ha-design-inline.yaml` — Raw 구성 편집기용
- `dashboards/ha-design-light-resource.yaml` — 실제 resource ID/URL 계약
- `tools/light-deployment-test.mjs` — 배포·접근성 계약
- `tools/light-interaction-test.html` — mock HA 브라우저 상호작용

## 검증된 증거

- `node tools/light-deployment-test.mjs` → PASS
- `node tools/climate-deployment-test.mjs` → PASS
- 모든 새 JavaScript 모듈 `node --check` → PASS
- Chromium 1440×900 상호작용 표면 → PASS
- Playwright WebKit `iPhone 15` 393 CSS px 표면 → PASS
- 실제 HA desktop:
  - compact, OFF 모달, ON 컬러 모달 렌더 확인
  - `구성 오류` 없음
  - 전원·밝기·색온도·HS 컬러 `state_changed` 확인
  - compact 제목의 최종 computed color `rgb(26, 26, 24)`
  - 최종 전원 hit area `44px`, `aria-expanded`, 초기 close focus 확인
- 실제 기기 최종 상태: `off`, brightness/color temperature/HS `null`
- 기존 climate view와 다른 dashboard는 변경되지 않았다.

## 다음 세션 시작 절차

1. `git status --short --branch`와 `git rev-parse HEAD` 확인
2. 실제 light resource ID/URL과 `ha_design` 두 view 확인
3. `light.anbang_anbang_jomyeong` 상태를 조작 전에 저장
4. 아래 검증 명령을 먼저 실행
5. 새 모듈 배포 시 구현 커밋을 먼저 push하고, 40자리 SHA와 새 cache-bust query로 resource를 갱신
6. 실제 UI QA 후 원래 기기 상태 복원

```sh
node tools/light-deployment-test.mjs
node tools/climate-deployment-test.mjs
node --check www/ha-design/ha-design-light-card.js
node --check www/ha-design/ha-design-light-card.template.js
node --check www/ha-design/ha-design-light-card.styles.js
git diff --check
```

## 보호 규칙

- `ha_design` 밖의 dashboard를 변경하지 않는다.
- `climate` view를 조명 작업 중 수정하지 않는다.
- live 서비스 호출 전 정확한 엔티티 상태를 저장하고 완료 시 복원한다.
- source URL은 commit SHA에 고정하고 iOS cache-bust query를 매 배포마다 올린다.
- 디버그 파일과 스크린샷은 저장소에 남기지 않는다.

## 남은 부채

- 실제 SmartThings 응답 지연은 외부 왕복에 의존하며 별도 로딩 스피너 없이 다음 HA 상태 갱신으로 확정한다.
- 기존 `www/ha-design/templates.yaml`과 조명 ON/OFF SVG 두 장은 Phase 1 호환 자료로 남아 있지만 현재 live card는 button-card를 사용하지 않는다.
