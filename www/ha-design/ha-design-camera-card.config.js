const LABELS = {
  title: "카드 제목",
  eyebrow: "상단 라벨",
  stream_name: "go2rtc 스트림 이름",
  frigate_client_id: "Frigate 클라이언트 ID",
  frigate_camera_name: "Frigate 카메라 이름",
  camera_entity: "실시간 카메라",
  privacy_entity: "프라이버시 모드",
  recording_entity: "녹화",
  movement_angle_entity: "방향 이동 각도",
  move_up_entity: "위로 이동",
  move_down_entity: "아래로 이동",
  move_left_entity: "왼쪽 이동",
  move_right_entity: "오른쪽 이동",
};

const REQUIRED = new Set([
  "camera_entity",
  "privacy_entity",
  "recording_entity",
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
];

export const CAMERA_REQUIRED_FIELDS = [...REQUIRED];

export const cameraConfigForm = () => ({
  schema: [
    ...["title", "eyebrow", "stream_name", "frigate_client_id", "frigate_camera_name"].map((name) => ({
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
