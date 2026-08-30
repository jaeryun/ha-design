# ha-design

순정 Home Assistant에서 네이버 카페 "러브레이스 업데이트 with CODEX" 스타일의
**에디토리얼 대시보드**를 재현하는 프로젝트. 추후 오픈소스 공유 목표.

> GitHub: <https://github.com/jaeryun/ha-design>
> 레퍼런스 분석: [DESIGN-ANALYSIS.md](DESIGN-ANALYSIS.md)
> 배포/테스트: [DEPLOYMENT.md](DEPLOYMENT.md)
> HA custom card 표준 계약: [HA-STANDARD.md](HA-STANDARD.md)
> 현재 상태와 다음 작업: [PROJECT-STATUS.md](PROJECT-STATUS.md)
> 원본 스크린샷 15장: `reference-images/img_00~14.jpg`

## 디자인 한 줄 요약
크림 배경(#F0EDE7) + 흰 카드(radius 24px) + **기기 상태를 반영하는 AI 히어로 사진**
(조명 ON=밝은 방 / OFF=어두운 방) + 문장형 한글 헤드라인("안방 조명이 켜져 있어요")
+ 통일된 상태 행 그래머(티트 아이콘 · 라벨 · 우측 값/토글).

## 빠른 시작

1. Home Assistant → 설정 → 대시보드 → 리소스에서 아래 다섯 module URL을 등록
   - `dashboards/ha-design-light-resource.yaml`
   - `dashboards/ha-design-resource.yaml`
   - `dashboards/ha-design-curtain-resource.yaml`
   - `dashboards/ha-design-cold-storage-resource.yaml`
   - `dashboards/ha-design-washer-resource.yaml`
2. (권장) **HACS** → 사용자 지정 저장소(테마)에 `https://github.com/jaeryun/ha-design` 추가 → "Warm Editorial" 설치
   → File editor 애드온으로 `configuration.yaml`에 `frontend: themes: !include_dirmerge_named themes` 한 줄
   → 프로필 → 테마 → Warm Editorial 선택
3. 대시보드 편집 → **Raw 구성 편집기** → `dashboards/ha-design-inline.yaml` 내용 전체 붙여넣기
4. Sections 기반 `안방`, `에어컨`, `커튼`, `냉장 기기`, `세탁기` view가 렌더되는지 확인
5. 대시보드 edit mode에서 카드의 native visual editor와 **레이아웃** 탭 resize를 확인

현재 native 카드는 `button-card`에 의존하지 않는다.
다섯 카드는 HA custom card API의 config form, stub config, picker metadata, grid sizing 계약을
사용한다. 정확한 준수 범위와 HACS packaging 상태는 [HA-STANDARD.md](HA-STANDARD.md)를 참고한다.

자세한 방법(업데이트 흐름, URL 템플릿 로드, Phase 2 HACS 전환): [DEPLOYMENT.md](DEPLOYMENT.md)

## 저장소 구조
```
├── DESIGN-ANALYSIS.md      # 레퍼런스 디자인 분석
├── HA-STANDARD.md          # HA custom card·visual editor·Sections 완료 계약
├── PROJECT-STATUS.md       # 현재 live 상태·검증·다음 세션 인수인계
├── DEPLOYMENT.md           # native 카드와 legacy 배포 참고
├── themes/warm-editorial.yaml   # 크림 팔레트 + Pretendard 테마 (HACS 테마)
├── www/ha-design/
│   ├── ha-design-device-compact.js   # 조명·에어컨 공통 compact 기반
│   ├── ha-design-light-card*.js      # native 안방 조명 카드
│   ├── ha-design-climate-card.js     # native 에어컨 카드
│   ├── ha-design-curtain-card*.js    # native 커튼 카드
│   ├── ha-design-cold-storage-card*.js # native 냉장 기기 카드
│   ├── ha-design-washer-card*.js     # native 세탁기 카드
│   ├── templates.yaml                # Phase 1 button-card 호환 자료
│   └── images/
├── dashboards/ha-design-inline.yaml  # Raw 구성 편집기용
├── dashboards/ha-design.yaml         # 전체 대시보드 예시
├── dashboards/*-resource.yaml        # live Lovelace module 계약
├── tools/device-compact-*             # 공통 높이·DOM·모바일 회귀 계약
├── reference-images/            # 원본 스크린샷 15장 (gitignore — 로컬 참조용)
└── hacs.json                    # HACS 테마 매니페스트
```

## 로드맵
- [x] 레퍼런스 분석 (15장)
- [x] 배포 전략 결정 + 골격
- [x] Phase 1: button-card 템플릿 5종 구현
- [x] Phase 1: 조명 카드 첫 실동작 (ON/OFF 히어로 교체)
- [x] Phase 2: 조명·에어컨·커튼·냉장 기기·세탁기 native custom card 포팅
- [x] HA native visual editor와 Sections resize 계약
- [ ] HACS 프런트엔드 패키지 등록

## 라이선스
MIT.

안방 조명 hero 사진: [Spacejoy / Unsplash](https://unsplash.com/photos/808a4AWu8jE) · [Unsplash License](https://unsplash.com/license)
