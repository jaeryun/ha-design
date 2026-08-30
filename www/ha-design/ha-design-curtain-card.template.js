import {
  escapeDeviceText,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";

const closeIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18"/>
  </svg>`;

const openIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 19V5M7 10l5-5 5 5"/>
  </svg>`;

const stopIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>`;

const closeCoverIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M7 14l5 5 5-5"/>
  </svg>`;

const renderCurtainScene = ({ heroImage, visualOpening }) => `
  <div class="curtain-hero" style="--curtain-image: url(&quot;${heroImage}&quot;); --curtain-opening: ${visualOpening}%;">
    <div class="curtain-scene"></div>
    <div class="curtain-panel curtain-panel--left"></div>
    <div class="curtain-panel curtain-panel--right"></div>
    <div class="curtain-shade"></div>
  </div>`;

const renderControl = ({ action, label, icon, supported, unavailable }) =>
  supported
    ? `<button class="curtain-control" type="button" data-action="${action}" ${unavailable ? "disabled" : ""}>
        ${icon}
        <span>${label}</span>
      </button>`
    : "";

const OPTION_LABELS = {
  forward: "정방향",
  back: "역방향",
  continuous: "연속",
  intermittently: "간헐",
};

const renderAdvancedSelect = (control) => `
  <label class="curtain-setting-row">
    <span>
      <strong>${escapeDeviceText(control.label)}</strong>
      <small>${control.disabled ? "상태 확인 중" : "현재 설정을 선택하세요"}</small>
    </span>
    <select
      data-control="advanced-select"
      data-entity="${escapeDeviceText(control.entityId)}"
      ${control.confirmation ? `data-confirmation="${escapeDeviceText(control.confirmation)}"` : ""}
      aria-label="${escapeDeviceText(control.label)}"
      ${control.disabled ? "disabled" : ""}
    >
      ${control.disabled
        ? '<option selected>확인 중</option>'
        : control.options.map((option) => `
          <option value="${escapeDeviceText(option)}" ${control.state.state === option ? "selected" : ""}>
            ${escapeDeviceText(OPTION_LABELS[option] ?? option)}
          </option>`).join("")}
    </select>
  </label>`;

const renderStrokeControl = (control) => `
  <article class="curtain-stroke-control">
    <span><strong>${escapeDeviceText(control.label)}</strong><small>${control.disabled ? "상태 확인 중" : "위치 보정"}</small></span>
    <div>
      ${control.options.map((option) => `
        <button
          type="button"
          data-control="stroke-command"
          data-entity="${escapeDeviceText(control.entityId)}"
          data-option="${option}"
          data-confirmation="${escapeDeviceText(`${control.label} 스트로크를 ${option === "SET" ? "설정" : "초기화"}할까요?`)}"
          ${control.disabled ? "disabled" : ""}
        >${option}</button>`).join("")}
    </div>
  </article>`;

export const renderCurtainCard = (model) => {
  const {
    title,
    eyebrow,
    heroImage,
    visualOpening,
    statusCopy,
    badge,
    position,
    supportsOpen,
    supportsClose,
    supportsPosition,
    supportsStop,
    unavailable,
    dialogOpen,
    fault,
    advancedSelects,
    strokeControls,
    capabilityNames,
  } = model;

  const launcher = renderDeviceCompact({
    className: "curtain-launcher",
    attributes: `
      role="button"
      tabindex="0"
      data-action="details"
      aria-haspopup="dialog"
      aria-controls="curtain-detail-dialog"
      aria-expanded="${dialogOpen}"
      aria-label="${escapeDeviceText(`${title} 상세 조작 열기`)}"`,
    visual: renderCurtainScene({ heroImage, visualOpening }),
    eyebrow,
    title,
    badge,
    statusItems: [statusCopy],
    narrowStatusItem: statusCopy,
  });

  return `
    <ha-card class="device-card curtain-card">${launcher}</ha-card>
    <dialog id="curtain-detail-dialog" aria-labelledby="curtain-detail-title">
      <article class="curtain-detail">
        <header class="curtain-detail-hero" style="--curtain-opening: ${visualOpening}%;">
          ${renderCurtainScene({ heroImage, visualOpening })}
          <button class="curtain-close" type="button" data-action="dismiss" aria-label="커튼 상세 닫기">
            ${closeIcon}
          </button>
          <div class="curtain-detail-copy">
            <small>${escapeDeviceText(eyebrow)}</small>
            <h2 id="curtain-detail-title">${escapeDeviceText(title)}</h2>
            <p>${escapeDeviceText(statusCopy)}</p>
          </div>
        </header>
        <div class="curtain-detail-body">
          ${
            supportsPosition
              ? `<section class="curtain-position-panel" aria-labelledby="curtain-position-label">
                  <div class="curtain-position-heading">
                    <span id="curtain-position-label">현재 위치</span>
                    <output data-output="position">${position == null ? "확인 중" : `${position}%`}</output>
                  </div>
                  <input
                    class="curtain-range"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value="${position ?? 0}"
                    data-action="position"
                    aria-label="커튼 위치"
                    aria-valuetext="${position == null ? "상태 확인 중" : `${position}% 열림`}"
                    ${unavailable ? "disabled" : ""}
                  >
                  <div class="curtain-range-labels" aria-hidden="true">
                    <span>닫힘</span>
                    <span>열림</span>
                  </div>
                </section>`
              : ""
          }
          <section class="curtain-actions" aria-label="커튼 이동 제어">
            ${renderControl({
              action: "open",
              label: "열기",
              icon: openIcon,
              supported: supportsOpen,
              unavailable,
            })}
            ${renderControl({
              action: "stop",
              label: "정지",
              icon: stopIcon,
              supported: supportsStop,
              unavailable,
            })}
            ${renderControl({
              action: "close",
              label: "닫기",
              icon: closeCoverIcon,
              supported: supportsClose,
              unavailable,
            })}
          </section>
          ${fault ? `
            <section class="curtain-fault-status is-${fault.tone}" aria-label="모터 상태" role="status">
              <span><strong>${escapeDeviceText(fault.label)}</strong><small>실시간 안전 상태</small></span>
              <b>${escapeDeviceText(fault.status)}</b>
            </section>` : ""}
          ${advancedSelects.length || strokeControls.length ? `
            <section class="curtain-advanced" aria-labelledby="curtain-advanced-heading">
              <header>
                <small>ADVANCED</small>
                <h3 id="curtain-advanced-heading">고급 설정</h3>
                <p>방향 변경과 스트로크 보정은 확인 후 적용됩니다.</p>
              </header>
              <div class="curtain-setting-list">
                ${advancedSelects.map(renderAdvancedSelect).join("")}
              </div>
              ${strokeControls.length ? `
                <div class="curtain-stroke-grid" aria-label="스트로크 보정">
                  ${strokeControls.map(renderStrokeControl).join("")}
                </div>` : ""}
            </section>` : ""}
          <p class="curtain-capabilities">${escapeDeviceText(capabilityNames.join(" · "))}</p>
        </div>
      </article>
    </dialog>`;
};
