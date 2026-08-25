# ha-design

순정 Home Assistant에서 네이버 카페 "러브레이스 업데이트 with CODEX" 스타일의
**에디토리얼 대시보드**를 재현하는 프로젝트. 추후 오픈소스 공유 목표.

> GitHub: <https://github.com/jaeryun/ha-design>
> 레퍼런스 분석: [DESIGN-ANALYSIS.md](DESIGN-ANALYSIS.md)
> 배포/테스트: [DEPLOYMENT.md](DEPLOYMENT.md)
> 현재 상태와 다음 작업: [PROJECT-STATUS.md](PROJECT-STATUS.md)
> 원본 스크린샷 15장: `reference-images/img_00~14.jpg`

## 디자인 한 줄 요약
크림 배경(#F0EDE7) + 흰 카드(radius 24px) + **기기 상태를 반영하는 AI 히어로 사진**
(조명 ON=밝은 방 / OFF=어두운 방) + 문장형 한글 헤드라인("안방 조명이 켜져 있어요")
+ 통일된 상태 행 그래머(티트 아이콘 · 라벨 · 우측 값/토글).

## 빠른 시작 (100% 웹 GUI — 터미널·파일복사 없음)

1. **HACS** → Frontend → `button-card` 설치
2. (권장) **HACS** → 사용자 지정 저장소(테마)에 `https://github.com/jaeryun/ha-design` 추가 → "Warm Editorial" 설치
   → File editor 애드온으로 `configuration.yaml`에 `frontend: themes: !include_dirmerge_named themes` 한 줄
   → 프로필 → 테마 → Warm Editorial 선택
3. 대시보드 편집 → **Raw 구성 편집기** → **`dashboards/ha-design-inline.yaml`** 내용 전체 붙여넣기
   → `light.bedroom`을 실제 엔티티로 치환 → 저장
4. 조명 토글 → 히어로 사진이 즉시 교체되는지 확인

자세한 방법(업데이트 흐름, URL 템플릿 로드, Phase 2 HACS 전환): [DEPLOYMENT.md](DEPLOYMENT.md)

## 저장소 구조
```
├── DESIGN-ANALYSIS.md      # 레퍼런스 디자인 분석
├── DEPLOYMENT.md           # 배포 전략 (표준: HACS+www / 부록: YAML 모드 / Phase 2)
├── themes/warm-editorial.yaml   # 크림 팔레트 + Pretendard 테마 (HACS 테마)
├── www/ha-design/               # /config/www/ha-design/ 으로 복사하는 배포 폴더
│   ├── templates.yaml           #   button-card 템플릿 (button_card_templates_url로 로드)
│   └── images/                  #   상태별 on/off 이미지
├── dashboards/ha-design-inline.yaml  # Raw 편집기 통째붙여넣기용 (템플릿 인라인, 파일 업로드 0개)
├── dashboards/ha-design.yaml         # URL 템플릿 로드형 (repo 공개 후 사용)
├── reference-images/            # 원본 스크린샷 15장 (gitignore — 로컬 참조용)
└── hacs.json                    # HACS 테마 매니페스트
```

## 로드맵
- [x] 레퍼런스 분석 (15장)
- [x] 배포 전략 결정 + 골격
- [x] Phase 1: button-card 템플릿 5종 구현
- [x] Phase 1: 조명 카드 첫 실동작 (ON/OFF 히어로 교체)
- [ ] Phase 2: 핵심 카드 TS 커스텀 카드 포팅 → HACS 등록

## 라이선스
MIT (AI 이미지는 별도 표기 예정)
