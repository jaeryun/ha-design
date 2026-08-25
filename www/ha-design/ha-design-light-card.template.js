const lightIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18h6M10 21h4M8.2 14.4A6 6 0 1 1 15.8 14.4c-.8.7-1.3 1.4-1.5 2.1h-4.6c-.2-.7-.7-1.4-1.5-2.1Z"/>
  </svg>`;

const sunIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3.5"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>
  </svg>`;

const temperatureIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0Z"/>
    <path d="M12 7v9"/>
  </svg>`;

const paletteIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3a9 9 0 0 0 0 18h1.3a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1-2.6H18a3 3 0 0 0 3-3c0-5-4-9-9-9Z"/>
    <circle cx="7.5" cy="10" r=".8"/><circle cx="10" cy="6.8" r=".8"/><circle cx="14" cy="6.8" r=".8"/>
  </svg>`;

const powerSwitch = (isOn, unavailable, label) => `
  <button
    class="power-switch"
    type="button"
    role="switch"
    aria-label="${label}"
    aria-checked="${isOn}"
    ${unavailable ? "disabled" : ""}
    data-action="power"
  ><span></span></button>`;

const rangeSection = ({ action, title, eyebrow, icon, value, min, max, step, disabled, output }) => `
  <section class="control-section ${disabled ? "is-disabled" : ""}" aria-labelledby="${action}-title" aria-disabled="${disabled}">
    <div class="section-heading">
      <span class="section-icon">${icon}</span>
      <span>
        <small>${eyebrow}</small>
        <strong id="${action}-title">${title}</strong>
      </span>
      <output data-output="${action}">${output}</output>
    </div>
    <input
      type="range"
      min="${min}"
      max="${max}"
      step="${step}"
      value="${value}"
      aria-label="${title}"
      aria-valuetext="${output}"
      ${disabled ? 'aria-describedby="light-disabled-note"' : ""}
      data-action="${action}"
      ${disabled ? "disabled" : ""}
    >
  </section>`;

export const renderLightCard = (model) => {
  const disabled = !model.isOn || model.unavailable;
  const summary = model.unavailable
    ? "연결 끊김"
    : model.isOn
      ? `${model.brightness}% · ${model.temperature}K`
      : "꺼짐";
  const stateCopy = model.unavailable
    ? "조명 연결을 확인해 주세요"
    : model.isOn
      ? "조명이 편안하게 켜져 있어요"
      : "조명이 꺼져 있어요";
  const colors = model.presets
    .map(
      (preset) => `
        <button
          class="color-chip"
          type="button"
          aria-label="${preset.label}"
          aria-pressed="${preset.selected}"
          title="${preset.label}"
          style="--chip-color:${preset.color}"
          data-action="color"
          data-hue="${preset.hue}"
          data-saturation="${preset.saturation}"
          ${disabled ? "disabled" : ""}
        ><span></span><small>${preset.label}</small></button>`,
    )
    .join("");

  return `
    <ha-card class="light-card ${model.isOn ? "is-on" : "is-off"}">
      <button class="hero-launcher" type="button" aria-haspopup="dialog" aria-controls="ha-design-light-dialog" aria-expanded="${model.dialogOpen}" data-action="open-hero">
        <img src="${model.heroImage}" alt="" loading="eager">
        <span class="hero-copy">
          <small>${model.eyebrow}</small>
          <strong>${model.title}</strong>
          <span>${stateCopy}</span>
        </span>
        <span class="state-badge">${model.unavailable ? "연결 끊김" : model.isOn ? "켜짐" : "꺼짐"}</span>
      </button>
      <div class="compact-tail">
        <button class="tail-launcher" type="button" aria-haspopup="dialog" aria-controls="ha-design-light-dialog" aria-expanded="${model.dialogOpen}" data-action="open-tail">
          <span class="tail-icon">${lightIcon}</span>
          <span><strong>천장 조명</strong><small>${summary}</small></span>
        </button>
        ${powerSwitch(model.isOn, model.unavailable, `${model.title} 전원`)}
      </div>
    </ha-card>

    <dialog id="ha-design-light-dialog" class="details-dialog" aria-labelledby="light-dialog-title">
      <article class="details-panel">
        <header class="modal-hero ${model.isOn ? "is-on" : "is-off"}">
          <img src="${model.heroImage}" alt="">
          <span class="modal-hero-copy">
            <small>${model.eyebrow}</small>
            <strong id="light-dialog-title">${model.title}</strong>
            <span>${stateCopy}</span>
          </span>
          <button class="dialog-close" type="button" aria-label="조명 상세 닫기" data-action="close">×</button>
        </header>
        <div class="details-content">
          <section class="power-row">
            <span class="section-icon">${lightIcon}</span>
            <span><strong>조명 전원</strong><small>${model.unavailable ? "기기 연결을 확인해 주세요" : model.isOn ? "현재 켜져 있어요" : "먼저 전원을 켜 주세요"}</small></span>
            ${powerSwitch(model.isOn, model.unavailable, `${model.title} 전원`)}
          </section>
          ${rangeSection({
            action: "brightness",
            title: "밝기",
            eyebrow: "BRIGHTNESS",
            icon: sunIcon,
            value: model.brightness,
            min: 1,
            max: 100,
            step: 1,
            disabled,
            output: model.brightnessKnown ? `${model.brightness}%` : "—",
          })}
          ${
            model.supportsTemperature
              ? rangeSection({
                  action: "color-temperature",
                  title: "색온도",
                  eyebrow: "WHITE TEMPERATURE",
                  icon: temperatureIcon,
                  value: model.temperature,
                  min: model.minKelvin,
                  max: model.maxKelvin,
                  step: 100,
                  disabled,
                  output: model.temperatureKnown ? `${model.temperature}K · ${model.temperatureLabel}` : "—",
                })
              : ""
          }
          ${
            model.supportsColor
              ? `<section class="control-section color-section ${disabled ? "is-disabled" : ""}" aria-labelledby="color-title" aria-disabled="${disabled}" ${disabled ? 'aria-describedby="light-disabled-note"' : ""}>
                  <div class="section-heading">
                    <span class="section-icon">${paletteIcon}</span>
                    <span><small>COLOR</small><strong id="color-title">컬러</strong></span>
                  </div>
                  <div class="color-palette">${colors}</div>
                </section>`
              : ""
          }
          <p id="light-disabled-note" class="capability-note">${disabled ? `전원을 켜면 ${model.capabilityNames.join(", ")}를 조절할 수 있어요.` : `${model.capabilityNames.join(" · ")} 변경은 부드럽게 적용돼요.`}</p>
        </div>
      </article>
    </dialog>`;
};
