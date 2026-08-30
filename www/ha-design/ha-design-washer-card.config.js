const LABELS = {
  title: "카드 제목",
  eyebrow: "상단 라벨",
  model_name: "모델명",
  hero_variant: "히어로 스타일",
  hero_product_image: "제품 이미지 URL",
  control_entity: "운전 제어",
  power_entity: "전원 상태",
  remote_control_entity: "원격 제어 상태",
  machine_state_entity: "기기 상태",
  job_state_entity: "작업 상태",
  completion_time_entity: "완료 예정 시각",
  water_temperature_entity: "물 온도",
  rinse_cycles_entity: "헹굼 횟수",
  spin_level_entity: "탈수 강도",
  detergent_entity: "세제 투입량",
  softener_entity: "유연제 투입량",
  bubble_soak_entity: "버블 불림",
  wrinkle_prevent_entity: "구김 방지",
  child_lock_entity: "차일드 락",
  wrinkle_prevent_active_entity: "구김 방지 활성",
  power_usage_entity: "현재 전력",
  energy_entity: "누적 에너지",
  energy_difference_entity: "에너지 차이",
  energy_saved_entity: "절약 에너지",
  power_energy_entity: "전력 에너지",
  water_consumption_entity: "물 사용량",
};

const REQUIRED = new Set([
  "control_entity",
  "power_entity",
  "remote_control_entity",
  "machine_state_entity",
  "job_state_entity",
  "completion_time_entity",
]);

const ENTITY_FIELDS = [
  ["control_entity", "select"],
  ["power_entity", "binary_sensor"],
  ["remote_control_entity", "binary_sensor"],
  ["machine_state_entity", "sensor"],
  ["job_state_entity", "sensor"],
  ["completion_time_entity", "sensor"],
  ["water_temperature_entity", "select"],
  ["rinse_cycles_entity", "number"],
  ["spin_level_entity", "select"],
  ["detergent_entity", "select"],
  ["softener_entity", "select"],
  ["bubble_soak_entity", "switch"],
  ["wrinkle_prevent_entity", "switch"],
  ["child_lock_entity", "binary_sensor"],
  ["wrinkle_prevent_active_entity", "binary_sensor"],
  ["power_usage_entity", "sensor"],
  ["energy_entity", "sensor"],
  ["energy_difference_entity", "sensor"],
  ["energy_saved_entity", "sensor"],
  ["power_energy_entity", "sensor"],
  ["water_consumption_entity", "sensor"],
];

export const washerConfigForm = () => ({
  schema: [
    ...["title", "eyebrow", "model_name", "hero_variant", "hero_product_image"]
      .map((name) => ({ name, selector: { text: {} } })),
    ...ENTITY_FIELDS.map(([name, domain]) => ({
      name,
      required: REQUIRED.has(name),
      selector: { entity: { filter: { domain } } },
    })),
  ],
  computeLabel: (schema) => LABELS[schema.name] ?? schema.name,
});
