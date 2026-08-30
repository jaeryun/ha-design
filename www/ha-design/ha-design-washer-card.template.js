import {
  escapeDeviceText,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";

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
const formatCompletion = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "확인 중"
    : new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
};
const formatMeasurement = (hass, entityId) => {
  const current = entity(hass, entityId);
  if (!current || ["unknown", "unavailable"].includes(current.state)) return "—";
  return `${current.state}${current.attributes?.unit_of_measurement ?? ""}`;
};

const productScene = (config, washerState) => `
  <div class="washer-scene variant-${escapeDeviceText(config.hero_variant ?? "warm")} phase-${escapeDeviceText(washerState.phase)}">
    <span class="scene-aura" aria-hidden="true"></span>
    <span class="scene-orbit" aria-hidden="true"></span>
    ${config.hero_product_image
      ? `<span class="washer-product" aria-hidden="true"><img src="${escapeDeviceText(config.hero_product_image)}" alt=""></span>`
      : ""}
    <span class="scene-shade" aria-hidden="true"></span>
  </div>`;

const selectControl = (hass, entityId, label, description, disabled) => {
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

const rinseControl = (hass, entityId, disabled) => {
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

const switchControl = (hass, entityId, label, description, disabled) => {
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

const actionControls = (washerState) => {
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
    return `
      <div class="machine-actions single">
        <button type="button" data-action="start">마지막으로 선택한 코스 시작</button>
      </div>`;
  }
  return safetyCallout(
    "기기 상태를 확인하고 있어요",
    "연결 상태가 확인되면 다시 시도해 주세요.",
  );
};

export const renderWasherCard = ({ config, hass, washerState, dialogOpen }) => {
  const title = config.title ?? "세탁기";
  const dialogId = `washer-${title.replaceAll(/\s+/g, "-")}-details`;
  const scene = productScene(config, washerState);
  const completion = washerState.showCompletion
    ? `${formatCompletion(washerState.completionTime)} 완료 예정`
    : null;
  const remoteStatus = washerState.remoteReady ? "원격 제어 준비" : "원격 제어 꺼짐";
  const displayPhase = washerState.powerOn ? washerState.phaseLabel : "전원 꺼짐";
  const controlsDisabled = !washerState.powerOn;
  const compactItems = [
    displayPhase,
    completion ?? remoteStatus,
    formatMeasurement(hass, config.power_usage_entity),
  ];
  const badge = washerState.powerOn
    ? washerState.phase === "idle" ? "준비" : washerState.phaseLabel.replace(" 중", "")
    : "꺼짐";

  return `
    <article class="device-card washer-card">
      ${renderDeviceCompact({
        className: "washer-launcher",
        attributes: `role="button" tabindex="0" aria-label="${escapeDeviceText(title)} 상세 조작 열기" aria-haspopup="dialog" aria-expanded="${dialogOpen}" aria-controls="${escapeDeviceText(dialogId)}"`,
        visual: scene,
        eyebrow: config.eyebrow ?? "AI COMBO · LAUNDRY",
        title,
        statusItems: compactItems,
        narrowStatusItem: completion ?? displayPhase,
        badge,
      })}
      <dialog id="${escapeDeviceText(dialogId)}" aria-label="${escapeDeviceText(title)} 상세 조작">
        <div class="dialog-scroll">
          <button class="dialog-close" type="button" data-action="dismiss" aria-label="${escapeDeviceText(title)} 상세 조작 닫기">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
          <header class="detail-hero">
            ${scene}
            <div class="detail-copy">
              <span>${escapeDeviceText(config.model_name ?? "WD25DB8690BE")}</span>
              <h2>${escapeDeviceText(displayPhase)}</h2>
              <p>${completion
                ? `<span class="completion-time">${escapeDeviceText(completion)}</span>`
                : washerState.powerOn ? escapeDeviceText(remoteStatus) : "다음 세탁을 기다리고 있어요."}</p>
            </div>
          </header>
          <div class="detail-body">
            ${washerState.powerOn ? `<section class="action-section" aria-labelledby="washer-action-heading">
              <div class="section-heading">
                <div><span>SMART CONTROL</span><h3 id="washer-action-heading">운전 제어</h3></div>
                <small>${washerState.remoteReady ? "사용 가능" : "제품 확인 필요"}</small>
              </div>
              ${actionControls(washerState)}
              <p class="cycle-note">카드는 제품에서 마지막으로 선택한 코스를 시작합니다.</p>
            </section>` : ""}
            <section aria-labelledby="washer-settings-heading">
              <div class="section-heading">
                <div><span>WASH SETTINGS</span><h3 id="washer-settings-heading">세탁 설정</h3></div>
                <small>${controlsDisabled ? "전원이 켜지면 설정 가능" : "SmartThings 연결값"}</small>
              </div>
              <div class="setting-list">
                ${selectControl(hass, config.water_temperature_entity, "물 온도", "옷감에 맞는 세탁 온도", controlsDisabled)}
                ${rinseControl(hass, config.rinse_cycles_entity, controlsDisabled)}
                ${selectControl(hass, config.spin_level_entity, "탈수 강도", "마지막 탈수 속도", controlsDisabled)}
                ${selectControl(hass, config.detergent_entity, "세제 투입량", "자동 세제함 사용량", controlsDisabled)}
                ${selectControl(hass, config.softener_entity, "유연제 투입량", "유연제 칸 사용량", controlsDisabled)}
              </div>
            </section>
            <section class="toggle-list" aria-label="추가 기능">
              ${switchControl(hass, config.bubble_soak_entity, "버블 불림", "찌든 때를 충분히 불려요", controlsDisabled)}
              ${switchControl(hass, config.wrinkle_prevent_entity, "구김 방지", "종료 후 드럼을 가볍게 움직여요", controlsDisabled)}
            </section>
            <section aria-labelledby="washer-usage-heading">
              <div class="section-heading">
                <div><span>RESOURCE USE</span><h3 id="washer-usage-heading">사용량</h3></div>
                <small>누적 기준</small>
              </div>
              <div class="usage-grid">
                <article><span>현재 전력</span><strong>${escapeDeviceText(formatMeasurement(hass, config.power_usage_entity))}</strong></article>
                <article><span>누적 에너지</span><strong>${escapeDeviceText(formatMeasurement(hass, config.energy_entity))}</strong></article>
                <article><span>누적 물 사용량</span><strong>${escapeDeviceText(formatMeasurement(hass, config.water_consumption_entity))}</strong></article>
              </div>
            </section>
            <footer class="capabilities">
              <span>MODEL · ${escapeDeviceText(config.model_name ?? "WD25DB8690BE")}</span>
              <strong>세탁 25kg · 건조 15kg · SmartThings</strong>
            </footer>
          </div>
        </div>
      </dialog>
    </article>`;
};
