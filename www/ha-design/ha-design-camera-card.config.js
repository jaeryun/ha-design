const LABELS = {
  title: "카드 제목",
  eyebrow: "상단 라벨",
  stream_name: "go2rtc 스트림 이름",
  camera_entity: "실시간 카메라",
  privacy_entity: "프라이버시 모드",
  recording_entity: "녹화",
  movement_angle_entity: "방향 이동 각도",
  move_up_entity: "위로 이동",
  move_down_entity: "아래로 이동",
  move_left_entity: "왼쪽 이동",
  move_right_entity: "오른쪽 이동",
  auto_track_entity: "자동 추적",
  motion_detection_entity: "움직임 감지",
  person_detection_entity: "사람 감지",
  pet_detection_entity: "반려동물 감지",
  vehicle_detection_entity: "차량 감지",
  tamper_detection_entity: "가림·훼손 감지",
  cry_detection_entity: "울음 감지",
  bark_detection_entity: "짖는 소리 감지",
  meow_detection_entity: "고양이 소리 감지",
  glass_detection_entity: "유리 파손 감지",
  motion_event_entity: "움직임 이벤트 기록",
  person_event_entity: "사람 이벤트 기록",
  sound_event_entity: "소리 이벤트 기록",
};

const REQUIRED = new Set([
  "camera_entity",
  "privacy_entity",
  "recording_entity",
  "motion_event_entity",
  "person_event_entity",
  "sound_event_entity",
]);

const ENTITY_FIELDS = [
  ["camera_entity", "camera"],
  ["privacy_entity", "switch"],
  ["recording_entity", "switch"],
  ["movement_angle_entity", "number"],
  ["move_up_entity", "button"],
  ["move_down_entity", "button"],
  ["move_left_entity", "button"],
  ["move_right_entity", "button"],
  ["auto_track_entity", "switch"],
  ["motion_detection_entity", "select"],
  ["person_detection_entity", "select"],
  ["pet_detection_entity", "select"],
  ["vehicle_detection_entity", "select"],
  ["tamper_detection_entity", "select"],
  ["cry_detection_entity", "select"],
  ["bark_detection_entity", "select"],
  ["meow_detection_entity", "select"],
  ["glass_detection_entity", "select"],
  ["motion_event_entity", "binary_sensor"],
  ["person_event_entity", "binary_sensor"],
  ["sound_event_entity", "binary_sensor"],
];

export const CAMERA_REQUIRED_FIELDS = [...REQUIRED];

export const cameraConfigForm = () => ({
  schema: [
    ...["title", "eyebrow", "stream_name"].map((name) => ({
      name,
      selector: { text: {} },
    })),
    ...ENTITY_FIELDS.map(([name, domain]) => ({
      name,
      required: REQUIRED.has(name),
      selector: { entity: { filter: { domain } } },
    })),
  ],
  computeLabel: (schema) => LABELS[schema.name] ?? schema.name,
});
