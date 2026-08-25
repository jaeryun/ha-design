import { lightCardStyles } from "./ha-design-light-card.styles.js?v=light-review-20260825-1";
import { renderLightCard } from "./ha-design-light-card.template.js?v=light-review-20260825-1";

const DEFAULT_HERO = new URL("./images/lighting/bedroom_on.svg", import.meta.url).href;
const COLOR_PRESETS = [
  { label: "노을", hue: 12, saturation: 82, color: "#D96F4C" },
  { label: "살구", hue: 31, saturation: 76, color: "#E8A45A" },
  { label: "초록", hue: 128, saturation: 58, color: "#70A878" },
  { label: "파랑", hue: 216, saturation: 70, color: "#668CC8" },
  { label: "보라", hue: 278, saturation: 58, color: "#9A76B5" },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const resolveHeroUrl = (value) => {
  const url = new URL(value ?? DEFAULT_HERO, document.baseURI);
  return ["http:", "https:"].includes(url.protocol) ? url.href : DEFAULT_HERO;
};

const cyclicHueDistance = (first, second) => {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
};

class HADesignLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dialogOpen = false;
    this._returnAction = "open-hero";
  }

  setConfig(config) {
    if (!config?.entity) throw new Error("조명 엔티티가 필요합니다");
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 4;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const activeElement = this.shadowRoot.activeElement;
    const activeControl = activeElement?.dataset.action
      ? { action: activeElement.dataset.action, hue: activeElement.dataset.hue }
      : null;
    const state = this._hass.states[this._config.entity];
    if (!state) {
      this.shadowRoot.innerHTML = `<ha-card class="config-error">엔티티를 찾을 수 없습니다: ${escapeHtml(this._config.entity)}</ha-card>`;
      return;
    }

    const attributes = state.attributes;
    const supportedModes = attributes.supported_color_modes ?? [];
    const isOn = state.state === "on";
    const unavailable = state.state === "unavailable";
    const brightnessKnown = Number.isFinite(attributes.brightness);
    const temperatureKnown = Number.isFinite(attributes.color_temp_kelvin);
    const brightness = Math.round(((attributes.brightness ?? 128) / 255) * 100);
    const temperature = attributes.color_temp_kelvin ?? 3000;
    const currentHs = attributes.hs_color ?? [];
    const minKelvin = attributes.min_color_temp_kelvin ?? 2000;
    const maxKelvin = attributes.max_color_temp_kelvin ?? 6500;
    const supportsTemperature = supportedModes.includes("color_temp");
    const supportsColor = supportedModes.includes("hs");

    const model = {
      title: escapeHtml(this._config.title ?? attributes.friendly_name ?? "안방 조명"),
      eyebrow: escapeHtml(this._config.eyebrow ?? "LIGHTING · BEDROOM"),
      heroImage: escapeHtml(resolveHeroUrl(this._config.hero_image)),
      isOn,
      unavailable,
      dialogOpen: this._dialogOpen,
      brightness,
      brightnessKnown,
      temperature,
      temperatureKnown,
      minKelvin,
      maxKelvin,
      supportsTemperature,
      supportsColor,
      capabilityNames: ["밝기", supportsTemperature ? "색온도" : null, supportsColor ? "컬러" : null].filter(Boolean),
      temperatureLabel: this._temperatureLabel(temperature),
      presets: COLOR_PRESETS.map((preset) => ({
        ...preset,
        selected:
          attributes.color_mode === "hs" &&
          cyclicHueDistance(currentHs[0] ?? -180, preset.hue) < 12 &&
          (currentHs[1] ?? 0) > 40,
      })),
    };

    this.shadowRoot.innerHTML = `<style>${lightCardStyles}</style>${renderLightCard(model)}`;
    this._bindEvents();
    if (this._dialogOpen) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (dialog && !dialog.open) dialog.showModal();
      if (activeControl) {
        const hueSelector = activeControl.hue ? `[data-hue="${activeControl.hue}"]` : "";
        this.shadowRoot.querySelector(`[data-action="${activeControl.action}"]${hueSelector}`)?.focus();
      } else {
        this.shadowRoot.querySelector('[data-action="close"]')?.focus();
      }
    }
  }

  _bindEvents() {
    this.shadowRoot.querySelectorAll('[data-action^="open-"]').forEach((trigger) => {
      trigger.addEventListener("click", () => this._openDialog(trigger.dataset.action));
    });
    this.shadowRoot.querySelectorAll('[data-action="power"]').forEach((control) => {
      control.addEventListener("click", () => this._setPower(control.getAttribute("aria-checked") !== "true"));
    });
    this.shadowRoot.querySelector('[data-action="close"]')?.addEventListener("click", () => {
      this.shadowRoot.querySelector("dialog")?.close();
    });

    const dialog = this.shadowRoot.querySelector("dialog");
    dialog?.addEventListener("close", () => {
      this._dialogOpen = false;
      this._setDialogExpanded(false);
      this.shadowRoot.querySelector(`[data-action="${this._returnAction}"]`)?.focus();
    });

    this._bindRange("brightness", (value) => `${value}%`, (value) => ({
      brightness_pct: value,
      transition: 0.3,
    }));
    this._bindRange("color-temperature", (value) => `${value}K · ${this._temperatureLabel(value)}`, (value) => ({
      color_temp_kelvin: value,
      transition: 0.3,
    }));
    this.shadowRoot.querySelectorAll('[data-action="color"]').forEach((button) => {
      button.addEventListener("click", () => {
        this._turnOn({
          hs_color: [Number(button.dataset.hue), Number(button.dataset.saturation)],
          transition: 0.3,
        });
      });
    });
  }

  _bindRange(action, format, serviceData) {
    const range = this.shadowRoot.querySelector(`[data-action="${action}"]`);
    if (!range) return;
    const output = this.shadowRoot.querySelector(`[data-output="${action}"]`);
    range.addEventListener("input", () => {
      output.textContent = format(Number(range.value));
      range.setAttribute("aria-valuetext", format(Number(range.value)));
    });
    range.addEventListener("change", () => this._turnOn(serviceData(Number(range.value))));
  }

  _openDialog(action) {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this._returnAction = action;
    this._setDialogExpanded(true);
    dialog.showModal();
    this.shadowRoot.querySelector('[data-action="close"]')?.focus();
  }

  _setDialogExpanded(expanded) {
    this.shadowRoot.querySelectorAll('[data-action^="open-"]').forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(expanded));
    });
  }

  _setPower(turnOn) {
    if (turnOn) this._turnOn({});
    else this._hass.callService("light", "turn_off", { entity_id: this._config.entity, transition: 0.3 });
  }

  _turnOn(data) {
    this._hass.callService("light", "turn_on", { entity_id: this._config.entity, ...data });
  }

  _temperatureLabel(kelvin) {
    if (kelvin < 3000) return "따뜻함";
    if (kelvin < 5000) return "중간";
    return "선명함";
  }
}

if (!customElements.get("ha-design-light-card")) {
  customElements.define("ha-design-light-card", HADesignLightCard);
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type: "ha-design-light-card",
    name: "ha-design Bedroom Light",
    description: "Warm editorial bedroom lighting controls",
  });
}
