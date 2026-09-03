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

## 5. Components

### Compact Device Card

- **Single source of truth**: `www/ha-design/ha-design-device-compact.js`
- **Adaptive sizing**: 사용자가 별도 variant를 고르지 않고 HA Sections가 할당한 실제 가로 폭에 따라 정보 밀도가 자동으로 바뀐다.
- **Geometry contract**: 카드 `164px` = hero `154px` + 내용 없는 흰 tail `10px`. 가로 폭은 HA grid가 결정하며 현재 desktop은 `492px`.
- **Shared renderer**: `renderDeviceCompact()`가 card/hero/tail DOM, eyebrow, title, badge, wide/narrow 상태 문자열, text escape를 소유한다.
- **Shared styles**: `deviceCompactStyles`가 `--device-card-radius: 24px`, surface, shadow, 전체 경계를 감싸는 focus ring, typography와 두 높이 custom property를 소유한다.
- **Interaction**: 목록에는 전원·slider 같은 기기별 제어를 넣지 않는다. 카드 전체가 단일 `role="button"`이며 click, `Enter`, `Space`로 상세 모달을 연다.
- **Extension boundary**: 기기 카드는 visual scene, eyebrow, title, badge, 상태 문자열 배열과 상세 모달만 제공한다.
- **Forbidden**: 기기 카드 파일에서 compact hero/tail 높이, 공통 radius, 공통 copy markup, explicit wide/tile variant를 다시 선언하지 않는다.
- **Deployment invariant**: climate/light resource는 같은 구현 SHA를 가리켜야 한다.
- **Regression gates**:
  - `node tools/device-compact-contract-test.mjs`
  - `tools/device-compact-visual-test.html`의 desktop/iPhone WebKit PASS

#### Adaptive Width Contract

- **HA grid contract**: Sections view에서 모든 카드는 `min_columns: 4`, `max_columns: 12`다. 조명·에어컨 기본값은 `12`, 커튼 기본값은 `4`다.
- **Height**: 모든 폭에서 hero `154px` + 흰 tail `10px` = 전체 높이 `164px`를 유지한다. 세로 resize는 제공하지 않는다.
- **Narrow density**: 실제 host 폭 `280px` 이하에서는 title `20px`, 핵심 상태 1개, inset `12px`, compact badge를 사용한다.
- **Wide density**: `280px` 초과에서는 전체 상태 배열과 wide typography를 사용한다.
- **Copy safety**: narrow title과 상태는 한 줄 ellipsis로 제한한다. 긴 한글·영문이 들어와도 card 폭과 grid track을 늘리지 않는다.
- **Interaction**: 모든 폭에서 전체 카드가 최소 `44×44px`인 단일 dialog launcher다. 내부 즉시 제어와 인라인 확장을 금지한다.
- **Extension API**: 새 기기 카드는 visual·eyebrow·title·badge·wide 상태 배열·`narrowStatusItem`·detail UI만 제공한다.
- **Intermediate widths**: 4~12 columns 사이의 모든 값은 동일 DOM을 유지한 채 host width `100%`로 채운다. resize 때문에 카드 DOM·모달·focus·scroll state를 교체하지 않는다.
- **Layout boundary**: HA의 `grid_options.columns` sizing은 Sections view에서만 적용된다. Masonry view에서는 HA 자체가 columns를 무시하므로 card는 masonry column 폭을 따른다.

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

- 대상 엔티티의 `supported_color_modes`가 `color_temp`와 `hs`일 때만 해당 섹션을 표시한다.
- `supported_features`에 없는 효과와 플래시는 렌더링하지 않는다.
- 전원이 꺼져 있을 때 밝기·색온도·색상 컨트롤은 비활성화하고 이유를 텍스트로 알린다.
- slider의 `input`은 숫자 미리보기만 갱신하고 `change`에서 한 번 서비스 호출한다.
- 밝기·색온도·색상 변경은 지원되는 `0.3s` transition을 사용한다.
- 서비스 응답을 낙관적으로 확정하지 않고 다음 `hass` 상태를 권위 원천으로 렌더링한다.

#### Lighting accessibility

- 모든 조작점은 최소 `44×44px`.
- Power Switch는 `role="switch"`와 `aria-checked`를 제공한다.
- range는 native keyboard semantics와 값 단위를 포함한 `aria-valuetext`를 제공한다.
- 색상 프리셋은 라벨과 `aria-pressed`를 함께 제공해 색만으로 선택을 전달하지 않는다.
- 모달은 제목을 참조하고, Escape로 닫히며, 닫은 뒤 실행한 요소로 초점을 복원한다.
- `prefers-reduced-motion: reduce`에서는 thumb·이미지·모달 전환을 제거한다.
- **Accepted debt**: 실제 조명 장치 응답 지연은 Home Assistant/SmartThings 왕복에 의존한다. 로딩 스피너를 추가하지 않고 상태 갱신으로만 확정한다.

### Curtain Card

- **Brief**: 거실과 안방 커튼을 iPhone 2열 tile에서 함께 파악하고, 상세 모달에서 실제 장치가 지원하는 개폐·정지·위치 지정을 수행한다.
- **Shared base**: 목록은 `Compact Device Tile`을 그대로 사용한다. 커튼 파일은 square visual, 상태 문장, badge, `tileStatusItem`, 상세 UI만 제공하며 공통 radius·tail·copy markup을 복제하지 않는다.
- **Actual capability contract**: `cover.geosilkeoteun`과 `cover.anbangkeoteun`의 `supported_features=15`는 `OPEN(1)`, `CLOSE(2)`, `SET_POSITION(4)`, `STOP(8)`만 의미한다. tilt와 속도 제어는 렌더링하지 않는다.
- **Grid**: HA Sections 12-column grid에서 각 카드가 `columns: 6`을 고정 점유해 iPhone에서도 한 행에 두 장을 유지한다.
- **State source**: `current_position`의 `0`은 완전 닫힘, `100`은 완전 열림이다. HA가 새 위치를 보내는 순간 그 값을 최우선으로 사용한다.
- **Sparse update contract**: 실제 두 커튼은 연속 이동 중 시작·끝 위치만 보내고, `stop_cover` 뒤에만 실제 중간 위치를 추가 보고한다. 따라서 서비스 호출부터 다음 authoritative 위치까지는 시작 위치와 목표 위치를 선형 보간한다.
- **Measured travel duration**: 거실은 `travel_duration: 8.8`, 안방은 `travel_duration: 7.4`초를 사용한다. 다른 커튼은 해당 장치의 완전 개방 시간을 측정해 카드 설정에 넣으며, 미설정 기본값은 `9`초다.
- **Cold-load contract**: HA resource entry는 child module보다 먼저 `ha-design-curtain-card`를 동기 등록해야 한다. 공통 compact·template·styles는 instance 생성 뒤 로드하며, 빈 WebKit cache에서 custom element 등록 전에 dependency graph를 기다리게 해서는 안 된다.

#### Curtain tile

1. 실제 공간의 커튼 hero
2. `CURTAIN · LIVING ROOM` 또는 `CURTAIN · BEDROOM` eyebrow
3. `거실 커튼` 또는 `안방 커튼` 제목
4. `열림 64%`, `열리는 중 · 64%`, `닫힘` 중 하나인 한 줄 상태
5. 우상단 상태 badge와 공통 흰 tail `10px`

- tile 전체가 상세 모달을 여는 단일 조작점이다.
- 목록에 열기·닫기·slider를 넣지 않는다.
- 사진 위 커튼 패널은 `current_position`에 따라 중앙 채광 폭이 달라져 숫자 없이도 상태를 구분한다.

#### Curtain modal

1. 현재 위치와 이동 상태를 보여주는 커튼 aperture visual
2. 현재 위치 `0–100%`와 native range
3. `열기`, `정지`, `닫기` 3개 동등 버튼
4. 지원 기능 요약

- range의 `input`은 화면의 위치 미리보기와 `aria-valuetext`만 갱신한다.
- range의 `change`에서 `cover.set_cover_position`을 한 번 호출한다.
- range preview는 실제 `input` 이벤트가 진행되는 동안에만 유지한다. range가 focus를 보유한다는 이유만으로 다음 HA 위치 update를 가리면 안 된다.
- 개폐 중에도 `정지`는 항상 접근 가능해야 한다.
- `open_cover`, `close_cover`, `set_cover_position` 직후에는 `travel_duration`에 따라 매 frame 현재 추정 위치를 갱신한다.
- `stop_cover`는 즉시 추정 위치를 `0–100` 범위의 정수로 고정한다. 이 canonical 위치만 animation state와 전체 template 재렌더에 보존하며, HA가 실제 정지 위치를 보내면 그 값으로 snap한다.
- 보간은 완료 상태를 미리 확정하지 않는다. HA가 목표 또는 중간 위치를 보내면 animation을 취소하고 해당 authoritative 값으로 재동기화한다.
- 모든 버튼은 최소 `44×44px`, range는 native keyboard semantics를 유지한다.
- 모달 닫기·배경·Escape를 지원하고 닫힌 뒤 현재 tile launcher로 초점을 복원한다.

#### Curtain regression gates

1. isolated entry import가 child module을 실행하지 않아도 custom element를 등록하는지 검사한다.
2. slider focus 상태에서 새 `current_position`을 주입해도 output과 range가 authoritative 값으로 바뀌는지 검사한다.
3. fake animation frame으로 open·close·set-position의 중간 위치와 target 도달을 검사한다.
4. open·close 중 stop 직후와 다음 HA 재렌더 모두 위치가 소수 전체를 노출하지 않는 `0–100` 정수인지, 실제 중간 위치가 오면 추정값 대신 실제 값이 표시되는지 검사한다.
5. 배포 전 빈 cache의 iPhone WebKit에서 카드 2개와 상세 modal을 실제 HA resource로 확인한다.

### Cold Storage Card

- **Brief**: 냉장고와 김치냉장고의 문 상태와 칸별 온도를 목록에서 빠르게 파악하고, 상세 모달에서 실제로 연결된 급속냉각과 보관 모드만 조작한다.
- **Shared base**: 두 제품은 `ha-design-cold-storage-card` 한 컴포넌트와 `kind: refrigerator | kimchi` 설정을 공유하며 목록은 `Compact Device Card`의 `164px` 계약을 그대로 사용한다.
- **Color story**: 냉장 상태는 기존 climate blue를, 김치 보관 모드는 절제된 보랏빛 `--accent-curtain`을 재사용한다. 새 전역 색상 토큰은 추가하지 않는다.
- **State source**: `zones[].entity`의 상태와 단위를 권위 원천으로 사용하고, `door_entity`의 `on`/`open` 상태를 문 열림으로 해석한다.
- **Capability boundary**: `quick_cool_entity`가 있을 때만 Power Switch를, `mode_entity`가 있고 options를 읽을 수 있을 때만 Segment Control을 렌더링한다.
- **Asset contract**: 실기기 모델을 먼저 조회하고 삼성 공식 제품 이미지를 사용한다. 실제 제품은 코타화이트 `RF60DB9KF201` 냉장고와 `RQ33DB74D2AP` 3도어 김치냉장고다. 사용자가 승인한 `Warm Studio` 구성만 생산에 사용한다. 두 카드 모두 공식 정면 제품 컷의 전체 실루엣을 따뜻한 차콜·토프·아이보리 스튜디오 배경 위에 분리해 배치하고, 제품 사진과 텍스트 영역은 겹치지 않는다. 승인되지 않은 주방 사진 합성과 CSS 제품 모형은 생산 히어로로 사용하지 않는다.

#### Compact structure

1. 제품 종류에 따라 문 구성이 달라지는 입체 냉장고 scene
2. `APPLIANCE · KITCHEN` 또는 `KIMCHI STORAGE · KITCHEN` eyebrow
3. `냉장고` 또는 `김치냉장고` 제목
4. 칸별 온도와 문 상태, 우상단 `정상`/`문 열림` badge
5. 내용 없는 `10px` 흰 tail

#### Modal information order

1. 축소된 제품 scene과 닫기 버튼
2. 칸별 현재 온도
3. 급속냉각 Power Switch
4. 김치 보관 모드 Segment Control
5. 연결된 기능 요약

- compact 전체가 상세 모달을 여는 단일 조작점이다.
- 급속냉각은 `switch.turn_on`/`switch.turn_off`, 보관 모드는 `select.select_option`을 호출한다.
- 서비스 요청 뒤 값을 낙관적으로 확정하지 않고 다음 `hass` 상태를 권위 원천으로 렌더링한다.
- 모든 조작점은 최소 `44×44px`, modal은 Escape·배경·닫기 버튼을 지원하고 launcher로 포커스를 복원한다.
- `375px`에서 모달은 viewport 안에서 자체 스크롤하고 가로 스크롤을 만들지 않는다.

### Washer Card

- **Brief**: WD25DB8690BE AI 콤보의 현재 운전 단계와 완료 시각을 목록에서 파악하고, 상세 모달에서 SmartThings가 실제 노출하는 옵션만 안전하게 조작한다.
- **Shared base**: 목록은 `Compact Device Card`의 `164px` 계약을 사용한다. 세탁기 파일은 제품 scene, 상태 문구, 상세 UI만 확장한다.
- **Actual capability contract**: 현재 HA의 21개 엔티티 중 시작·일시정지·정지, 물 온도, 헹굼 횟수, 탈수 강도, 세제·유연제 투입량, 버블 불림, 구김 방지만 조작한다.
- **Safety boundary**: `remote_control_entity`가 `off`면 시작 버튼을 렌더링하지 않고 제품에서 스마트컨트롤을 켜라는 안내를 표시한다. 시작은 제품에서 마지막으로 선택한 코스를 실행하며 카드가 코스를 선택한 것처럼 표현하지 않는다.
- **State lifetime**: 완료 시각은 `machine_state`가 `run` 또는 `pause`일 때만 표시한다. 전원 OFF에도 남는 옵션값은 현재 운전값으로 강조하지 않는다.
- **Hero review variants**: 승인 전 로컬 비교 표면에서 `warm`, `deep`, `linen` 세 방향을 렌더링한다. 선택 전에는 HA dashboard·resource에 추가하지 않는다.
- **Spacing ownership**: 세탁기 상세 UI의 간격은 `--space-*` 토큰을 사용한다. 공통 compact primitive 내부의 기존 미세 오프셋은 `ha-design-device-compact.js`가 소유하며 세탁기 확장에서 재정의하지 않는다.

#### Compact structure

1. 삼성 공식 WD25DB8690BE 정면 제품 컷과 상태별 배경
2. `AI COMBO · LAUNDRY` eyebrow, `세탁기` 제목
3. 현재 단계, 완료 예정 시각 또는 원격 제어 상태
4. 우상단 단계 badge와 내용 없는 `10px` 흰 tail

#### Modal information order

1. 현재 단계와 원격 제어 상태
2. 시작·일시정지·정지
3. 물 온도·헹굼 횟수·탈수 강도
4. 세제·유연제 투입량
5. 버블 불림·구김 방지
6. 현재 전력·누적 에너지·누적 물 사용량

- 모든 조작점은 최소 `44×44px`다.
- 원격 제어 OFF 안내는 색상뿐 아니라 텍스트로 원인을 전달한다.
- 모달은 닫기·배경·Escape를 지원하고 launcher로 포커스를 복원한다.
- 상태·서비스 매핑은 `tools/washer-state-test.mjs`, 실제 DOM 계약은 `tools/washer-interaction-test.html`에서 검증한다.

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

## 9. Main Camera Extension

### Product intent

카메라 자체가 주 장비다. 우선순위는 실시간 영상, 녹화 상태, 프라이버시·PTZ 제어, 이벤트 순서다. 녹화 설정과 이벤트 탐색은 서로 다른 사용자 작업이므로 같은 섹션에 섞지 않는다. 사람·움직임·울음 감지는 보조 기능이며, 아기 관련 문구는 메인 상태에 사용하지 않고 이벤트 내역과 알림에서만 노출한다. 사용자 UI에서는 저장소 기술 용어를 쓰지 않고 `녹화`, `녹화 중`으로 표현한다.

### Source resolution

동일 기능은 한 번만 노출한다.

| Capability | Primary source | UI rule |
|---|---|---|
| Live view | Tapo HD stream | Frigate 영상을 중복 표기하지 않는다 |
| Person, motion, cry | Tapo | 제조사 값을 우선한다 |
| Privacy, PTZ, presets, night mode | Tapo | 기기 제어로만 노출한다 |
| Recording storage | Frigate | `Frigate 녹화`, `움직임 구간 저장`으로 표시하고 Tapo SD카드 녹화와 구분한다 |
| Event clips and history | Frigate | 고유 기능으로 표시한다 |

제품 화면에는 통합 이름을 노출하지 않고 `LOCAL`, `녹화 중`처럼 사용자 의미만 보여준다.

### Surfaces

- Compact launcher: 기존 `492×164px` 문법을 유지하며 전체 카드가 상세 화면을 연다.
- 카메라별로 실제 지원하는 기능만 렌더링한다. C225는 PTZ·자동추적·가림감지를 제공하고, 고정형 C120은 해당 기능과 빈 제어 영역을 표시하지 않는다.
- 같은 `ha-design-camera-card`를 카메라별 설정으로 반복 사용하며, 제목·eyebrow·실시간 영상·감지·이벤트 엔티티는 각 인스턴스의 config를 따른다.
- 상세 모달: 기존 기기 카드와 같은 `620px` 폭, `205px` 히어로, `calc(100dvh - 24px)` 최대 높이를 사용한다.
- 상세 모달의 제어는 기존 `.control-section` 문법으로 세로 배치한다.
- 녹화 섹션은 Frigate가 영상을 디스크에 보존할지 제어하는 카메라별 스위치만 소유한다. 카메라의 SD카드 녹화와 무관하며 `움직임이 있는 구간을 10일 저장` 정책을 설명한다.
- Frigate Home Assistant 녹화 스위치는 MQTT 연결 상태가 권위 원천이다. Frigate와 Home Assistant가 같은 MQTT broker에 연결되어 실제 config·switch 상태가 동기화된 경우에만 조작 가능한 녹화 상태로 사용한다.
- 이벤트 섹션은 최근 감지 기록과 `전체 이벤트 보기` 진입점만 소유한다.
- `전체 이벤트 보기`는 날짜별 목록과 종류 필터를 가진 이벤트 전용 모달을 열며, 카메라 상세로 돌아가는 명확한 뒤로가기 동작을 제공한다.
- 이벤트 목록과 활동 상세는 헤더를 중첩하지 않고 하나의 sticky breadcrumb 헤더를 공유한다. 목록은 `거실 카메라 › 이벤트 히스토리`, 상세는 선택 구간의 날짜와 최신 원본 이벤트 시각을 분리해 `거실 카메라 › 이벤트 히스토리 › 2026년 8월 30일 › 19:04:30 이벤트`처럼 표시한다. 날짜 단계는 연도를 생략하지 않는다.
- breadcrumb의 이전 단계는 직접 이동할 수 있고, 좌측 뒤로가기는 한 단계만 복귀하며, 우측 닫기는 전체 카메라 모달을 닫는다. 현재 단계는 `aria-current="page"`로 표시하고 클릭하지 않는다.
- `393px`에서는 의미를 보존한 `카메라 › 이벤트 › 2026년 8월 30일 › 19:04:30 이벤트` 축약 라벨을 사용한다. 공간이 부족하면 하나의 breadcrumb 안에서 두 줄로 자연스럽게 배치하되 날짜·연도·이벤트 시각을 숨기거나 말줄임하지 않는다. 별도 활동 상세 헤더는 추가하지 않는다.
- 이벤트 전용 모달은 사람·움직임·소리를 독립 다중 선택하고, 5분간 새 감지가 없으면 하나의 활동 구간을 닫는다. 달력 날짜에는 숫자 대신 단순 활동 점만 표시한다.
- 선택 날짜 아래 24시간 바는 `00·04·08·12·16·20·24` 4시간 눈금을 사용하며, 구간의 실제 시작 위치와 지속시간을 1440분 비율로 표시한다. 단발성 활동은 폭이 없는 점 마커로 표시한다.
- 활동 구간 목록에는 시간 범위·지속시간·감지 종류만 보여주고, 구간 상세에는 그 안의 원본 이벤트 시각과 종류를 최신순으로 전부 표시한다.
- 활동 상세는 별도 teal 날짜·시간 요약 카드를 만들지 않고 breadcrumb 바로 아래의 `16:9` 녹화 패널을 첫 영역으로 사용한다. 실시간 영상의 기본 UI처럼 영상을 먼저 보여주고, 아래 48px 툴바에 `녹화 영상`과 실제 signed clip 범위 `19:04:15–19:05:25 · 1분 10초`를 배치한다. 날짜는 breadcrumb가 소유하며, 영상 위에 별도 흰 제목 행이나 여백을 만들지 않는다.
- 상세 진입만으로 영상을 요청하거나 자동 재생하지 않고, 사용자가 `녹화 영상 재생`을 누를 때 최신 원본 이벤트의 15초 전부터 55초 후까지 한 번만 불러온다.
- 녹화 경로는 카메라 엔티티의 Frigate `client_id`와 `camera_name`, 원본 이벤트의 ISO timestamp로 구성하고 HA `auth/sign_path`에서 받은 임시 HLS URL만 활성 플레이어에 보관한다. 카드 설정에 Frigate 주소·자격증명·고정 카메라 이름을 추가하지 않는다.
- 활동 상세에는 historical HLS player를 하나만 유지한다. 다른 활동으로 이동하거나 목록·카메라 화면으로 돌아가거나 모달을 닫으면 서명·manifest 요청을 무효화하고 플레이어를 제거한다.
- 녹화 패널은 `재생 전`, `영상 준비 중`, `재생 가능`, `녹화 없음`, `불러오기 실패`를 텍스트로 구분한다. `switch.main_camera_recordings`와 Frigate clip 개수는 과거 녹화의 존재 여부 판정에 사용하지 않는다.
- 카메라 상세와 이벤트 전용 모달은 열릴 때 배경 문서를 잠그고 첫 조작점으로 초점을 옮긴다. `Tab` 초점은 활성 모달 안에 머물며, `Escape`는 이벤트 히스토리에서 카메라 상세로, 카메라 상세에서 원래 카드로 돌아간다.
- 실시간 영상은 제목 장식 이미지가 아니라 별도의 `16:9` 영상 영역과 영상 액션을 가진다.
- 모바일에서는 카드 한 열과 `calc(100vw - 24px)` 모달을 사용한다.

### Interaction and safety

- 모든 조작 목표는 최소 `44×44px`이다.
- 실시간 여부는 영상 타임스탬프로 판단하므로 compact와 상세 영상 모두 `LIVE` 라벨과 파란 점을 표시하지 않는다.
- 녹화 중에만 빨간 점과 `REC`를 표시한다. 배지는 `left: 12px`, `bottom: 52px`에 두어 44px 비디오 컨트롤 바와 8px 간격을 유지하며, media dark 46% 배경과 8px blur를 사용한다.
- PTZ는 설정 각도만큼 한 단계 이동하며 연속 조이스틱처럼 표현하지 않는다.
- 프리셋 엔티티가 `unavailable`이면 임의 위치 이름이나 프리셋 UI를 만들지 않는다.
- 영상·소리 감지는 실제 엔티티 옵션인 `끔`, `낮음`, `보통`, `높음`을 종류별로 제공한다.
- 사이렌, 재부팅, SD 포맷은 일반 카메라 화면에서 제외한다.
- 모바일 한글은 `word-break: keep-all`을 적용하고 고아 음절을 허용하지 않는다.

### Prototype references

`/Users/jerry/Downloads/IMG_3813.PNG`, `IMG_3814.PNG`은 영상 우선 계층, 즉시 액션 행, PTZ 패드, 프리셋 구조만 참고한다. 시각 스타일과 실제 영상 자산은 복제하지 않는다.
