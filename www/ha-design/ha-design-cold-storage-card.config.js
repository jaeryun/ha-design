const LABELS = {
  kind: "기기 종류",
  title: "카드 제목",
  eyebrow: "상단 라벨",
  model_name: "모델명",
  hero_variant: "히어로 스타일",
  hero_image: "배경 이미지 URL",
  hero_product_image: "제품 이미지 URL",
  zones: "칸별 온도 설정",
  door_entity: "문 상태",
  door_entities: "문 상태 목록",
  quick_cool_entity: "급속냉각",
  quick_freeze_entity: "급속냉동",
  mode_entity: "보관 모드",
  power_entity: "현재 전력",
  energy_entity: "누적 에너지",
  energy_difference_entity: "에너지 차이",
  power_energy_entity: "전력 에너지",
  energy_saved_entity: "절약 에너지",
  section_eyebrow: "상세 섹션 라벨",
  section_title: "상세 섹션 제목",
  summary_label: "요약 라벨",
  normal_status: "정상 상태 문구",
};

const entityField = (name, domain, multiple = false) => ({
  name,
  selector: { entity: { filter: { domain }, ...(multiple ? { multiple: true } : {}) } },
});

export const coldStorageConfigForm = () => ({
  schema: [
    {
      name: "kind",
      required: true,
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "refrigerator", label: "냉장고" },
            { value: "kimchi", label: "김치냉장고" },
          ],
        },
      },
    },
    ...["title", "eyebrow", "model_name", "hero_variant", "hero_image", "hero_product_image"]
      .map((name) => ({ name, selector: { text: {} } })),
    { name: "zones", selector: { object: {} } },
    entityField("door_entity", "binary_sensor"),
    entityField("door_entities", "binary_sensor", true),
    entityField("quick_cool_entity", "switch"),
    entityField("quick_freeze_entity", "switch"),
    entityField("mode_entity", "select"),
    ...[
      "power_entity",
      "energy_entity",
      "energy_difference_entity",
      "power_energy_entity",
      "energy_saved_entity",
    ].map((name) => entityField(name, "sensor")),
    ...["section_eyebrow", "section_title", "summary_label", "normal_status"]
      .map((name) => ({ name, selector: { text: {} } })),
  ],
  computeLabel: (schema) => LABELS[schema.name] ?? schema.name,
});
