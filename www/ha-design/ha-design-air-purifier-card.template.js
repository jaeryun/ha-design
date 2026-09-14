import {
  escapeDeviceText,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";

const powerIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v8"></path>
    <path d="M7.2 5.7a8 8 0 1 0 9.6 0"></path>
  </svg>`;

const purifierVisual = (model, context) => `
  <div class="purifier-scene ${context}-scene ${model.isOn ? "is-on" : "is-off"}">
    <span class="airflow airflow-one" aria-hidden="true"></span>
    <span class="airflow airflow-two" aria-hidden="true"></span>
    <img src="${model.productImage}" alt="">
  </div>`;

const powerSwitch = (model) => `
  <button
    class="power-switch"
    type="button"
    role="switch"
    aria-label="${escapeDeviceText(model.title)} 전원"
    aria-checked="${model.isOn}"
    data-action="power"
    ${model.unavailable ? "disabled" : ""}
  ><span aria-hidden="true"></span></button>`;

export const renderAirPurifierCard = (model) => {
  const statusCopy = model.unavailable
    ? "전원 상태를 확인할 수 없어요."
    : model.isOn
      ? "공기를 정화하고 있어요."
      : "전원이 꺼져 있어요.";
  const badge = model.unavailable ? "확인 필요" : model.isOn ? "켜짐" : "꺼짐";

  return `
    ${renderDeviceCompact({
      className: `air-purifier-card ${model.isOn ? "is-on" : "is-off"}`,
      attributes: `role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="${model.dialogOpen}" aria-label="${escapeDeviceText(model.title)} 상세 열기" data-action="open"`,
      visual: purifierVisual(model, "compact"),
      visualClass: "compact-hero",
      eyebrow: model.eyebrow,
      title: model.title,
      statusItems: [model.modelName, statusCopy],
      narrowStatusItem: statusCopy,
      badge,
    })}

    <dialog class="details-dialog" aria-labelledby="air-purifier-dialog-title">
      <article class="details-panel">
        <header class="modal-hero">
          ${purifierVisual(model, "modal")}
          <span class="modal-hero-copy">
            <small>${escapeDeviceText(model.eyebrow)}</small>
            <strong id="air-purifier-dialog-title">${escapeDeviceText(model.title)}</strong>
            <span>${escapeDeviceText(model.modelName)}</span>
          </span>
          <button class="dialog-close" type="button" aria-label="공기청정기 상세 닫기" data-action="close">×</button>
        </header>
        <div class="details-content">
          <section class="power-row">
            <span class="section-icon">${powerIcon}</span>
            <span>
              <strong>공기청정기 전원</strong>
              <small>${model.unavailable ? "스마트 플러그 연결을 확인해 주세요." : statusCopy}</small>
            </span>
            ${powerSwitch(model)}
          </section>
          <p class="capability-note">스마트 플러그를 통해 전원만 켜고 끌 수 있어요.</p>
        </div>
      </article>
    </dialog>`;
};
