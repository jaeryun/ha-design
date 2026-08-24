# 배포 전략 (Deployment & Testing)

> 표준 흐름은 **HACS + `/config/www` 폴더 + 대시보드 Raw 편집기 붙여넣기**.
> 파일을 configuration.yaml에 직접 연결하는 YAML 모드 방식은 부록으로만 유지.

---

## 표준 배포 흐름 (storage/UI 모드 — 대부분의 사용자)

### 0. 전제: HACS 설치 (최초 1회)
HACS 미설치 시 [hacs.xyz](https://hacs.xyz/docs/use/download/download/) 안 따라 설치.

### 1. 커스텀 카드 설치 (HACS — 파일 업로드 불필요)
HACS → Frontend → 각각 검색 후 다운로드:
- **button-card** (custom:button-card)
- **card-mod**
- **stack-in-card**

HACS가 리소스를 자동 등록하므로 JS 파일을 직접 다루는 일은 없음. 설치 후 브라우저 캐시 새로고침.

### 2. 테마 설치 (HACS)
HACS → Frontend → 우상단 ⋮ → **사용자 지정 저장소** → 이 repo URL 추가 (유형: **테마**) →
"Warm Editorial" 다운로드.

테마 로딩을 위해 configuration.yaml에 아래 **한 줄만** 필요 (HA 표준 요구사항):
```yaml
frontend:
  themes: !include_dirmerge_named themes
```
→ 프로필 → 테마 → **Warm Editorial** 선택.

### 3. 템플릿 + 이미지 설치 (`/config/www` 폴더 1개)
repo의 `www/ha-design/` 폴더를 HA의 `/config/www/ha-design/` 으로 복사.
- 방법 a: Samba/파일편집기로 폴더째 업로드
- 방법 b: HA 터미널에서
  ```bash
  cd /config/www
  git clone https://github.com/<you>/ha-design.git ha-design-tmp && cp -r ha-design-tmp/www/ha-design . && rm -rf ha-design-tmp
  ```

이 폴더 하나로 두 가지가 해결된다:
- `templates.yaml` → `/local/ha-design/templates.yaml` (button-card가 URL에서 템플릿 로드)
- `images/` → `/local/ha-design/images/...` (카드 배경 이미지)

### 4. 대시보드 만들기 (Raw 구성 편집기에 붙여넣기)
1. 사이드바 → 대시보드 편집(연필) → 우상단 ⋮ → **Raw 구성 편집기**
2. `dashboards/ha-design.yaml` 내용 전체를 붙여넣기
   (첫 줄의 `button_card_templates_url:` 가 템플릿을 자동 로드 — 템플릿을 붙여넣을 필요 없음)
3. `light.bedroom`을 실제 엔티티로 치환 → 저장

### 업데이트 흐름
```
repo push → /config/www/ha-design 만 갱신 (git pull 또는 재복사)
→ 대시보드 새로고침 (템플릿은 URL 로드라 즉시 반영)
```

### 테스트 체크리스트 (Phase 1)
1. 테마 적용: 배경이 크림색(#F0EDE7)으로 바뀌는가
2. 폰트: Pretendard 헤드라인 ExtraBold 렌더링
3. **조명 데모 카드 실측**:
   - 조명 ON: 밝은 방 이미지 + "안방 조명이 켜져 있어요" + "켜짐" 배지
   - 조명 OFF: 어두운 방 이미지 + "꺼져 있어요" + "꺼짐" 배지 — **토글 시 사진이 즉시 교체되는가**
   - 하단 행 탭으로 조명이 실제 토글되는가
4. 모바일(Fold) 2단 그리드 + 좁은 화면 폴백
5. 문제 시: 브라우저 콘솔 확인 (custom:button-card 미설치 · /local 경로 404가 최다 원인)

---

## Phase 2 — 오픈소스 공유 (HACS)

핵심 카드(히어로/칩/상태행)를 **네이티브 JS 커스텀 카드**로 포팅하면 3~4단계가 소멸한다:
사용자는 HACS에서 카드 설치 → UI에서 카드 추가만 하면 끝. 템플릿 URL도 불필요.

```
dist/ha-design.js          # esbuild 번들 (customElements.define)
src/                       # TS 소스 (hero-card, chip-row, status-row)
hacs.json                  # 카드(lovelace) 카테고리로 전환
```

마이그레이션 순서: 조명 카드 포팅 → 에너지/차량/미디어 → v0.1.0 태그 → HACS 기본 저장소 등록 신청.

---

## 부록 — YAML 모드 (파워유저)

`lovelace: mode: yaml` 사용자는:
```yaml
# ui-lovelace.yaml 또는 대시보드 파일 상단
button_card_templates: !include ha-design/www/ha-design/templates.yaml
```
repo를 `/config/ha-design`에 클론해 두고 상대 경로 include. 이 경우 이미지는 별도로
`/config/www/ha-design/`에 있어야 `/local/`로 서뵹된다 (repo 안 www/는 서뵹 안 됨에 주의).

## 설치 형태 비교
| 방식 | 사용자 부담 | 업데이트 | 비고 |
|---|---|---|---|
| **HACS(테마) + www 폴더 + raw 붙여넣기** | 낮음 | www 폴더만 갱신 | **표준 (권장)** |
| YAML 모드 + git clone | 높음 | git pull | 파워유저 한정 |
| HACS JS 커스텀 카드 (Phase 2) | 최소 | HACS 자동 | 최종 목표 |
