# 배포 전략 (Deployment & Testing)

> 원칙: **웹 GUI에서만 하는 흐름** (터미널·수동 파일 복사 없음).
> Raw 구성 편집기 붙여넣기 + 미디어 업로더로 끝낸다.

---

## 표준 배포 흐름 (100% 웹 GUI)

### 1. 커스텀 카드 설치 — HACS (GUI)
HACS → Frontend → 검색 후 다운로드:
- **button-card** (custom:button-card)

HACS가 리소스를 자동 등록. 설치 후 브라우저 캐시 새로고침(Ctrl+F5).

### 2. 테마 설치 — HACS (GUI, 권장)
HACS → Frontend → ⋮ → **사용자 지정 저장소** → `https://github.com/jaeryun/ha-design` 추가 (유형: **테마**) → "Warm Editorial" 다운로드.

테마 인식을 위해 configuration.yaml에 한 줄이 필요한데, 이것도 GUI로 한다:
- 애드온 **File editor**(또는 Studio Code Server) 설치 → 웹에서 configuration.yaml 열어 추가:
  ```yaml
  frontend:
    themes: !include_dirmerge_named themes
  ```
- 개발자 도구 → YAML → **테마 다시 불러오기** → 프로필 → 테마 → **Warm Editorial**

※ 테마는 전역 폰트/배경을 담당. 생략해도 카드 자체 디자인은 동작함(배경만 HA 기본색).

### 3. 대시보드 — Raw 구성 편집기에 통째로 붙여넣기 (파일 0개)
1. 대시보드 편집(연필) → 우상단 ⋮ → **Raw 구성 편집기**
2. **`dashboards/ha-design-inline.yaml`** 내용 전체를 붙여넣기
   → 템플릿 5종이 파일 안에 인라인되어 있어 별도 파일·업로드가 필요 없음
3. `light.bedroom`(2곳)을 실제 안방 조명 엔티티로 치환 → 저장 (카드는 이미지 깨진 상태로 표시됨 — 4번에서 해결)

### 4. 확인
조명 토글 → 히어로 사진(밝은 방 ↔ 어두운 방)·헤드라인·배지가 즉시 교체되는가.

### 업데이트 흐름
repo에서 새 버전의 `ha-design-inline.yaml`을 받아 다시 붙여넣기(또는 해당 카드만 교체).
이미지 교체는 미디어에서 재업로드.

---

## 공개 배포 이후 (오픈소스 공유 시 더 줄어듦)

- 템플릿을 raw URL로도 로드 가능 (이미 이 repo로 동작함):
  ```yaml
  button_card_templates_url:
    - https://raw.githubusercontent.com/jaeryun/ha-design/main/www/ha-design/templates.yaml
  ```
  이 경우 사용자는 템플릿 붙여넣기조차 URL 한 줄로 대체 (button-card 공식 기능).
- **Phase 2**: 핵심 카드를 TS 네이티브 JS 커스텀 카드로 포팅해 HACS 카드로 배포하면
  템플릿 개념 자체가 사라지고 "HACS 설치 → UI에서 카드 추가"만 남는다 (최종 목표).
  GitHub 저장소가 준비됐으므로 카드 구현 후 HACS 기본 저장소 등록을 신청할 수 있다.

---

## 부록 — 파일을 직접 두고 싶은 경우 (선택)

- `/config/www/ha-design/` 폴더(templates.yaml + images)를 두면
  `button_card_templates_url: [/local/ha-design/templates.yaml]`로 템플릿을 파일에서 로드하고
  이미지도 `/local/ha-design/images/...` 경로를 쓸 수 있다. 폴더 복사는 Samba/파일편집기 애드온으로 가능.
- YAML 모드 파워유저는 repo를 통째로 클론해 `!include` 방식도 가능 (단, repo 안 www/는
  /local로 서뵹되지 않으므로 이미지는 별도 복사 필요).

## 브랜치별 테스트 (dev 브랜치에서 실험하기)

- **템플릿(URL 로드)**: 브랜치 자유 — raw URL에 브랜치명만 바꾸면 된다:
  ```yaml
  button_card_templates_url:
    - https://raw.githubusercontent.com/jaeryun/ha-design/dev/www/ha-design/templates.yaml
  ```
  dev에서 검증 → main 머지 후 URL을 main으로 되돌림. GitHub raw 캐시 때문에 반영이 몇 분 지연될 수 있다.
- **HACS(테마/카드)**: 브랜치 선택 불가 — 기본 브랜치 또는 릴리스 태그만 추적한다
  (hacs/integration #4203, #935). 브랜치 실험은 (a) 릴리스 태그를 찍어 버전 선택 설치,
  (b) 테마 파일은 raw 내용을 File editor로 themes/ 폴더에 붙여넣는 방식으로 우회.

## 설치 형태 비교
| 방식 | 사용자 부담 | 비고 |
|---|---|---|
| **Raw 편집기 붙여넣기 + 미디어 업로드** | 낮음 (GUI만) | **표준** |
| GitHub raw URL 템플릿 로드 | 최소 | repo 공개 후 가능 |
| www 폴더 복사 | 중간 | 이미지가 많아질 때 유리 |
| HACS JS 커스텀 카드 (Phase 2) | 최소 | 최종 목표 |
