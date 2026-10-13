# ha-design Design System

## 1. Atmosphere & Identity

따뜻한 크림색 홈 화면 위에 실제 공간 사진과 기기 상태가 한 장의 에디토리얼 기사처럼 결합된 조용한 홈 컨트롤러다. 시그니처는 **상태를 반영하는 히어로 장면 + 사람이 이해하는 문장 + 같은 문법의 조작 행**이며, 숫자와 제어는 필요한 순간에만 또렷해진다.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|---|---|---:|---|
| Canvas | `--surface-canvas` | `#F0EDE7` | 페이지 배경 |
| Card | `--surface-card` | `#FFFFFF` | 기기 카드 |
| Soft surface | `--surface-soft` | `#F7F5F0` | 세그먼트·조작 영역 |
| Pressed surface | `--surface-pressed` | `#ECE8E0` | 눌림·선택 배경 |
| Text primary | `--text-primary` | `#1A1A18` | 본문·헤드라인 |
| Text secondary | `--text-secondary` | `#716D64` | 설명·현재값 |
| Text tertiary | `--text-tertiary` | `#9A958A` | 비활성·메타데이터 |
| Border subtle | `--border-subtle` | `rgba(26, 26, 24, 0.08)` | 칩·행 구분 |
| Climate blue | `--accent-climate` | `#3D6FE0` | 냉방 조작·포커스 |
| Climate deep | `--accent-climate-deep` | `#284EA8` | 활성 텍스트 |
| Climate tint | `--accent-climate-tint` | `#EAF0FF` | 활성 아이콘·선택 배경 |
| Lighting gold | `--accent-lighting` | `#8A641F` | 조명 라벨·아이콘·활성 제어 |
| Lighting tint | `--accent-lighting-tint` | `#F3E9D3` | 조명 아이콘 배경 |
| Curtain purple | `--accent-curtain` | `#7254A3` | 커튼 위치·이동 제어 |
| Curtain tint | `--accent-curtain-tint` | `#EEE8F7` | 커튼 선택·위치 배경 |
| Camera teal | `--accent-camera` | `#315F6F` | 카메라 영상·이벤트 활성 제어 |
| Camera tint | `--accent-camera-tint` | `#E7F0F1` | 카메라 아이콘·선택 배경 |
| Recorded | `--recorded` | `#6E8992` | 카메라 타임라인의 재생 가능한 녹화 범위 |
| Media dark | `--surface-media` | `#17191F` | 영상 로딩·미디어 배경 |
| On teal | `--accent-on` | `#0E9AA7` | 전원 ON |
| Energy green | `--accent-energy` | `#2FA36B` | 절전 ON |
| Warning rose | `--status-warning` | `#C25B6A` | 제한·오류 |
| Recording red | `--status-recording` | `#FF4D57` | 카메라 녹화 표시 |
| Hero white | `--hero-text` | `#FFFFFF` | 사진 위 텍스트 |

### Rules

- 액센트는 기기 상태와 조작 가능성을 표시할 때만 쓴다.
- 냉방은 블루, 전원은 틸, 절전은 그린으로 의미를 분리한다.
- 새 색은 이 표에 역할을 정의한 뒤 사용한다.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|---|---:|---:|---:|---:|---|
| Hero | `24px` | 800 | 1.25 | `-0.02em` | 상태 문장 |
| Temperature | `48px` | 700 | 1 | `-0.04em` | 목표 온도 |
| H2 | `20px` | 700 | 1.3 | `-0.01em` | 패널 제목 |
| Body | `15px` | 500 | 1.5 | normal | 조작 라벨 |
| Body small | `14px` | 500 | 1.45 | normal | 값·설명 |
| Caption | `12px` | 600 | 1.4 | `0.01em` | 칩 |
| Overline | `11px` | 700 | 1.3 | `0.12em` | 영문 아이브레이 |

### Font Stack

- Primary: `"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `"SFMono-Regular", Consolas, monospace`

### Rules

- 한글 조작 라벨은 `14px` 미만으로 줄이지 않는다.
- 긴 상태 문장은 의미 단위로 자연스럽게 줄바꿈하며 한 글자 고아를 만들지 않는다.

## 4. Spacing & Layout

### Base Unit

모든 의도적 간격은 **4px** 배수다.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | `4px` | 아이콘 내부 |
| `--space-2` | `8px` | 칩·인라인 |
| `--space-3` | `12px` | 작은 컨트롤 |
| `--space-4` | `16px` | 카드 행 |
| `--space-5` | `20px` | 카드 내부 |
| `--space-6` | `24px` | 카드 패널 |
| `--space-8` | `32px` | 섹션 |
| `--space-10` | `40px` | 페이지 |

### Grid

- 축약 카드 최소 너비: `280px`
- 상세 카드 권장 너비: `430px`
- 모달 상세 최대 너비: `460px`
- 검토 화면 최대 너비: `1180px`
- 기본 화면은 기기 카드를 반복 가능한 2열 그리드로 배치하고, `680px` 미만에서는 1열로 전환한다.
- 카드 확장은 페이지 전환이나 모달 없이 현재 그리드 항목의 높이만 늘린다.
- 대안 모달 버전은 그리드 행 높이를 바꾸지 않고 native `dialog` top layer에 상세 카드를 띄운다.
- 모달은 `scroll-body-shell` 계약을 따라 상세 카드 영역 하나만 세로 스크롤을 소유한다.
- 기본 카드 히어로: `16 / 9`
- `375px`에서 주요 콘텐츠가 가로 스크롤 없이 한 열로 읽혀야 한다.

### Home Navigation

- 홈 메뉴는 기기 종류가 아니라 장소 기준 다섯 view이며, 순서는 `거실` → `안방` → `아기방` → `주방` → `다용도실`로 고정한다.
- `전체` 요약 view는 두지 않는다. 집 전체 요약이 필요해지면 별도 view가 아니라 장소 view 안의 상태 표현으로 해결한다.
- 경로는 `living-room`, `bedroom`, `baby-room`, `kitchen`, `utility-room`이고 기존 `bedroom` 경로는 유지한다.
- 기기 배치는 거실(거실 에어컨, 거실 커튼, 공기청정기, 거실 카메라), 안방(안방 조명, 안방 에어컨, 안방 커튼, 안방 온습도), 아기방(아기 카메라, 아기방 온습도), 주방(냉장고, 김치냉장고), 다용도실(세탁기)이다.
- 장소는 view 제목과 각 카드 eyebrow로 함께 전달한다. 색이나 배치만으로 장소를 전달하지 않는다.
- 장소 재편은 배치만 바꾼다. compact `164px` 카드 문법, 카드별 기본 `grid_options.columns`, 상세 모달 동작은 그대로 유지한다.

## 5. Components

### Compact Device Card

- **Adaptive sizing**: 사용자가 별도 variant를 고르지 않고 HA Sections가 할당한 실제 가로 폭에 따라 정보 밀도가 자동으로 바뀐다.
- **Geometry contract**: 카드 `164px` = hero `154px` + 내용 없는 흰 tail `10px`. 가로 폭은 HA grid가 결정하며 현재 desktop은 `492px`.
- **Shared appearance**: 모든 compact card는 같은 `24px` radius, 흰 surface, shadow, 전체 경계를 감싸는 focus ring, typography와 hero/tail 비율을 사용한다.
- **Interaction**: 목록에는 전원·slider 같은 기기별 제어를 넣지 않는다. 카드 전체가 단일 `role="button"`이며 click, `Enter`, `Space`로 상세 모달을 연다.
- **Extension boundary**: 새 기기는 공통 외형을 유지하면서 visual scene, eyebrow, title, badge, 상태 문장과 상세 모달만 달리한다.
- **Forbidden**: 기기별 화면에서 compact hero/tail 높이, 공통 radius, 공통 copy 구조를 시각적으로 분기하지 않는다.

공통 renderer의 source ownership, DOM 예외, resource invariant와 테스트는
[공통 UI 운영 계약](docs/contracts/shared.md)이 소유한다.

#### Adaptive Width Contract

- **Height**: 모든 폭에서 hero `154px` + 흰 tail `10px` = 전체 높이 `164px`를 유지한다. 세로 resize는 제공하지 않는다.
- **Narrow density**: 실제 host 폭 `280px` 이하에서는 title `20px`, 핵심 상태 1개, inset `12px`, compact badge를 사용한다.
- **Wide density**: `280px` 초과에서는 전체 상태 배열과 wide typography를 사용한다.
- **Copy safety**: narrow title과 상태는 한 줄 ellipsis로 제한한다. 긴 한글·영문이 들어와도 card 폭과 grid track을 늘리지 않는다.
- **Interaction**: 모든 폭에서 전체 카드가 최소 `44×44px`인 단일 dialog launcher다. 내부 즉시 제어와 인라인 확장을 금지한다.
- **Intermediate widths**: 중간 폭에서도 공통 정보 계층과 모달·focus·scroll 상태가 끊기지 않아야 한다.

### Modal Device Card

- **Structure**: 클릭 가능한 목록 카드 전체, 상태 이미지, 짧은 엔티티명, 상태 요약, 10px 흰색 하단 여백, native `dialog` 상세 창
- **Default**: 인라인 확장 버전과 별도 변형으로 제공하며 카드 높이와 주변 그리드 행을 바꾸지 않음
- **Open**: 목록 카드 전체를 누르거나 키보드 `Enter`/`Space`로 중앙 상세 창을 열고 첫 닫기 버튼으로 포커스를 이동
- **Close**: 닫기 버튼, 배경 클릭, `Escape`를 지원하고 닫힌 뒤 원래 카드로 포커스를 복원
- **Scroll ownership**: 모달 바깥 문서는 고정하고 모달 상세 카드만 `max-height: calc(100dvh - 24px)` 안에서 스크롤
- **Accessibility**: 목록 카드에 `aria-haspopup="dialog"`와 `aria-expanded`를 제공하고 native focus trap을 사용하며, 기기별 전원 기능 유무와 무관하게 동일한 단일 진입점을 유지
- **Motion**: beui.dev `center-morph-modal`의 중심 확장 메커니즘을 `opacity + scale` 220ms로 축약하며 reduced-motion에서는 즉시 전환

### Device Hero

- **Structure**: 상태 이미지, 그라데이션, 상태 배지, 아이브라이, 엔티티명, 요약 칩
- **Variants**: on, off, cooling, dry, fan, auto
- **States**: 이미지와 상태 배지·요약 칩이 실제 HVAC 상태를 반영
- **Accessibility**: 장식 이미지는 빈 대체 텍스트, 상태는 텍스트로 중복 전달
- **Motion**: 상태 교체 시 `opacity` 220ms 교차 전환

### Power Switch

- **Structure**: `button[role=switch]` + 이동 손잡이
- **States**: off, on, hover, active, focus-visible, disabled
- **Accessibility**: `aria-checked`, 최소 터치 영역 44px
- **Motion**: beui.dev `switch`의 무게감 있는 손잡이 이동을 CSS `transform` 220ms로 축약, reduced-motion은 즉시 전환

### Segment Control

- **Structure**: `tablist` + HVAC 또는 풍량 `tab`
- **States**: default, selected, hover, active, focus-visible, disabled
- **Accessibility**: roving tab semantics, 좌우 화살표 이동
- **Motion**: beui.dev `tabs`의 선택 배경 이동 메커니즘을 각 탭의 상태 전환으로 단순화

### Temperature Stepper

- **Structure**: 감소 버튼, 목표 온도, 증가 버튼, 범위 설명
- **Range**: `16–30°C`, `0.5°C` 단위
- **States**: default, hover, active, focus-visible, min/max disabled
- **Accessibility**: 현재값 `aria-live`, 버튼 라벨에 변경 방향과 단위 포함
- **Motion**: 숫자 교체 `opacity/transform` 140ms, 버튼 누름 `scale(.96)`

### Toggle Row

- **Structure**: 틴트 아이콘, 라벨·설명, Power Switch
- **Variants**: vertical swing, horizontal swing, energy saving
- **States**: off, on, disabled when power is off
- **Accessibility**: 행 전체가 아니라 스위치만 조작점, 비활성 이유를 텍스트로 제공

### Status Row

- **Structure**: 틴트 아이콘, 라벨, 우측 값
- **Variants**: temperature, humidity, filter, energy
- **States**: informational only
- **Accessibility**: 아이콘 없이도 라벨과 단위로 의미가 완결

### Bedroom Lighting Card

- **Brief**: 안방 조명의 상태를 침실 이미지와 한 문장으로 파악하고, 공통 compact 카드에서 상세 모달을 열어 실제 지원 기능만 정밀 제어한다.
- **Primary persona**: 밤에 iPhone을 한 손으로 사용하는 거주자. 눈부심과 오조작을 피하면서 전원·밝기·색온도를 빠르게 바꿔야 한다.
- **Taste constraints**: 기존 Warm Editorial의 크림 캔버스, 흰 카드, 골드 조명 액센트, 문장형 한글 카피를 유지한다. 네온 제어판, 무지개 장식, 과도한 글로우를 금지한다.
- **Spatial pattern**: compact는 `Compact Device Card`의 `164px` 계약을 그대로 사용한다. 상세 모달만 `inline-size: min(620px, calc(100vw - 24px))`와 viewport 내부 스크롤을 소유한다.
- **Asset**: Spacejoy/Unsplash 침실 사진을 사용한다. OFF는 동일 이미지의 밝기·채도를 낮춰 공간 연속성을 보존한다.

#### Compact structure

1. 상태 반영 히어로 이미지
2. `LIGHTING · BEDROOM` eyebrow, `안방 조명` 제목, 상태 문장
3. 우상단 `켜짐`/`꺼짐` 배지
4. 내용 없는 `10px` 흰 tail

- compact 전체가 상세 모달을 연다.
- Power Switch, 밝기, 색온도, 컬러는 상세 모달 안에만 둔다.
- 높이·radius·copy markup을 조명 파일에서 재정의하지 않는다.

#### Modal information order

1. 축소 히어로와 닫기 버튼
2. 전원 행
3. 밝기 `1–100%` range
4. 색온도 `2000–9000K` range와 `따뜻함`/`중간`/`선명함` 설명
5. HS 색상 프리셋
6. 지원 기능 요약 (`밝기 · 색온도 · 컬러`)

- 전원이 꺼져 있을 때 밝기·색온도·색상 컨트롤은 비활성화하고 이유를 텍스트로 알린다.
- slider 조작 중에는 숫자 미리보기로 즉시 반응하되 확정되지 않은 값을 완료 상태처럼 강조하지 않는다.

#### Lighting accessibility

- 모든 조작점은 최소 `44×44px`.
- Power Switch는 `role="switch"`와 `aria-checked`를 제공한다.
- range는 native keyboard semantics와 값 단위를 포함한 `aria-valuetext`를 제공한다.
- 색상 프리셋은 라벨과 `aria-pressed`를 함께 제공해 색만으로 선택을 전달하지 않는다.
- 모달은 제목을 참조하고, Escape로 닫히며, 닫은 뒤 실행한 요소로 초점을 복원한다.
- `prefers-reduced-motion: reduce`에서는 thumb·이미지·모달 전환을 제거한다.
조명의 canonical entity, capability, 상태·서비스 payload, transition 예외, 테스트와
실기기 QA는 [조명 운영 계약](docs/contracts/lighting.md)이 소유한다.

### Curtain Card

- 거실과 안방 커튼은 한 행의 두 Compact launcher로 공간 상태를 비교하고, 상세 모달에서 aperture visual과 위치 조절을 제공한다.
- 목록은 공통 Compact Device Card의 radius·tail·copy를 그대로 사용하고, 커튼 고유 scene과 상태 표현만 확장한다.
- 위치는 숫자와 함께 중앙 채광 폭으로도 드러나며, 이동 중 표현은 실제 커튼의 방향과 시각적으로 일치해야 한다.

#### Curtain tile

1. 실제 공간의 커튼 hero
2. `CURTAIN · LIVING ROOM` 또는 `CURTAIN · BEDROOM` eyebrow
3. `거실 커튼` 또는 `안방 커튼` 제목
4. `열림 64%`, `열리는 중 · 64%`, `닫힘` 중 하나인 한 줄 상태
5. 우상단 상태 badge와 공통 흰 tail `10px`

- tile 전체가 상세 모달을 여는 단일 조작점이다.
- 목록에 열기·닫기·slider를 넣지 않는다.
- 사진 위 커튼 패널은 현재 위치에 따라 중앙 채광 폭이 달라져 숫자 없이도 상태를 구분한다.

#### Curtain modal

1. 현재 위치와 이동 상태를 보여주는 커튼 aperture visual
2. 현재 위치 `0–100%`와 native range
3. `열기`, `정지`, `닫기` 3개 동등 버튼
4. 지원 기능 요약

- range의 `input`은 화면의 위치 미리보기와 `aria-valuetext`만 갱신한다.
- 개폐 중에도 `정지`는 항상 접근 가능해야 한다.
- 모든 버튼은 최소 `44×44px`, range는 native keyboard semantics를 유지한다.
- 모달 닫기·배경·Escape를 지원하고 닫힌 뒤 현재 tile launcher로 초점을 복원한다.

커튼의 canonical entity, feature bit, 위치 보간·정지·재동기화, service, 고급 설정,
테스트와 실기기 QA는 [커튼 운영 계약](docs/contracts/curtain.md)이 소유한다.

### Cold Storage Card

- 냉장고와 김치냉장고는 하나의 카드 문법을 공유하고 공통 `164px` Compact launcher를 사용한다.
- **Color story**: 냉장 상태는 기존 climate blue를, 김치 보관 모드는 절제된 보랏빛 `--accent-curtain`을 재사용한다. 새 전역 색상 토큰은 추가하지 않는다.
- **Asset contract**: 실기기 모델을 먼저 조회하고 삼성 공식 제품 이미지를 사용한다. 실제 제품은 코타화이트 `RF60DB9KF201` 냉장고와 `RQ33DB74D2AP` 3도어 김치냉장고다. 사용자가 승인한 `Warm Studio` 구성만 생산에 사용한다. 두 카드 모두 공식 정면 제품 컷의 전체 실루엣을 따뜻한 차콜·토프·아이보리 스튜디오 배경 위에 분리해 배치하고, 제품 사진과 텍스트 영역은 겹치지 않는다. 승인되지 않은 주방 사진 합성과 CSS 제품 모형은 생산 히어로로 사용하지 않는다.

- Compact는 제품 종류, 칸별 온도와 문 상태를 한눈에 읽게 하고, 상세 모달은 현재 상태에서 실제로 제공되는 제어만 시각적으로 확장한다.
- 지원하지 않는 zone·모드·제어를 빈 카드나 가짜 제품 기능으로 채우지 않는다.

냉장 기기의 entity, 문·온도·목표값·급속 운전·모드·에너지 의미, 서비스,
테스트와 실기기 QA는 [냉장 기기 운영 계약](docs/contracts/cold-storage.md)이 소유한다.

### Washer Card

- 승인된 `Warm Utility` 방향과 삼성 WD25DB8690BE 정면 제품 컷을 사용한다.
- Compact launcher는 공통 `164px` 문법 안에서 현재 단계, 완료 예정 또는 Smart Control 상태만 요약한다.
- 상세 모달은 현재 상태와 안전 안내를 먼저 보여주고, 실제로 사용할 수 있는 설정과 읽기 전용 사용량을 그 아래에 둔다.
- 전원·원격 제어·알 수 없는 상태는 색만으로 전달하지 않고 명시적 문구와 비활성 표현을 함께 사용한다.
- 코스를 확인할 수 없는 정지 상태를 재생성 가능한 시작 상태처럼 강조하지 않는다.

세탁기의 21개 entity 역할, Idle·Smart Control 의미, 기능별 명령 게이트, 서비스,
안전 금지사항, 테스트와 실기기 QA는 [세탁기 운영 계약](docs/contracts/washer.md)이 소유한다.

### Temperature & Humidity Card

- 안방과 아기방의 방 온습도를 한 장으로 읽고, 눌렀을 때 지난 기록을 펼친다. **사진을 쓰지 않는 유일한 compact 카드**이며, 그 이유는 온습도 카드의 정보가 방의 모습이 아니라 숫자와 추세이기 때문이다.
- **Tone panel palette**: 실사 hero 대신 크림 캔버스 계열 톤 패널을 쓴다. 패널은 `radial-gradient(120% 95% at 12% 0%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 58%)` 하이라이트와 `linear-gradient(158deg, #FBF8F2 0%, #F3EEE5 58%, #EBE5D9 100%)`를 겹치고 `inset 0 0 0 1px rgba(26, 26, 24, 0.06)` 링을 둔다. 카드 로컬 `--temp-*` 변수로만 정의하며 새 전역 색상 토큰은 추가하지 않는다. 이 패널은 장식이므로 대체 텍스트가 없고, 상태는 숫자와 문구로 전달한다.
- **Typography**: 온도·습도 숫자는 `28px`/700/line-height `1`/tracking `-0.01em`, 단위는 `14px`/600이다. host 폭 `280px` 이하의 좁은 밀도에서 숫자는 `26px`로 줄인다. eyebrow는 `10px`/700/tracking `0.14em`, 제목은 `15px`/600, 배지는 `11px`/700이다.
- **Badge tones**: 쾌적도 배지는 세 톤을 카드 안에서 `--temp-*` 로컬 변수로만 정의하고 새 전역 토큰을 만들지 않는다. 쾌적은 tint `#E7F0F1` 배경과 `#2F5A68` 텍스트(기존 camera tint와 같은 값), 주의(습함·건조)는 warm tan `#F6ECE4` 배경과 `#8A5A35` 텍스트(gold 계열), 확인 필요는 중립 `#F1EEEA` 배경과 muted `#6B675F` 텍스트다. **색만으로 판정을 전달하지 않고** 배지에 `쾌적해요`, `조금 습해요`, `조금 건조해요`, `조금 따뜻해요`, `조금 서늘해요`, `확인 필요` 문구를 항상 함께 둔다.
- **Geometry**: 온습도 카드도 공통 compact 문법을 그대로 따른다. hero/tone `154px` + 빈 흰 tail `10px` = `164px`, radius `24px`이며 이 값을 카드 파일에서 재정의하지 않는다. 사진이 없다고 해서 높이나 radius를 분기하지 않는다.
- **Record dialog hierarchy**: 상세는 현재값 → 기간 탭 → 온도 차트 → 습도 차트 → 출처 순서다. 현재값 행이 먼저 오는 이유는 사용자가 카드를 연 첫 목적이 지금 값 확인이기 때문이고, 출처를 마지막에 두는 이유는 차트 해석에 필요한 보조 정보다.
  - 기간 탭은 `24시간`·`7일`·`30일` 세그먼트(`tablist`/`tab`)이며 좌우 화살표와 Home/End로 이동한다.
  - 차트는 min–max 띠(`fill-opacity: 0.16`)와 평균선(`stroke-width: 2.2`)을 함께 그린다. 띠와 선을 병치하는 이유는 평균만으로는 일교차와 습도 변동 폭이 사라지기 때문이다.
  - 온도 차트는 gold `#8A641F`, 습도 차트는 accent `#315F6F`를 쓴다. 두 차트를 같은 색으로 그리지 않는 이유는 색 없이도 어느 차트인지 구분되게 하기 위함이며, 각 figure에는 `온도`·`습도` 캡션이 텍스트로 붙는다.
  - 조작점은 최소 `44×44px`다. 기간 탭과 닫기 버튼 모두 이 값을 지킨다. 차트 SVG는 `role="img"`이며 `aria-label`에 최저·평균·최고 요약을 포함한다.
- **Reduced motion**: 이 카드는 전환 애니메이션을 쓰지 않는다. 공통 규칙대로 `prefers-reduced-motion: reduce`에서 모든 transition·animation을 제거한다.

방 온습도의 설정 키, 기간별 통계 조회, 쾌적도 판정 순서, 상태 의미, 테스트와
실기기 QA는 [방 온습도 운영 계약](docs/contracts/temp-humidity.md)이 소유한다.

## 6. Motion & Interaction

| Token | Duration | Easing | Usage |
|---|---:|---|---|
| `--motion-micro` | `140ms` | `ease-out` | 버튼 눌림·숫자 |
| `--motion-standard` | `220ms` | `cubic-bezier(.2,.8,.2,1)` | 토글·선택·이미지 |

- 공간 이동은 `transform`, 상태 교체는 `opacity`만 애니메이션한다.
- 모든 입력은 중간 애니메이션 중에도 새 입력을 즉시 받는다.
- `prefers-reduced-motion: reduce`에서는 전환을 제거한다.

## 7. Depth & Surface

### Strategy

**Mixed**: 크림 캔버스와 흰 카드의 tonal shift를 기본으로 하고, 대표 기기 카드에만 부드러운 그림자와 얇은 내부 링을 허용한다.

| Level | Value | Usage |
|---|---|---|
| Card | `0 16px 48px rgba(26, 26, 24, 0.10)` | 대표 기기 카드 |
| Control | `inset 0 0 0 1px var(--border-subtle)` | 칩·세그먼트 |
| Pressed | `inset 0 1px 2px rgba(26, 26, 24, 0.08)` | 눌린 컨트롤 |

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- WCAG 2.2 AA: 본문 대비 4.5:1, 큰 텍스트·UI 경계 3:1 이상
- 키보드만으로 전원, 모드, 온도, 풍량, 스윙, 절전을 모두 조작
- 모든 조작점에 명확한 `focus-visible`
- 최소 터치 영역 `44 × 44px`
- 색상만으로 상태를 전달하지 않고 텍스트와 ARIA 상태를 함께 사용
- 전원 OFF에서 사용할 수 없는 조작은 비활성 이유가 읽혀야 한다.

### Accepted Debt

- 실제 조명 장치 응답 지연은 Home Assistant/SmartThings 왕복에 의존한다. 별도 로딩 스피너 없이 다음 상태 갱신으로 확정한다.

## 9. Camera Visual Extension

- 카메라는 실시간 영상과 과거 영상이 주 표면이며, 제어와 감지 정보는 그 아래에서 보조한다.
- 실시간과 과거 영상은 상세 모달의 sticky header에 있는 상단 메뉴(`실시간` / `과거 영상`)로 전환한다. 과거 영상 진입점을 이벤트 목록이나 개별 버튼의 하위 항목으로 숨기지 않는다.
- Compact launcher는 공통 `164px` 문법을 사용하고, 상세 모달은 `620px` 이내의 영상 우선 계층을 유지한다.
- 기본 실시간·과거 영상은 player 자체 controls가 재생과 전체화면을 소유한다. 가짜 전체화면 상태나 `LIVE`·`REC` overlay를 추가하지 않는다. 별도 자르기 미리보기는 선택 범위 재생·정지와 양끝 드래그를 편집 UI가 소유한다.
- 과거 영상은 sticky header, 7일 선택기, `16:9` 영상, 하나의 통합 timeline 순서다. 녹화 구간 이동(`이전 녹화`·`다음 녹화`)은 상태와 무관하게 항상 노출하고, 3분 이하 공백은 같은 녹화 블록으로 보아 그 블록 사이를 이동한다. 띠도 같은 블록으로 그리며, 채워진 구간을 선택하면 항상 영상이 나와야 한다. timeline 입력은 실제 녹화 지점으로 해석되어, 영상이 없는 구간은 클릭 대상이 아니고 짧은 녹화도 주변에서 잡힌다.
- 통합 timeline은 Tapo 감지 시점과 Frigate 녹화 범위를 하나의 프레임·공유 축·line-only playhead로 연결한다. 원본 감지는 단일 시각으로 보존하되, 현재 필터에서 인접 감지 사이가 30분 이하이면 하나의 활동 구간으로 묶는다. 첫 감지부터 마지막 감지까지 표시하고 현지 날짜를 넘겨 묶지 않는다. 센서가 `on`인 시간을 연속 활동 구간으로 추정하지 않는다.
- 화면 범례는 `감지`와 `녹화`로 표시한다. HA에 실제로 전달된 감지 종류를 필터링하며, 선택한 감지 종류·원래 시각을 재생 시각과 구분한다. 감지 이력 조회 실패나 현재 센서 연결 끊김은 녹화 조회·재생을 막지 않는다.
- 저장 정책은 전체 영상 10일 보관이다. Tapo가 영상·소리 감지를 담당하고 Frigate 모션·객체·오디오 분석은 모두 끈다. 카메라가 제공하는 감도 설정과 HA로 전달되는 이벤트 지원 범위는 구분하며, 일반 FFmpeg 소음을 Tapo 아기 울음 이벤트로 표시하지 않는다. 영상 전송·수동 PTZ·프라이버시는 유지한다.
- timeline은 drag로 문질러 시간을 옮길 수 있다. 문지르는 동안에는 playhead와 시각 표시만 따라오고, 손을 뗄 때 한 번만 실제 영상을 요청한다.
- `영상 다운로드`는 실제 영상을 보면서 자르는 편집 dialog를 연다. 시작·끝 손잡이를 드래그하는 동안 해당 화면을 미리 보여주고, 주변 시간축의 확대·축소·이동과 선택 구간 재생을 제공한다. 날짜·시각 직접 입력은 접힌 보조 기능이다. 프레임 확인 전에는 이동 중임을 알리고 공백에서는 이전 화면을 가린다. 파일 저장은 기존 브라우저 다운로드 흐름을 유지하며 영구 export 보관함은 만들지 않는다.
- 실시간 연결이 끊긴 카메라는 검은 화면이나 조용한 실패 대신 연결할 수 없는 이유를 표시하되, 과거 영상 조회는 계속 동작해야 한다.
- 현재 이후 영역은 guide·줄무늬·반복 칸이 없는 조용한 단일 표면이다. 녹화 구간은 square-ended이고 Tapo 감지는 그 위에 30분 기준 활동 띠 또는 단일 시각의 작은 표시로 표현한다. 화면에는 선택한 감지 종류·원래 시각만 표시하고, 활동 범위·건수는 스크린리더 요약에 보존한다.
- C225는 방향 조절이 있는 가변 시점 카메라, C120은 PTZ가 없는 고정형 카메라로 표현하며, 지원하지 않는 제어를 빈 자리나 가짜 상태로 만들지 않는다.
- 모바일에서도 실시간 툴바를 한 행으로 유지하고 모든 한글 조작 라벨과 터치 목표가 공통 접근성 규칙을 충족해야 한다.
- 카메라 화면은 비전문가가 영상과 조작에 집중하도록 상시 설명문·내부 시스템명·중복 정상 상태를 제거한다. 묶음 규칙과 저장 구조는 문서에 두고, 오류·녹화 공백·파일 경계 차이처럼 판단에 필요한 안내만 짧게 표시한다. privacy는 `촬영 일시 중지`, snapshot은 `사진 저장`으로 표현하며 원래 동작은 유지한다.

카메라의 canonical entity, WebRTC/HLS, Frigate segment·VOD, 상태 의미, PTZ, 경쟁 조건,
키보드 조작, 테스트와 실기기 QA는 [카메라 운영 계약](docs/contracts/camera.md)이 소유한다.
