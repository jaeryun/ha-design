# ha-design

순정 Home Assistant에서 네이버 카페 "러브레이스 업데이트 with CODEX" 스타일의
**에디토리얼 대시보드**를 재현하는 프로젝트. 추후 오픈소스 공유 목표.

> 레퍼런스 분석: [DESIGN-ANALYSIS.md](DESIGN-ANALYSIS.md)
> 배포/테스트: [DEPLOYMENT.md](DEPLOYMENT.md)
> 원본 스크린샷 15장: `reference-images/img_00~14.jpg`

## 디자인 한 줄 요약
크림 배경(#F0EDE7) + 흰 카드(radius 24px) + **기기 상태를 반영하는 AI 히어로 사진**
(조명 ON=밝은 방 / OFF=어두운 방) + 문장형 한글 헤드라인("안방 조명이 켜져 있어요")
+ 통일된 상태 행 그래머(티트 아이콘 · 라벨 · 우측 값/토글).

## 빠른 시작 (내 HA에 테스트 설치)

```bash
# HA 서버에서 (/config 기준)
cd /config
git clone https://github.com/<you>/ha-design.git
```

`configuration.yaml`:
```yaml
frontend:
  themes: !include_dirmerge_named ha-design/themes

lovelace:
  mode: yaml
```
→ 프로필 → 테마 → **Warm Editorial** 선택 → YAML 리로드 → 대시보드 새로고침

자세한 방법(submodule, 업데이트 흐름, Phase 2 HACS 전환): [DEPLOYMENT.md](DEPLOYMENT.md)

## 저장소 구조
```
├── DESIGN-ANALYSIS.md      # 레퍼런스 디자인 분석
├── DEPLOYMENT.md           # 배포 전략 (Phase1 git / Phase2 HACS)
├── themes/warm-editorial.yaml   # 크림 팔레트 + Pretendard 테마
├── lovelace/templates.yaml      # button-card 템플릿 (hero/chip/status-row)
├── dashboards/ha-design.yaml    # 예시 대시보드 스켈레톤
├── www/ha-design/images/        # AI 생성 이미지 (상태별 on/off)
├── reference-images/            # 원본 스크린샷 15장
└── hacs.json                    # Phase 2 활성화 예정 (주석 참조)
```

## 로드맵
- [x] 레퍼런스 분석 (15장)
- [x] 배포 전략 결정 + 골격
- [ ] Phase 1: button-card 템플릿 3종 구현 (hero/chip/status-row)
- [ ] Phase 1: 조명 카드 첫 실동작 (ON/OFF 히어로 교체)
- [ ] Phase 2: 핵심 카드 TS 커스텀 카드 포팅 → HACS 등록

## 라이선스
MIT (AI 이미지는 별도 표기 예정)
