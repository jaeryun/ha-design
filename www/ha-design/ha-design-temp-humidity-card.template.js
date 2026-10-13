import { escapeDeviceText } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import { CHART_HEIGHT } from "./ha-design-temp-humidity-history.js?v=temp-humidity-20261013-4";

const coordinates = (coords) => coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const readoutMarkup = (role, label, reading) => `
          <span class="temp-readout-item" data-role="${role}">
            <span class="temp-readout-label">${escapeDeviceText(label)}</span>
            <span class="temp-readout-value">${escapeDeviceText(reading.text)}${
              reading.unit ? `<span class="temp-readout-unit">${escapeDeviceText(reading.unit)}</span>` : ""
            }</span>
          </span>`;

const nowMarkup = (role, label, reading) => `
        <span class="temp-now-item">
          <span class="temp-now-label">${escapeDeviceText(label)}</span>
          <span class="temp-now-value" data-role="now-${role}">${escapeDeviceText(reading.text)}${
            reading.unit ? `<small>${escapeDeviceText(reading.unit)}</small>` : ""
          }</span>
        </span>`;

const tabMarkup = ({ id, label, selected }) => `
        <button type="button" role="tab" data-range="${escapeDeviceText(id)}" aria-selected="${
          selected ? "true" : "false"
        }" tabindex="${selected ? "0" : "-1"}">${escapeDeviceText(label)}</button>`;

const chartMarkup = ({ key, label, tone, summary, message, ariaLabel, geometry }) => {
  const { width, height, padding, grid, bandCoords, lineCoords, ticks, last } = geometry;
  const plots = message
    ? `<text class="temp-chart-empty" x="${(width / 2).toFixed(1)}" y="${(height / 2).toFixed(1)}" text-anchor="middle">${escapeDeviceText(
        message,
      )}</text>`
    : `
        ${grid
          .map(
            ({ y, label: gridLabel }) => `
        <line x1="${padding.left}" x2="${width - padding.right}" y1="${y.toFixed(1)}" y2="${y.toFixed(
              1,
            )}" stroke="rgba(26,26,24,.10)" stroke-width="1"></line>
        <text x="${padding.left - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end">${escapeDeviceText(gridLabel)}</text>`,
          )
          .join("")}
        <polygon points="${coordinates(bandCoords)}" fill="${tone}" fill-opacity="0.16" stroke="none"></polygon>
        <polyline points="${coordinates(lineCoords)}" fill="none" stroke="${tone}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></polyline>
        ${ticks
          .map(
            ({ x, text, anchor }) =>
              `<text x="${x.toFixed(1)}" y="${height - 6}" text-anchor="${anchor}">${escapeDeviceText(text)}</text>`,
          )
          .join("")}
        <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.4" fill="${tone}"></circle>`;

  return `
      <figure class="temp-chart">
        <figcaption>
          <span class="temp-chart-label">${escapeDeviceText(label)}</span>
          <span class="temp-chart-summary">${escapeDeviceText(summary)}</span>
        </figcaption>
        <svg
          class="temp-chart-svg"
          data-chart="${escapeDeviceText(key)}"
          role="img"
          aria-label="${escapeDeviceText(ariaLabel)}"
          viewBox="0 0 ${width} ${height || CHART_HEIGHT}"
        >${plots}
        </svg>
      </figure>`;
};

export const renderTempHumidityCard = (model) => {
  const heroStyle = model.hero
    ? ` style="--temp-hero: ${escapeDeviceText(model.hero.image)}; --temp-hero-narrow: ${escapeDeviceText(model.hero.narrow)};"`
    : "";
  const values = `
            ${readoutMarkup("temperature", "온도", model.readings.temperature)}
            ${readoutMarkup("humidity", "습도", model.readings.humidity)}`;

  return `
    <article class="device-card temp-card">
      <button
        type="button"
        class="device-compact temp-launcher"
        data-action="open"
        role="button"
        tabindex="0"
        aria-haspopup="dialog"
        aria-expanded="${model.expanded ? "true" : "false"}"
        aria-controls="${escapeDeviceText(model.dialogId)}"
        aria-label="${escapeDeviceText(model.launcherLabel)}"${heroStyle}
      >
        <span class="device-compact-visual temp-panel${model.hero ? " temp-hero" : ""}">
          ${model.hero ? '<span class="temp-hero-scrim" aria-hidden="true"></span>' : ""}
          <span class="temp-badge" data-role="badge" data-tone="${escapeDeviceText(model.badge.tone)}">${escapeDeviceText(
            model.badge.label,
          )}</span>
          <span class="temp-copy">
            <span class="temp-eyebrow">${escapeDeviceText(model.eyebrow)}</span>
            <span class="temp-title">${escapeDeviceText(model.title)}</span>
          </span>
          ${
            model.hero
              ? `<span class="temp-bar">${values}
          </span>`
              : `<span class="temp-readout">${values}
          </span>`
          }
        </span>
        <span class="device-compact-tail temp-tail" aria-hidden="true"></span>
      </button>
      <dialog class="temp-dialog" id="${escapeDeviceText(model.dialogId)}" aria-labelledby="${escapeDeviceText(
        model.dialogId,
      )}-title">
        <header class="temp-dialog-head">
          <div class="temp-dialog-heading">
            <span class="temp-dialog-eyebrow">${escapeDeviceText(model.eyebrow)}</span>
            <h2 class="temp-dialog-title" id="${escapeDeviceText(model.dialogId)}-title">${escapeDeviceText(
              model.title,
            )}</h2>
          </div>
          <button type="button" class="temp-dialog-close" data-action="close" aria-label="닫기">×</button>
        </header>
        <div class="temp-dialog-body">
          <div class="temp-now" role="group" aria-label="현재 값">
            ${nowMarkup("temperature", "온도", model.readings.temperature)}
            ${nowMarkup("humidity", "습도", model.readings.humidity)}
            ${nowMarkup("battery", "배터리", model.readings.battery)}
          </div>
          <div class="temp-range-tabs" role="tablist" aria-label="기록 기간">
            ${model.ranges.map(tabMarkup).join("")}
          </div>
          ${chartMarkup({ key: "temperature", ...model.charts.temperature })}
          ${chartMarkup({ key: "humidity", ...model.charts.humidity })}
          <p class="temp-source">${escapeDeviceText(model.source)}</p>
        </div>
      </dialog>
    </article>`;
};
