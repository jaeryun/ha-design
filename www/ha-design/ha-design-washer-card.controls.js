import { escapeDeviceText } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";

const OPTION_LABELS = {
  cold: "냉수",
  extra: "많이",
  extra_high: "매우 강",
  extra_low: "매우 약",
  high: "강",
  less: "적게",
  low: "약",
  medium: "중",
  none: "사용 안 함",
  rinse_hold: "헹굼 정지",
  standard: "표준",
};

const entity = (hass, entityId) => hass?.states?.[entityId];
const stateAvailable = (current) =>
  current && !["unknown", "unavailable"].includes(current.state);
const optionLabel = (value) => OPTION_LABELS[value] ?? value;

export const selectControl = (
  hass,
  entityId,
  label,
  description,
  disabled,
) => {
  const current = entity(hass, entityId);
  if (!current) return "";
  const available = stateAvailable(current);
  const options = available ? current.attributes?.options ?? [] : [];
  const controlDisabled = disabled || !available;
  return `
    <label class="setting-control">
      <span><strong>${escapeDeviceText(label)}</strong><small>${escapeDeviceText(available ? description : "상태 확인 중")}</small></span>
      <select data-control="select" data-entity="${escapeDeviceText(entityId)}" aria-label="${escapeDeviceText(label)}" ${controlDisabled ? "disabled" : ""}>
        ${available ? options.map((option) => `
          <option value="${escapeDeviceText(option)}" ${option === current.state ? "selected" : ""}>
            ${escapeDeviceText(optionLabel(option))}
          </option>`).join("") : '<option selected>상태 확인 중</option>'}
      </select>
    </label>`;
};

export const rinseControl = (hass, entityId, disabled) => {
  const current = entity(hass, entityId);
  if (!current) return "";
  const available = stateAvailable(current);
  const controlDisabled = disabled || !available;
  const minimum = Number(current.attributes?.min ?? 0);
  const maximum = Number(current.attributes?.max ?? 5);
  const values = Array.from(
    { length: maximum - minimum + 1 },
    (_, index) => minimum + index,
  );
  return `
    <label class="setting-control">
      <span><strong>헹굼 횟수</strong><small>${available ? "세탁물에 맞게 추가해요" : "상태 확인 중"}</small></span>
      <select data-control="number" data-entity="${escapeDeviceText(entityId)}" aria-label="헹굼 횟수" ${controlDisabled ? "disabled" : ""}>
        ${available ? values.map((value) => `
          <option value="${value}" ${String(value) === current.state ? "selected" : ""}>${value}회</option>`).join("") : '<option selected>상태 확인 중</option>'}
      </select>
    </label>`;
};

export const switchControl = (
  hass,
  entityId,
  label,
  description,
  disabled,
) => {
  const current = entity(hass, entityId);
  if (!current) return "";
  const available = stateAvailable(current);
  const controlDisabled = disabled || !available;
  const checked = current.state === "on";
  return `
    <div class="toggle-row">
      <span><strong>${escapeDeviceText(label)}</strong><small>${escapeDeviceText(available ? description : "상태 확인 중")}</small></span>
      <button class="switch" type="button" role="switch" data-action="toggle" data-entity="${escapeDeviceText(entityId)}" aria-checked="${checked}" aria-label="${escapeDeviceText(label)}" ${controlDisabled ? "disabled" : ""}></button>
    </div>`;
};

const safetyCallout = (title, description) => `
  <div class="remote-callout" role="status">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 4.5 3.2 17a2 2 0 0 0 1.7 3h14.2a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z"/></svg>
    <span><strong>${escapeDeviceText(title)}</strong><small>${escapeDeviceText(description)}</small></span>
  </div>`;

export const actionControls = (washerState) => {
  if (!washerState.remoteReady) {
    return safetyCallout(
      "원격 제어가 꺼져 있어요",
      "제품에서 스마트컨트롤을 켜주세요.",
    );
  }
  if (!washerState.commandReady) {
    return safetyCallout(
      "원격 제어 상태를 확인하고 있어요",
      "기기 연결이 확인되면 다시 시도해 주세요.",
    );
  }
  if (washerState.machine === "run") {
    return `
      <div class="machine-actions">
        <button type="button" data-action="pause">일시정지</button>
        <button class="secondary" type="button" data-action="stop">정지</button>
      </div>`;
  }
  if (washerState.machine === "pause") {
    return `
      <div class="machine-actions">
        <button type="button" data-action="start">계속</button>
        <button class="secondary" type="button" data-action="stop">정지</button>
      </div>`;
  }
  if (washerState.canStart) {
    return safetyCallout(
      "코스 확인이 필요해요",
      "SmartThings 앱에서 코스를 확인한 뒤 제품에서 시작해 주세요.",
    );
  }
  return safetyCallout(
    "기기 상태를 확인하고 있어요",
    "연결 상태가 확인되면 다시 시도해 주세요.",
  );
};

export const programNotice = () => `
  <div class="setting-list program-fallback">
    <div class="setting-control">
      <span><strong>SmartThings 앱에서 선택</strong><small>Home Assistant 기본 연동에서는 코스를 확인하거나 변경할 수 없습니다.</small></span>
      <strong>APP ONLY</strong>
    </div>
  </div>`;
