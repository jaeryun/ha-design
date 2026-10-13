# 카메라 카드 계약

## 범위, 권위, 소유자

이 문서는 `custom:ha-design-camera-card`의 소스 계약을 고정한다. 구현 변경 때 실제 코드와 테스트가 권위이며, 운영에 배포된 revision은 resource YAML을 우선한다.

> 운영 상태: 사용자가 기존 녹화 재생이 정상임을 확인했다. 현재 변경은 Tapo 감지와 Frigate 연속 녹화의 역할 분리이며, 기존 재생·드래그 편집·다운로드를 유지한다.

1. `www/ha-design/ha-design-camera-card.js`와 `*.config.js`는 custom element 등록, 설정 경계, HA 상태 주입, dialog/초점/스크롤 수명주기를 소유한다.
2. `*.template.js`는 조건부 화면 의미 구조를, `*.styles.js`는 레이아웃과 반응형 표현을, `ha-design-camera-actions.js`는 HA service와 live player 속성을 소유한다.
3. `ha-design-camera-webrtc.js`는 live WebRTC 연결과 해제를, `ha-design-camera-events.js`/`event-state.js`/`event-controller.js`는 현지 날짜 계산, 실시간·과거 영상 전환, 7일 녹화 조회와 선택 수명주기를 소유한다.
4. `ha-design-camera-recording.js`는 Frigate segment, 절대 시각-미디어 offset, VOD 경로 규칙을, `ha-design-camera-recording-player.js`는 HLS media-event seek와 해제를 소유한다. Tapo 감지 이력은 `ha-design-camera-events.js`가 HA history에서 읽는다.
5. `dashboards/ha-design-camera.yaml`은 카메라 카드 선언과 entity 매핑의 기준이다. 거실 카메라는 `거실`(`living-room`) view에, 아기 카메라는 `아기방`(`baby-room`) view에 배치하며, `dashboards/ha-design.yaml`과 `dashboards/ha-design-inline.yaml`에 같은 카드 설정을 유지한다.
6. 실제 Lovelace module resource의 ID, URL, 고정 revision, cache-bust의 유일한 권위는 `dashboards/ha-design-camera-resource.yaml`이다. 이 문서는 그 변경 가능한 값이나 URL을 복사하지 않는다.
7. `DESIGN.md`는 제품/UX 제약, `PROJECT-STATUS.md`는 과거 실서버 증거다. 상태 문서의 관측값은 새 배포의 대체 증거가 아니다.
8. `ha-design-camera-download.js`는 다운로드 범위·드래그·시간대 변환·서명 링크를, `ha-design-camera-download.template.js`는 편집 dialog를, `ha-design-camera-trim-preview.js`는 확대 시간축·일별 segment cache·독립 HLS 미리보기·선택 구간 재생 수명주기를 소유한다.

필수 config는 `camera_entity`, `privacy_entity`, `recording_entity`다. PTZ entity와 `stream_name`, `frigate_client_id`, `frigate_camera_name`은 선택이다. `event_entities`는 Tapo 감지 `binary_sensor` ID 배열이며 선택 사항이다. 새 config, 날짜 경계 변경, history 종료, dialog close와 disconnect는 관련 비동기 조회·재생을 무효화한다. 일반적인 새 `hass` 상태는 clock과 화면을 갱신하되 같은 날짜의 현재 재생을 보존한다. 카드는 Sections에 `columns: 12`, `min_columns: 4`, `max_columns: 12`를 제공하고 배포 YAML의 각 카드는 `columns: 12`, `rows: auto`를 명시한다.

## C225/C120 설정

| 구분 | C225 거실 카메라 | C120 아기 카메라 |
|---|---|---|
| 카메라/stream | `camera.main_camera`; camera attribute의 이름을 기본 WebRTC stream으로 사용 | `camera.c120`; HA 이름과 go2rtc 이름이 달라 반드시 `stream_name: c120_1` |
| 공통 | privacy, Frigate 연속 녹화, Tapo 감지 이력 | 같은 기능을 제공 |
| C225 전용 | 수동 PTZ, 이동 각도 | 고정형이므로 PTZ와 빈 제어 영역 모두 렌더하지 않음 |
| 영상 | live WebRTC와 과거 VOD | stream override가 적용된 live WebRTC와 과거 VOD |

### Canonical Tapo migration과 PTZ

다음이 C225의 canonical ID다. `_2` suffix 또는 restored legacy ID를 YAML에 되살리지 않는다.

```text
number.geosil_geosilkamera_movement_angle
button.geosil_geosilkamera_move_up
button.geosil_geosilkamera_move_down
button.geosil_geosilkamera_move_left
button.geosil_geosilkamera_move_right
```

Tapo 재등록 중 기기명 변경으로 새 unique ID와 `_2` entity가 생겼으나, 활성 신규 entity를 기존 canonical ID로 복원하고 legacy registry 항목을 제거한 것이 현재 migration 결과다. C225와 C120의 장치 제어·감지 ID는 dashboard YAML이 권위다. 감지 센서가 현재 연결되어 있지 않아도 HA에 보관된 과거 이력은 조회한다.

PTZ는 연속 조이스틱이 아니라 버튼 한 번에 현재 설정 각도만큼 이동한다. 방향 button entity가 `unavailable`이면 해당 버튼을 disabled한다. 각도는 `unknown`/`unavailable`이 아니고 `Number(state)`가 유한할 때만 유효하다. 그 외에는 `—°`, disabled 증감 버튼, 각도 없는 방향 aria-label을 보이며 `NaN°` 또는 임의 service 호출을 만들지 않는다. 유효할 때만 5도씩 attribute `min`/`max` 안으로 clamp해 `number.set_value`를 호출하고 방향은 `button.press`를 호출한다. preset entity가 없거나 `unavailable`이면 가짜 위치명/preset UI를 만들지 않는다.

## Live WebRTC와 native 제어

상세 dialog가 열리고 privacy가 꺼진 경우에만 `ha-design-camera-webrtc-player`를 만든다. player는 camera attribute의 `client_id`, `camera_name`(또는 C120 override)으로 HA `auth/sign_path`를 통해 Frigate go2rtc WebSocket을 서명하고 video/audio `recvonly` transceiver를 모두 협상한다. 외부 STUN server는 쓰지 않는다. entity/stream 변경, dialog close, custom element disconnect 때 socket, peer, media track을 모두 끊고 session 번호로 늦은 결과를 무시한다. 실패는 `실시간 영상을 연결할 수 없습니다`로 알린다.

live는 native `<video controls>`다. 전체화면, controls, 진입/해제는 browser/OS video가 소유한다. 카드에 별도 fullscreen 상태, 닫기 버튼, `LIVE` 배지, `REC` overlay를 만들지 않으며 native fullscreen은 `contain`으로 full frame을 유지한다. live toolbar는 mobile에서도 한 행이고 우측 snapshot은 높이 44px 이상의 내용 폭 버튼이다. snapshot은 camera entity의 `entity_picture`만 다운로드한다.

privacy/Frigate 녹화는 현재 switch state로 `turn_on` 또는 `turn_off`를 정한다. 요청 성공을 낙관적으로 확정하지 않고 다음 HA state로 확정한다. 화면에서는 `촬영 일시 중지`, `녹화`, `사진 저장`으로 표시하며 내부 시스템명이나 반복 상태 설명을 노출하지 않는다. Tapo 감지 민감도·자동 추적 제어와 최근 감지 목록은 제공하지 않는다.

## Frigate 녹화 출처와 보존

화면의 `녹화` switch는 Tapo SD카드가 아니라 Frigate 저장 제어다. 두 카메라는 **전체 영상을 촬영일부터 10일**(`record.continuous.days: 10`) 보관한다. 모션·객체·소리 감지 여부로 저장 구간을 선별하지 않는다. 적용 이전에 폐기된 영상이나 카메라 전원·연결이 끊긴 구간은 복구되지 않는다. 화면에는 `10일 보관`만 안내하고 내부 저장 구조 설명은 이 문서에 둔다.

switch의 권위는 Frigate와 HA가 같은 MQTT broker로 동기화한 recording state다. Tapo는 감지·영상 원본·privacy/수동 PTZ를 담당한다. Frigate는 연속 녹화·보관·VOD를 담당하며 두 카메라의 `motion.enabled`, `detect.enabled`, `audio.enabled`를 모두 `false`로 설정한다. `record.motion.days`, alerts/detections retain days도 0이며, 카드에서 녹화 segment의 `motion` 통계를 사용하지 않는다.

### Tapo 감지 설정과 이벤트 지원

C225의 감지 select 9개와 C120의 8개를 `normal`로 활성화했다. 자동 경보·자동 추적·프라이버시·전원은 변경하지 않는다. 아기 카메라 재연결 때 감지를 끄던 `automation.ha_design_c120_detection_shutdown`과 해당 설정을 삭제했다.

감도 설정을 지원한다고 해당 이벤트가 HA로 전달되는 것은 아니다. 운영 카드에는 실제 연결한 Tapo 감지 센서만 등록한다. 기본 소스는 움직임·사람이며, 추가 종류도 HA에 실제 센서가 생성되어 이력이 수집될 때 `event_entities`로 연결할 수 있다. 현재 Tapo 연동의 아기 울음 이벤트 전달은 지원되지 않는다. `Noise`는 카메라 자체 울음 감지가 아닌 FFmpeg 음량 분석이므로 소스에 포함하지 않는다.

Tapo ONVIF webhook에는 카메라가 접근할 수 있는 HA 내부 URL이 필요하다. Docker bridge IP가 자동 선택되면 카메라가 콜백을 전달할 수 없으므로, NAS의 LAN 주소와 HA 공개 포트를 `internal_url`로 명시한다. 감도 제어 성공만으로 이벤트 연결 성공을 판단하지 않으며 실제 webhook 수신과 센서 전환을 확인한다. HA의 별도 FFmpeg `Noise` 분석은 사용하지 않는다.


## 실시간·과거 영상 전환과 Frigate 출처

상세 dialog의 sticky header는 `실시간`/`과거 영상` 두 버튼을 가진 상단 메뉴(`role="group"`, `aria-pressed`)를 소유한다. 과거 영상 진입점을 이벤트 목록 항목이나 개별 기록 버튼의 하위 단계로 두지 않는다. 메뉴는 두 화면 모두에서 같은 위치에 있고, `Escape`는 과거 영상 → 실시간 → dialog 닫기 순서로만 이동한다. dialog를 닫으면 실시간 화면에서 시작한다.

과거 영상은 **실시간 연결과 독립**이어야 한다. Frigate 식별자는 `frigate_client_id`(=`instance_id`)와 `frigate_camera_name`(=`camera`) config가 있으면 그 값을 쓰고, 없으면 camera entity attribute의 `client_id`/`camera_name`을 쓴다. config도 attribute도 없을 때는 같은 `camera_entity`에서 마지막으로 확인한 값을 재사용한다. 따라서 카메라가 오프라인이거나 Frigate가 프레임을 받지 못해 `camera.<x>`가 `unavailable`이 되어 attribute가 사라져도, 7일 이력 조회·coverage·VOD 재생은 계속 동작해야 한다. 반대로 식별자를 끝내 알 수 없을 때만 과거 영상 화면이 `확인 불가`와 `다시 확인`을 제공한다.

실시간 화면은 camera entity가 `unavailable`/`unknown`이거나 식별자 attribute가 없으면 검은 화면 대신 연결할 수 없는 이유(`카메라에 연결할 수 없습니다`)를 표시하고, live toolbar의 부제를 `연결 끊김`으로 바꾼다. 이 상태에서도 과거 영상 메뉴는 그대로 동작한다.

두 선택 config 필드는 선택 사항이며 `CAMERA_REQUIRED_FIELDS`에 포함하지 않는다. 세 dashboard 사본은 각 카드에 자기 Frigate 카메라 이름을 명시한다.

## 최근 7일 이력과 통합 timeline

### 데이터와 날짜 경계

- HA timezone으로 오늘을 포함한 최근 7개 현지 날짜를 만든다. 시작은 여섯 날짜 전 현지 자정, 끝은 현재이며 DST의 23/25시간 날짜도 실제 epoch 경계를 쓴다.
- Tapo `event_entities`의 HA `history/period`를 선택 날짜 경계부터 조회한다. 응답 series는 순서가 아니라 `entity_id`로 매핑하고, 조회 시작의 이월 상태를 새 감지로 세지 않는다. 실제 `on` 전환 시점을 원본 이벤트로 보존하고 표시 단계에서 활동 구간으로 묶는다.
- Frigate summary는 위 규칙으로 해석한 출처의 `instance_id`를, 선택 날짜 조회는 같은 `camera`를 전달하고 HA timezone으로 조회한다. summary는 날짜 선택기의 요약 전용이다.
- 선택 날짜의 coverage는 `frigate/recordings/get`의 실제 `start_time`, `end_time`, `duration` segment만으로 만든다. raw JSON 문자열과 이미 parse된 배열을 모두 검증한다. summary, recording switch, 감지 이력으로 연속 녹화를 추정하지 않는다.
- 화면 범례는 `감지`와 `녹화`로 표시한다. 감지 이력·센서 상태로 녹화 존재를 추정하지 않는다. HA 감지 이력과 Frigate summary/segment 조회는 독립적이며 한쪽 실패가 다른 쪽 결과를 지우지 않는다.

날짜를 고른 직후 query 대기·fallback 선택은 **오늘이면 현재(라이브 끝), 지난 날짜면 현지 정오**다. segment query가 성공하고 더 새로운 사용자 입력이 없으면 그 기준 시각에 **가장 가까운** 녹화 구간으로 들어가고, 구간 끝에 붙지 않도록 `clamp(기준 시각, start, max(start, end - 60))`를 쓴다. pointer/keyboard의 새 선택은 진행 중 day query와 자동 선택보다 우선한다. segment query 뒤의 시간은 `unknown`이며 future가 아니다.

### coverage 상태와 입력

| 상태 | 의미와 동작 |
|---|---|
| `recorded` | 3분 이하 공백까지 병합한 녹화 블록이다. 블록 안의 구멍을 선택하면 가장 가까운 실제 영상으로 붙여 VOD를 준비한다. |
| `gap` | 조회 완료 범위 안의 **3분 초과** 무녹화 구간이다. 표시 전용이며 timeline 입력은 공백에 머무르지 않고 가장 가까운 녹화로 붙는다. 3분 이하 공백은 같은 녹화로 보므로 gap이 아니고, 녹화가 전혀 없는 날짜는 `빈 날짜`다. |
| `unknown` | source 부재 또는 마지막 segment query 이후의 미확인 구간이다. 녹화 없음으로 추정하지 않는다. |
| `loading` | 선택 날짜의 segment query 중이다. |
| `error` | Frigate query 실패다. 재시도를 제공한다. |
| 빈 날짜 | query 성공 후 recorded segment가 하나도 없는 확인된 녹화 없음이다. |
| `future` | 현재 이후다. 단색 영역만 표시하고 guide를 그리지 않으며 seek는 현재로 clamp한다. |
| `unavailable` | 목록에는 있으나 HLS가 404여서 재생하지 못하는 상태다. coverage 확인과 재생 성공을 혼동하지 않는다. |

순서는 sticky header(상단 메뉴 포함), 7일 선택기, 16:9 media, 통합 timeline이다. `이전 녹화`/`다음 녹화`는 `.history-nav`에 항상 노출하고 이웃 블록이 없으면 disabled다. 이 버튼은 segment가 아니라 **녹화 블록** 사이를 이동한다. 녹화 블록은 선택 날짜로 자른 segment를 `RECORDING_BLOCK_GAP`(180초) 이하 공백까지 병합한 구간이며, 다음은 블록 시작, 이전은 블록 끝 1초 전으로 이동한다. 현재 블록은 제외하며 날짜 밖으로 이동하지 않는다. VOD window와 offset은 정확한 segment를 쓴다. Tapo event lane과 square-ended coverage lane은 하나의 시간축·playhead를 공유하며, desktop `00·04·08·12·16·20·24`, mobile `00·06·12·18·24` 축과 guide를 같은 좌표에 둔다.

`events`는 원본 `{id, entityId, label, time}` 배열이다. `eventSources`, `eventsStatus`, `unavailableEventSources`는 현재 소스와 이력 조회 상태를 녹화와 독립적으로 표현한다. `eventFilter`는 전체 또는 한 소스를 선택하고 `cameraVisibleEvents()`가 해당 원본 이벤트를 반환한다. 필터를 적용한 뒤 `groupCameraEvents()`가 인접 이벤트 간격 **30분 이하**를 하나의 활동으로 묶는다. 간격이 30분을 넘거나 HA 현지 날짜가 바뀌면 분리한다. 연쇄 활동은 총 길이가 30분을 넘을 수 있다.

타임라인에는 활동당 하나의 표시를 그린다. 여러 이벤트는 첫 감지부터 마지막 감지까지의 띠이며, 단일 이벤트는 해당 시각의 작은 표시다. ON 지속 시간이나 마지막 감지 뒤의 여유 시간을 활동에 추가하지 않는다. 이 띠는 연속 움직임을 보장하지 않는다. 활동 범위·건수는 스크린리더 요약에 보존하되 화면에는 선택한 감지 종류·원래 시각만 표시한다. 묶음 규칙 설명, 기술 용어, 정상 재생 중의 `녹화 있음` 등 중복 문구는 상시 노출하지 않는다. 오류와 실제 녹화 공백은 짧은 안내와 필요한 재시도 버튼으로 알린다.

활동을 선택할 때는 누른 위치와 가장 가까운 실제 감지 시각의 Frigate 영상을 탐색한다. 정확한 시각에 녹화가 없어 가까운 영상으로 이동하더라도 `selectedEvent.time`은 원래 감지 시각을 보존하고 문맥에서 차이를 알린다. 일반 녹화 탐색·날짜/config 변경은 감지 선택을 해제한다. 현재 센서가 `unavailable`이어도 과거 이력을 숨기지 않으며, 감지 이력이 비어 있다고 그 시간에 아무 일도 없었다고 단정하지 않는다.

하나의 `role="slider"`가 전체 timeline을 조작한다. 좌/우는 1분, Home은 날짜 시작, End는 날짜 끝 또는 현재, Enter/Space는 현재 필터에서 가장 가까운 감지 점을 선택한다. pointer drag는 문지르는 동안 playhead와 시각 표시만 갱신하고 VOD를 요청하지 않으며, 손을 뗄 때 한 번만 실제 seek한다. 미래 시각은 선택할 수 없다.

### 절대 시각 VOD와 offset

recorded 시각은 그 시각이 속한 현지 시간의 1시간 VOD 범위를 요청한다. server keyframe 시작 보정으로 offset이 흔들리지 않도록, 시간 경계와 겹치는 양끝 segment는 자르지 않고 전체를 포함한다. 24시간 monolith와 고정 길이 event clip은 금지한다.

Frigate VOD는 벽시계 gap을 제거하고 segment media `duration`을 이어 붙인다. seek는 선택 절대 시각까지의 **실제 media duration 누적값**을 쓰고 gap은 offset에 더하지 않는다. player의 native seek/timeupdate도 같은 역변환으로 playhead를 절대 시각에 되돌린다. master와 실제 child HLS playlist는 각각 HA `auth/sign_path`로 서명하고, master codec metadata를 보존한 wrapper에서 서명 child만 참조한다. 주소, credential, 고정 camera 이름을 코드/YAML에 넣지 않는다.

Apple mobile에서 native HLS를 지원하면 plain `<video>`에 서명 child URL을 주고, 그 밖에는 `ha-hls-player`를 쓴다. metadata/duration/render/media event를 구독한 뒤 seek하며 시간 기반 대기나 private HA lifecycle 호출을 쓰지 않는다. 같은 video node가 reload될 때 `currentTime=0` reset을 재생 진척으로 해석하지 않고, media 준비 뒤 마지막 유효 offset을 복원한다.

### 과거 영상 MP4 다운로드

- 과거 영상 아래 `영상 다운로드` 버튼을 제공한다. 녹화 조회가 완료되고 실제 segment가 있을 때만 활성화된다. 현재 감지가 선택되어 있으면 원래 감지 시각부터, 아니면 재생 위치부터 약 1분을 기본값으로 쓴다. 끝은 확인된 녹화 범위를 넘지 않는다.
- native dialog의 주 표면은 실제 영상 미리보기와 시작·끝 드래그 손잡이다. 초기 시간축은 선택 구간 주변을 확대해서 보여주고, 확대·축소·이전/다음 구간·맞춤과 시작/끝 화면 보기로 탐색한다. 손잡이는 서로 교차하지 않으며 최소 1초를 유지한다. 방향키는 1초, Shift+방향키는 10초씩 조절한다. 짧은 구간에서도 두 44px touch target이 겹치지 않도록 시작과 끝 손잡이를 위·아래에 둔다.
- 시작 손잡이는 그 시각, 끝 손잡이는 종료 경계 0.05초 전의 포함된 화면을 미리 본다. 손을 놓기 전에도 seek가 진행된다. 확인된 프레임의 시각과 요청 시각을 구분하며 seek 중에는 이동 안내, 실제 녹화가 없는 시각에는 영상 없음 상태로 이전 프레임을 가린다. 미리보기는 큰 녹화 공백을 가까운 영상으로 조용히 스냅하지 않는다.
- `loadCameraRecording()`으로 기본 과거 재생과 동일한 master/child 서명·1시간 VOD 규칙을 재사용한다. 같은 VOD 안의 드래그는 manifest를 다시 요청하지 않고 기존 video를 seek한다. seek 진행 중에는 최신 목표를 합쳐 다음 `seeked`에 반영하므로 decoder를 매 pointermove마다 취소하지 않는다. metadata만으로 화면 표시를 확정하지 않고 readyState와 seeking 상태를 확인한 `onFrame`을 사용한다.
- `선택 구간 재생`은 저장된 첫 구간부터 시작하고 끝에서 멈춘다. 시간대 경계·녹화 공백을 넘으면 다음 저장 구간의 VOD로 이어진다. 편집 dialog가 열리면 뒤의 기본 과거 영상은 일시 정지한다. 닫기·날짜/config 변경·disconnect는 preview fetch와 미디어 구독을 해제하며, 늦은 결과로 새 편집 세션을 덮어쓰지 않는다.
- 날짜·초 단위 직접 입력은 보조 기능으로 접어 둔다. 펼쳤을 때 HA timezone을 명시하고 브라우저 timezone으로 해석하지 않는다. 최근 7개 현지 날짜부터 현재까지가 허용 범위이며 날짜를 넘는 구간도 지정할 수 있다. DST에 존재하지 않는 시각은 거부하고, 반복 시각은 실제 녹화 또는 시각적 드래그의 epoch로 식별한다.
- 준비 시 `frigate/recordings/get`으로 해당 범위를 다시 조회한다. 겹치는 segment는 중복 계산하지 않고, 녹화가 전혀 없거나 역전·미래·범위 밖 입력이면 링크를 만들지 않는다. 1초 이상 녹화 공백이 있으면 누락 시간과 저장된 영상만 이어진다는 안내를 다운로드 전에 표시한다.
- `/api/frigate/{instance_id}/recording/{camera}/start/{start}/end/{end}`를 HA `auth/sign_path`로 600초 동안 서명한다. 이 경로는 설치된 Frigate의 on-demand `clip.mp4`로 연결된다. 영구 export 생성 API나 export DB 행은 사용하지 않는다.
- `선택 구간 확인`으로 범위와 다운로드 주소를 준비하고, `다운로드` 링크를 누르면 Frigate가 stream-copy MP4를 생성해 브라우저가 직접 저장한다. 카드에서 전체 파일을 Blob/ArrayBuffer로 모으지 않는다. 파일명은 카메라 제목과 HA 현지 시작·종료 시각을 포함하고 파일명 구분 문자는 제거한다.
- 클릭 후에는 `다운로드 요청` 상태만 알린다. 실제 완료·진행·서버 스트림 실패·취소는 브라우저 다운로드 관리자가 소유하며, 카드가 저장 성공을 단정하지 않는다. 키프레임 경계로 실제 시작·끝은 약간 달라질 수 있으므로 화면에는 저장 시각이 조금 달라질 수 있다는 짧은 안내를 유지한다. NAS/export·서명 링크 유효 시간·파일명 나열·키보드 조작법을 상시 설명문으로 표시하지 않는다.
- 범위 편집, dialog 닫기, 날짜·config 변경, history 종료와 disconnect는 이전 준비 generation과 서명 링크를 무효화한다. 만료된 링크 클릭은 막고 다시 준비하도록 안내한다. 이미 브라우저가 시작한 다운로드는 dialog를 닫아도 카드가 취소하지 않는다.
- HA state/video timeupdate는 편집 중인 native date input과 선택 범위를 덮어쓰지 않는다. Escape는 편집 dialog만 닫고 진입 버튼으로 초점을 복원한다. 375px에서도 미리보기·손잡이·오류·공백 안내가 가로 overflow 없이 표시되어야 한다. slider의 수치는 큰 epoch 대신 조회 범위 시작부터의 초를 쓰고, `aria-valuetext`는 실제 날짜와 시각을 제공한다.
- 실제 iPhone/iPad HA app의 파일 저장·공유는 별도 실기기 검증 대상이다. native-HLS 재생 검증은 MP4 파일 저장 검증을 대신하지 않는다.


### 경쟁 조건과 종료

controller의 load/day/recording generation과 selection revision은 다음을 보장한다.

- 느린 Tapo history, summary, day segment, master/child manifest가 최신 선택, 새 config, 닫힌 화면을 덮어쓰지 않는다.
- 새 날짜/seek, back/close, `setConfig`, disconnect는 해당 조회 generation을 올리고 이전 결과를 무효화하며 VOD fetch는 `AbortController`로 취소한다.
- 감지 이력·summary·day recording request는 독립적이므로 한쪽 오류가 다른 쪽 데이터를 지우지 않는다.
- history Escape/back은 카메라 상세로, 상세 Escape/닫기는 launcher로 돌아간다. 종료 시 HLS 구독을 해제하고 native video는 pause, `src` 제거, `load()`까지 수행하며 WebRTC도 제거한다.

## 접근성 및 반응형

- compact 전체는 단일 dialog launcher(`role="button"`, `aria-haspopup="dialog"`, `aria-expanded`)다. click/Enter/Space로 열고 목록 내부에는 즉시 제어를 넣지 않는다.
- native dialog가 모달 초점 격리를 맡는다. 열 때 닫기 버튼으로, 과거 영상으로 갈 때 `과거 영상` 메뉴 버튼으로, 실시간으로 돌아올 때 `실시간` 메뉴 버튼으로, 닫을 때 launcher로 초점을 복원하며 배경 문서 scroll은 dialog 동안만 잠근다.
- 상단 메뉴는 `role="group"` 안의 `aria-pressed` 토글 두 개(`실시간`/`과거 영상`)이고 최소 44px이다. 같은 메뉴가 두 화면 모두에서 sticky header에 남는다.
- 모든 버튼/switch는 최소 44px, timeline의 작은 감지 점은 넓은 pointer 탐색 허용 범위와 키보드 선택을 제공한다. PTZ 방향은 48px이다. switch는 `role="switch"`/`aria-checked`, timeline은 현재 시각을 담은 slider ARIA를 쓴다. 감지 종류·시각은 screen reader용 설명에도 제공한다.
- dialog는 `min(620px, 100vw - 24px)`, 최대 높이는 `100dvh - 24px`이며 내부 `.dialog-scroll`만 세로 scroll을 소유한다. mobile에서는 padding을 줄이고 PTZ를 한 열로 바꾼다.
- 한국어 상태/오류 문맥은 `word-break: keep-all`, 모든 조작은 focus-visible, reduced-motion에서는 transition 제거를 유지한다. 375px에서 문서와 dialog 가로 overflow는 없어야 한다.

## 검증 게이트

### 자동 테스트

카메라 변경 시 다음 정확한 Node 게이트를 실행한다.

```sh
node tools/camera-deployment-test.mjs
node tools/camera-events-test.mjs
node tools/camera-download-test.mjs
node tools/camera-native-fullscreen-test.mjs
node tools/camera-ptz-test.mjs
node tools/camera-recording-player-test.mjs
node tools/camera-history-browser-test.mjs
```

- deployment test는 세 dashboard 사본의 두 custom card, canonical entity, C120 stream override, resource 형식, module 의존과 live WebRTC/no-overlay 계약을 검사한다.
- events test는 7일/DST 경계, sparse/reordered HA history·이월 상태·중복 전환, 감지 조회와 녹화 조회의 독립 실패, 원래 감지 시각 보존, segment coverage, duration offset, 1시간 VOD range, keyboard/pointer, raw/parsed WS, stale history/day/summary/manifest 취소, 404를 검사한다.
- download test는 시간대·DST·날짜 경계, 기본 구간, coverage와 공백, 파일명, 잘못된 범위, 늦은 응답, 서명 만료, 손잡이 교차·미래 차단과 viewport 경계를 검사한다. browser runner는 실제 pointer drag를 놓기 전 프레임 갱신, 양끝 시각·끝 직전 프레임, 같은 시간 VOD 재사용, 확대·맞춤, 선택 구간 재생 종료, 공백의 이전 프레임 제거, 직접 입력 보존과 Escape/초점 복원을 검증한다. HA/native HLS 두 분기에서 시작·끝 프레임과 종료 정리도 검사한다. 실제 다운로드 파일은 HA에서 별도로 확인한다.
- native-fullscreen, PTZ, recording-player test는 각각 native fullscreen, invalid-angle `—°`/disabled, 동일 media node reload의 offset 복원, metadata 이전에 바뀐 preview 목표 보존, decode 전·seek 중 프레임 확정 차단과 해제 후 늦은 프레임 무시를 검사한다.
- browser runner는 실제 Chromium **375, 768, 1280px**에서 HA/native HLS interaction과 7일 selector, 단일 slider/축/playhead, overflow, VOD offset, Tapo 감지 선택·종류 필터, 감지 실패/빈 이력에서도 녹화 재생 유지, pending query 중 입력 보존, Escape를 확인한다. evidence 출력은 `/tmp/ha-design-production-camera-history`다.
- `tools/camera-interaction-test.html`은 live/control/modal/C120 fixture다. `?native-hls`는 Apple native-HLS 분기, `#visual-c120`은 C120 video-controls 시각 surface다. 이 파일은 browser runner에서도 양 HLS 분기로 실행된다.
- `tools/camera-time-history-variants.html`은 시간 우선 시각 참고다. 승인 시안은 production 동작의 권위나 pass gate를 대신하지 않는다.

관련 camera module에는 `node --check`, 변경 파일에는 LSP diagnostics와 `git diff --check`도 통과해야 한다. browser test는 고정 clock, 명시 event 구독, bounded timeout을 사용해야 하며 sleep으로 통과시키면 안 된다.

### 실제 HA QA

자동 fixture는 실서버를 대신하지 않는다. 실제 QA는 resource authority에 등록된 module을 사용하고 dashboard 설정과 기기 상태를 기록한 뒤 원복한다.

1. Desktop에서 C225/C120 compact와 detail을 열어 entity, C120 `c120_1`, privacy on/off, WebRTC video+audio/native controls, 녹화 정책 문구를 확인한다. 두 카메라 모두 Tapo 감지·자동 추적 제어가 없어야 하고 C120에는 PTZ도 없어야 한다.
2. C225는 canonical 각도와 네 방향을 확인한다. PTZ를 움직였다면 반대 방향으로 원위치하고 invalid angle에서 `—°`/disabled 증감을 확인한다.
3. 실제 7일 summary/segment, 한 recorded 시각, 한 gap, 현재 이후, query failure/unknown을 확인한다. 절대 시각, 1시간 VOD 범위, media offset, native controls seek가 같은 지점을 가리켜야 한다.
4. 393px 안팎 mobile과 desktop에서 7일 selector, 감지 종류 필터, mobile/desktop tick, event-coverage separation, dialog/document overflow, Korean 줄바꿈, focus/Escape/scroll 복원을 확인한다.
5. iPhone/iPad 실제 HA app WebKit에서 live WebRTC, native HLS VOD, video fullscreen, background/close 뒤 정지를 확인한다. mock native-HLS pass만으로 통과시키지 않는다.
6. 상단 `실시간`/`과거 영상` 메뉴로 화면을 오가고, drag로 timeline을 문지른 뒤 손을 뗀 시점의 녹화가 재생되는지 확인한다. 문지르는 동안 VOD 요청이 반복되지 않아야 한다.
7. 카메라 전원을 끄거나 Frigate가 프레임을 받지 못하게 한 상태에서 다시 열어, 실시간 화면은 `카메라에 연결할 수 없습니다`를 보이고 **과거 영상은 그대로 조회·재생**되는지 확인한다. 이 항목은 과거 영상이 실시간 연결에 묶이지 않는다는 계약의 실기기 증거다.

상태 문서의 최근 실서버 증거는 desktop 실제 segment VOD/1920x1080 재생, 393px tick/4px/overflow, C120 WebRTC 2560x1440, C225 PTZ 복원이다. 이는 당시 관측일 뿐 다음 배포에서는 위 절차를 다시 수행한다.

## iOS/HACS 위험

- iOS/HA app WebKit은 Hls.js media 오류가 있었고 native HLS도 discontinuity/init segment 경계에 민감했다. 구현은 Frigate discontinuous VOD, master/child 개별 서명, Apple mobile native video를 사용하지만 실제 물리 iPhone/iPad 검증은 여전히 배포 게이트다. 검은 화면, audio/video metadata 불일치, 빠른 manifest와 close 중 stale 복귀를 확인한다.
- native/HA HLS 분기는 user agent와 `canPlayType`에 의존한다. 새 iPad 식별, HA app WebView, Frigate playlist/codec 변경 때 재검증하며 credential이나 signed URL을 로그/시안/문서에 저장하지 않는다.
- `hacs.json`은 현재 theme package용이다. 카메라 카드는 HACS frontend plugin으로 배포되지 않았고 Lovelace module resource 등록이 필요하다. HACS 설치/업데이트가 resource 자동 등록이나 cache 갱신을 한다고 가정하지 않는다.
- resource는 branch나 움직이는 URL이 아니라 배포 revision과 새 cache-bust로만 갱신한다. revision/URL은 `dashboards/ha-design-camera-resource.yaml` 한 곳에서만 관리하고, 배포 뒤 CDN 본체와 재귀 module이 같은 배포본인지 실제 HA에서 확인한다.
