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
| On teal | `--accent-on` | `#0E9AA7` | 전원 ON |
| Energy green | `--accent-energy` | `#2FA36B` | 절전 ON |
| Warning rose | `--status-warning` | `#C25B6A` | 제한·오류 |
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

- **Structure**: 상태 이미지, 짧은 엔티티명, 상태 요약, 현재 온도·습도, 전원 스위치, 상세 토글
- **Default**: 여러 기기를 동시에 훑을 수 있도록 축약 상태로 시작
- **Expanded**: `aria-expanded` 토글로 같은 카드 아래에 전체 조작부를 인라인 표시
- **States**: on, off, expanded, focus-visible, unavailable
- **Accessibility**: 상세 토글과 전원 스위치를 분리하고 각각 최소 `44 × 44px` 조작 영역 제공
- **Motion**: 상세 영역은 220ms 이내로 나타나며 reduced-motion에서는 즉시 전환

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

없음.
