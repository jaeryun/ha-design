const ACTIVE_MACHINE_STATES = new Set(["run", "pause"]);
const KNOWN_PHASES = new Set([
  "air_wash",
  "ai_rinse",
  "ai_spin",
  "ai_wash",
  "cooling",
  "delay_wash",
  "drying",
  "finish",
  "freeze_protection",
  "pre_wash",
  "rinse",
  "spin",
  "wash",
  "weight_sensing",
  "wrinkle_prevent",
]);

const entityState = (hass, entityId, fallback = "unknown") =>
  hass?.states?.[entityId]?.state ?? fallback;

export const washerPhaseLabel = (phase) => ({
  air_wash: "에어워시",
  ai_rinse: "AI 헹굼 중",
  ai_spin: "AI 탈수 중",
  ai_wash: "AI 세탁 중",
  cooling: "냉각 중",
  delay_wash: "예약 대기",
  drying: "건조 중",
  finish: "완료",
  freeze_protection: "동파 방지",
  idle: "대기",
  pause: "일시정지",
  pre_wash: "예비 세탁 중",
  rinse: "헹굼 중",
  spin: "탈수 중",
  status_check: "상태 확인 중",
  wash: "세탁 중",
  weight_sensing: "세탁량 감지 중",
  wrinkle_prevent: "구김 방지 중",
})[phase] ?? "상태 확인 중";

export const buildWasherState = (hass, config) => {
  const command = hass?.states?.[config.control_entity];
  const commandReady = Boolean(
    command &&
    !["unknown", "unavailable"].includes(command.state) &&
    ["run", "pause", "stop"].every((option) =>
      command.attributes?.options?.includes(option)),
  );
  const powerOn = entityState(hass, config.power_entity, "off") === "on";
  const remoteReady =
    entityState(hass, config.remote_control_entity, "off") === "on";
  const machine = entityState(hass, config.machine_state_entity, "unknown");
  const rawJob = entityState(hass, config.job_state_entity, "none");
  const isActive = ACTIVE_MACHINE_STATES.has(machine);
  const completionTime = entityState(hass, config.completion_time_entity);
  const completionAvailable =
    !["unknown", "unavailable"].includes(completionTime);
  const phase = machine === "pause"
    ? "pause"
    : isActive && KNOWN_PHASES.has(rawJob)
      ? rawJob
      : machine === "stop"
        ? "idle"
        : "status_check";
  const canStart =
    powerOn &&
    remoteReady &&
    commandReady &&
    machine === "stop";
  const primaryAction = machine === "run"
    ? "pause"
    : machine === "pause"
      ? "start"
      : canStart
        ? "start"
        : "enable_remote";

  return {
    powerOn,
    remoteReady,
    commandReady,
    machine,
    phase,
    phaseLabel: washerPhaseLabel(phase),
    isActive,
    canStart,
    primaryAction,
    showCompletion: isActive && completionAvailable,
    completionTime,
  };
};

export const washerCommand = (action, config) => ({
  domain: "select",
  service: "select_option",
  data: {
    entity_id: config.control_entity,
    option: action === "start" ? "run" : action,
  },
});
