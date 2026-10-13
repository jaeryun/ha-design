# ha-design

순정 Home Assistant에서 네이버 카페 "러브레이스 업데이트 with CODEX" 스타일의
**에디토리얼 대시보드**를 재현하는 프로젝트. 추후 오픈소스 공유 목표.

> GitHub: <https://github.com/jaeryun/ha-design>
> 레퍼런스 분석: [DESIGN-ANALYSIS.md](DESIGN-ANALYSIS.md)
> 배포/테스트: [DEPLOYMENT.md](DEPLOYMENT.md)
> HA custom card 표준 계약: [HA-STANDARD.md](HA-STANDARD.md)
> 현재 배포 상태와 다음 작업: [PROJECT-STATUS.md](PROJECT-STATUS.md)
> 문서 역할과 계약 안내: [docs/README.md](docs/README.md)
> 새 UI 제작·배포 가이드: [docs/SUBAGENT-HA-UI-DELIVERY-GUIDE.ko.md](docs/SUBAGENT-HA-UI-DELIVERY-GUIDE.ko.md)
> 원본 스크린샷 15장: `reference-images/img_00~14.jpg`

## 디자인 한 줄 요약
크림 배경(#F0EDE7) + 흰 카드(radius 24px) + **기기 상태를 반영하는 AI 히어로 사진**
(조명 ON=밝은 방 / OFF=어두운 방) + 문장형 한글 헤드라인("안방 조명이 켜져 있어요")
+ 통일된 상태 행 그래머(티트 아이콘 · 라벨 · 우측 값/토글).

## 시작하기

현재 dashboard는 장소 기준 `거실`, `안방`, `아기방`, `주방`, `다용도실`
다섯 Sections view와 여덟 native module resource를 사용한다. 기기 종류별 view와 `전체` 요약 view는 두지 않는다.

- 실제 설치·resource 등록·dashboard 저장·업데이트·롤백 명령은
  [DEPLOYMENT.md](DEPLOYMENT.md) 한 곳에서만 관리한다.
- 카드별 기능과 검증 범위는 [문서 지도](docs/README.md)에서 찾는다.
- 새 UI를 만드는 작업자는
  [서브에이전트 UI 제작·배포 가이드](docs/SUBAGENT-HA-UI-DELIVERY-GUIDE.ko.md)를 먼저 따른다.

현재 native 카드는 `button-card`에 의존하지 않는다. 여덟 native custom-card 유형은 HA custom card API의 config form, stub config, picker metadata, grid sizing 계약을 사용한다. 카메라는 Tapo 실시간 영상, Frigate 녹화, 최근 7일 시간 히스토리를 같은 `ha-design-camera-card`에서 제공하고, 방 온습도 카드는 사진 없이 안방·아기방의 현재 온습도와 기간별 기록 차트를 제공한다. 공통 compact/modal 계약, 카드별 UI 계약, 표준 준수 범위는 [docs/README.md](docs/README.md)와 [HA-STANDARD.md](HA-STANDARD.md)를 참고한다.

설치, 업데이트, 전체 검증 절차는 [DEPLOYMENT.md](DEPLOYMENT.md)를 따른다. Phase 1 button-card 자료는 실행용 문서가 아닌 [보관 기록](docs/archive/phase-1-button-card.md)이다.

## 저장소 구조
```
├── DESIGN-ANALYSIS.md      # 레퍼런스 디자인 분석
├── HA-STANDARD.md          # HA custom card·visual editor·Sections 완료 계약
├── PROJECT-STATUS.md       # 현재 live 상태·검증·다음 세션 인수인계
├── DEPLOYMENT.md           # native 카드 설치·업데이트·검증 절차
├── docs/                   # 계약, 문서 역할, 비실행 보관 기록
├── themes/warm-editorial.yaml   # 크림 팔레트 + Pretendard 테마 (HACS 테마)
├── www/ha-design/
│   ├── ha-design-device-compact.js   # 조명·에어컨 공통 compact 기반
│   ├── ha-design-light-card*.js      # native 안방 조명 카드
│   ├── ha-design-climate-card.js     # native 에어컨 카드
│   ├── ha-design-curtain-card*.js    # native 커튼 카드
│   ├── ha-design-cold-storage-card*.js # native 냉장 기기 카드
│   ├── ha-design-washer-card*.js     # native 세탁기 카드
│   ├── ha-design-camera-card*.js     # native C225·C120 카메라 카드
│   ├── ha-design-temp-humidity-card*.js    # native 안방·아기방 온습도 카드
│   ├── ha-design-temp-humidity-history.js  # 기록 통계 조회·표본·요약 계산
│   ├── templates.yaml                # 보관된 Phase 1 button-card 호환 자료
│   └── images/
├── dashboards/ha-design-inline.yaml  # Raw 구성 편집기용
├── dashboards/ha-design.yaml         # 전체 대시보드 예시
├── dashboards/*-resource.yaml        # 여덟 live Lovelace module resource의 정본
├── tools/*test.mjs                    # Node 계약과 카메라 browser runner
├── tools/device-compact-*             # 공통 높이·DOM·모바일 회귀 계약
├── tools/temp-humidity-card-variants.html # 승인된 A안 시안 (사진 없는 톤 패널)
├── tools/temp-humidity-fixture.js     # 시안용 실측 recorder 통계 fixture
├── reference-images/            # 원본 스크린샷 15장 (gitignore — 로컬 참조용)
└── hacs.json                    # HACS 테마 매니페스트
```

## 로드맵
- [x] 레퍼런스 분석 (15장)
- [x] 배포 전략 결정 + 골격
- [x] Phase 1: button-card 템플릿 5종 구현
- [x] Phase 1: 조명 카드 첫 실동작 (ON/OFF 히어로 교체)
- [x] Native custom card: 조명·에어컨·커튼·냉장 기기·세탁기·카메라 구현
- [x] HA native visual editor와 Sections resize 계약
- [ ] HACS 프런트엔드 패키지 등록

## 라이선스
MIT.

안방 조명 hero 사진: [Spacejoy / Unsplash](https://unsplash.com/photos/808a4AWu8jE) · [Unsplash License](https://unsplash.com/license)
