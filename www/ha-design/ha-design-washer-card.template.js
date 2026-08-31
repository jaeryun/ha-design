import {
  escapeDeviceText,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import {
  actionControls,
  programNotice,
  rinseControl,
  selectControl,
  switchControl,
} from "./ha-design-washer-card.controls.js?v=idle-controls-20260831-2";

const entity = (hass, entityId) => hass?.states?.[entityId];
const stateAvailable = (current) =>
  current && !["unknown", "unavailable"].includes(current.state);
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
const formatBinaryStatus = (hass, entityId, onLabel, offLabel) => {
  const current = entity(hass, entityId);
  if (!current || !stateAvailable(current)) return "—";
  return current.state === "on" ? onLabel : offLabel;
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

export const renderWasherCard = ({ config, hass, washerState, dialogOpen }) => {
  const title = config.title ?? "세탁기";
  const dialogId = `washer-${title.replaceAll(/\s+/g, "-")}-details`;
  const scene = productScene(config, washerState);
  const completion = washerState.showCompletion
    ? `${formatCompletion(washerState.completionTime)} 완료 예정`
    : null;
  const remoteStatus = washerState.remoteReady
    ? "스마트컨트롤 켜짐"
    : "스마트컨트롤 꺼짐";
  const displayPhase = washerState.powerOn ? washerState.phaseLabel : "대기";
  const operationalControlsVisible =
    washerState.powerOn && washerState.remoteReady;
  const compactItems = [
    displayPhase,
    completion ?? remoteStatus,
    formatMeasurement(hass, config.power_usage_entity),
  ];
  const badge = washerState.powerOn
    ? washerState.phase === "idle" ? "준비" : washerState.phaseLabel.replace(" 중", "")
    : "대기";

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
                : escapeDeviceText(remoteStatus)}</p>
            </div>
          </header>
          <div class="detail-body">
            <section aria-labelledby="washer-program-heading">
              <div class="section-heading">
                <div><span>WASH PROGRAM</span><h3 id="washer-program-heading">코스 선택</h3></div>
                <small>SmartThings 앱 연동</small>
              </div>
              ${programNotice()}
            </section>
            ${washerState.powerOn ? `<section class="action-section" aria-labelledby="washer-action-heading">
              <div class="section-heading">
                <div><span>SMART CONTROL</span><h3 id="washer-action-heading">운전 제어</h3></div>
                <small>${washerState.remoteReady ? "사용 가능" : "제품 확인 필요"}</small>
              </div>
              ${actionControls(washerState)}
              <p class="cycle-note">Home Assistant에서는 코스를 확인할 수 없어 새 운전을 시작하지 않습니다.</p>
            </section>` : ""}
            <section aria-labelledby="washer-device-status-heading">
              <div class="section-heading">
                <div><span>DEVICE STATUS</span><h3 id="washer-device-status-heading">기기 상태</h3></div>
                <small>실시간</small>
              </div>
              <div class="status-grid">
                <article>
                  <span>차일드 락</span>
                  <strong>${escapeDeviceText(formatBinaryStatus(hass, config.child_lock_entity, "잠김", "해제"))}</strong>
                </article>
                <article>
                  <span>구김 방지 동작</span>
                  <strong>${escapeDeviceText(formatBinaryStatus(hass, config.wrinkle_prevent_active_entity, "동작 중", "대기"))}</strong>
                </article>
              </div>
            </section>
            <section aria-labelledby="washer-settings-heading">
              <div class="section-heading">
                <div><span>WASH SETTINGS</span><h3 id="washer-settings-heading">세탁 설정</h3></div>
                <small>${operationalControlsVisible ? "SmartThings 연결값" : "세제·유연제 사용 가능"}</small>
              </div>
              <div class="setting-list wash-option-list">
                ${operationalControlsVisible
                  ? `${selectControl(hass, config.water_temperature_entity, "물 온도", "옷감에 맞는 세탁 온도", false)}
                    ${rinseControl(hass, config.rinse_cycles_entity, false)}
                    ${selectControl(hass, config.spin_level_entity, "탈수 강도", "마지막 탈수 속도", false)}`
                  : ""}
                ${selectControl(hass, config.detergent_entity, "세제 투입량", "자동 세제함 사용량", false)}
                ${selectControl(hass, config.softener_entity, "유연제 투입량", "유연제 칸 사용량", false)}
              </div>
            </section>
            ${operationalControlsVisible ? `<section class="toggle-list" aria-label="추가 기능">
              ${switchControl(hass, config.bubble_soak_entity, "버블 불림", "찌든 때를 충분히 불려요", false)}
              ${switchControl(hass, config.wrinkle_prevent_entity, "구김 방지", "종료 후 드럼을 가볍게 움직여요", false)}
            </section>` : ""}
            <section aria-labelledby="washer-usage-heading">
              <div class="section-heading">
                <div><span>RESOURCE USE</span><h3 id="washer-usage-heading">사용량</h3></div>
                <small>누적 기준</small>
              </div>
              <div class="usage-grid">
                <article><span>현재 전력</span><strong>${escapeDeviceText(formatMeasurement(hass, config.power_usage_entity))}</strong></article>
                <article><span>누적 에너지</span><strong>${escapeDeviceText(formatMeasurement(hass, config.energy_entity))}</strong></article>
                <article><span>에너지 차이</span><strong>${escapeDeviceText(formatMeasurement(hass, config.energy_difference_entity))}</strong></article>
                <article><span>절약 에너지</span><strong>${escapeDeviceText(formatMeasurement(hass, config.energy_saved_entity))}</strong></article>
                <article><span>전력 에너지</span><strong>${escapeDeviceText(formatMeasurement(hass, config.power_energy_entity))}</strong></article>
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
