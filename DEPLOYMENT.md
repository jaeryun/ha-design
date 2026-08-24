# 배포 전략 (Deployment & Testing)

> 결정: **Phase 1 = git clone(또는 submodule)로 `/config`에 직접 배포**, Phase 2에서 핵심 카드를
> 네이티브 JS 커스텀 카드로 전환한 뒤 HACS 기본 리포지토리로 등록.
>
> 이유: 현재 설계가 button-card YAML 템플릿 기반이라 HACS의 자동 설치 대상(lovelace resource 등록)이
> 될 수 없음. 테마 파일만 HACS "theme" 카테고리로 줄 수 있지만, 템플릿·대시보드·이미지는 결국
> `/config` 안에 있어야 함 → 지금 단계에선 직접 배포가 가장 빠르고, 실제 HA에서 즉시 테스트 가능.

---

## Phase 1 — 지금 내 HA에서 바로 테스트 (권장 경로)

### A. git clone 방식 (업데이트 편함 — 권장)
```bash
# 1) 저장소를 /config 안으로 클론
cd /config
git clone https://github.com/<you>/ha-design.git

# 2) configuration.yaml 에 아래 스니펫 추가
# themes 불러오기
homeassistant:
  ...
frontend:
  themes: !include_dirmerge_named ha-design/themes

# 3) HA 재시작 (개발자 도구 → YAML 전체 다시 불러오기 로도 테마는 반영됨)
```

- 이미지: `/local/ha-design/images/...` 로 참조 (www 하위이므로)
- button-card 템플릿: 대시보드 YAML 상단에서
  ```yaml
  button_card_templates: !include ha-design/lovelace/templates.yaml
  ```
- 예시 대시보드: `lovelace:` 모드에서 `dashboards`로 등록하거나, UI에서 YAML 모드 대시보드로 파일 참조

### B. submodule 방식 (내 다른 설정 repo와 함께 관리할 때)
```bash
cd /config
git submodule add https://github.com/<you>/ha-design.git ha-design
git commit -m "add ha-design submodule"
```
- 업데이트: `git submodule update --remote ha-design`

### 업데이트 흐름 (Phase 1)
```
개발 Mac: /Users/jerry/dev/ha-design 에서 작업 → push
HA 서버: cd /config/ha-design && git pull → YAML 리로드 → 대시보드 새로고침
```

### 테스트 체크리스트 (Phase 1)
1. 테마 적용: 프로필 → 테마 → "Warm Editorial" 선택 → 배경이 크림색으로 바뀌는가
2. 폰트: Pretendard 로딩 확인 (헤드라인 ExtraBold 렌더링)
3. 템플릿 카드 1개(조명) 삽입 → ON/OFF 시 히어로 사진이 교체되는가
4. 모바일(Fold) 2단 그리드 + 좁은 화면 1단 폴백 확인

---

## Phase 2 — 오픈소스 공유 (HACS)

핵심 카드(히어로/칩/상태행 문법을 담은 것)를 **네이티브 커스텀 카드(JS 번들)**로 구현:

```
dist/ha-design.js          # esbuild 번들 (customElements.define)
src/                       # TS 소스 (hero-card, chip-row, status-row)
hacs.json                  # {"name":"ha-design","render_readme":true,...}
```

- `hacs.json` 포함 시 사용자는 HACS UI에서 "사용자 지정 저장소" 추가 → 설치/자동업데이트
- resources는 HACS가 `ha-design.js`를 자동 등록
- 템플릿 방식(button-card 의존)과 병행 제공 가능 — JS 카드가 우선

## 마이그레이션 순서
1. 조명 카드(가장 대표적, 상태반영 이미지)를 TS 커스텀 카드로 포팅
2. 에너지/차량/미디어 카드 순차 포팅
3. `v0.1.0` 태그 → HACS 등록 안내를 README 최상단에 노출

## 설치 형태별 비교
| 방식 | 설치 난이도 | 업데이트 | 공유 적합도 |
|---|---|---|---|
| 수동 복사 | 낮음 | 수동 | ✗ |
| **git clone/submodule** | 낮음 | git pull | △ (자기 HA 테스트용 최적) |
| HACS (JS 커스텀 카드) | 중간 (포팅 필요) | HACS 자동 | ◎ (최종 목표) |
