import {
  deviceCompactStyles,
  patchCardDom,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import { washerConfigForm } from "./ha-design-washer-card.config.js?v=standard-editor-20260830-1";
import {
  buildWasherState,
  washerCommand,
} from "./ha-design-washer-state.js?v=washer-review-20260830-9";
import { renderWasherCard } from "./ha-design-washer-card.template.js?v=washer-review-20260830-9";
import { washerCardStyles } from "./ha-design-washer-card.styles.js?v=washer-review-20260830-9";

const REQUIRED_ENTITIES = [
  "control_entity",
  "power_entity",
  "remote_control_entity",
  "machine_state_entity",
  "job_state_entity",
  "completion_time_entity",
];

class HaDesignWasherCard extends HTMLElement {
  static getConfigForm() {
    return washerConfigForm();
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dialogOpen = false;
    this._replaceDom = true;
    this._boundDialogs = new WeakSet();
    this._pageOverflow = null;
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
    this.shadowRoot.addEventListener("keydown", (event) => this._handleKeydown(event));
    this.shadowRoot.addEventListener("change", (event) => this._handleChange(event));
  }

  static getStubConfig() {
    return {
      title: "세탁기",
      model_name: "WD25DB8690BE",
      hero_variant: "warm",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("세탁기 카드 설정이 필요합니다");
    const missing = REQUIRED_ENTITIES.find((key) => !config[key]);
    if (missing) throw new Error(`${missing} 설정이 필요합니다`);
    this._config = { ...config };
    this._replaceDom = true;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 4, max_columns: 12 };
  }

  disconnectedCallback() {
    this._unlockPageScroll();
  }

  _render() {
    if (!this._config || !this._hass) return;
    const washerState = buildWasherState(this._hass, this._config);
    const html = `
      <style>${deviceCompactStyles}${washerCardStyles}</style>
      ${renderWasherCard({
        config: this._config,
        hass: this._hass,
        washerState,
        dialogOpen: this._dialogOpen,
      })}`;
    patchCardDom(this.shadowRoot, html, this._replaceDom);
    this._replaceDom = false;
    this._syncDialog();
  }

  _syncDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog) return;
    if (!this._boundDialogs.has(dialog)) {
      this._boundDialogs.add(dialog);
      dialog.addEventListener("cancel", () => {
        this._dialogOpen = false;
        this._syncExpanded(false);
      });
      dialog.addEventListener("close", () => {
        this._dialogOpen = false;
        this._unlockPageScroll();
        this._syncExpanded(false);
        this.shadowRoot.querySelector(".washer-launcher")?.focus();
      });
    }
    if (this._dialogOpen && !dialog.open) dialog.showModal();
  }

  _syncExpanded(expanded) {
    this.shadowRoot
      .querySelector(".washer-launcher")
      ?.setAttribute("aria-expanded", String(expanded));
  }

  _openDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    this._dialogOpen = true;
    this._lockPageScroll();
    dialog.showModal();
    this._syncExpanded(true);
    this.shadowRoot.querySelector(".dialog-close")?.focus();
  }

  _closeDialog() {
    const dialog = this.shadowRoot.querySelector("dialog");
    if (!dialog?.open) return;
    dialog.close();
    this._unlockPageScroll();
    this.shadowRoot.querySelector(".washer-launcher")?.focus();
  }

  _lockPageScroll() {
    if (this._pageOverflow) return;
    this._pageOverflow = {
      document: document.documentElement.style.overflow,
      body: document.body.style.overflow,
    };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  _unlockPageScroll() {
    if (!this._pageOverflow) return;
    document.documentElement.style.overflow = this._pageOverflow.document;
    document.body.style.overflow = this._pageOverflow.body;
    this._pageOverflow = null;
  }

  _handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const launcher = target.closest(".washer-launcher");
    if (launcher) {
      this._openDialog();
      return;
    }
    const action = target.closest("[data-action]")?.dataset.action;
    if (action === "dismiss") {
      this._closeDialog();
      return;
    }
    if (["start", "pause", "stop"].includes(action)) {
      const command = washerCommand(action, this._config);
      this._hass.callService(command.domain, command.service, command.data);
      return;
    }
    if (action === "toggle") {
      const button = target.closest("[data-entity]");
      const entityId = button?.dataset.entity;
      if (!entityId) return;
      const service = button.getAttribute("aria-checked") === "true"
        ? "turn_off"
        : "turn_on";
      this._hass.callService("switch", service, { entity_id: entityId });
      return;
    }
    const dialog = target.closest("dialog");
    if (dialog && target === dialog) this._closeDialog();
  }

  _handleKeydown(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".washer-launcher")) return;
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    this._openDialog();
  }

  _handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const entityId = target.dataset.entity;
    if (!entityId) return;
    if (target.dataset.control === "number") {
      this._hass.callService("number", "set_value", {
        entity_id: entityId,
        value: Number(target.value),
      });
      return;
    }
    this._hass.callService("select", "select_option", {
      entity_id: entityId,
      option: target.value,
    });
  }
}

if (!customElements.get("ha-design-washer-card")) {
  customElements.define("ha-design-washer-card", HaDesignWasherCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "ha-design-washer-card")) {
  window.customCards.push({
    type: "ha-design-washer-card",
    name: "ha-design 세탁기 카드",
    description: "Samsung SmartThings 세탁기의 상태와 안전한 원격 제어를 표시합니다.",
    documentationURL: "https://github.com/jaeryun/ha-design",
    preview: true,
  });
}
