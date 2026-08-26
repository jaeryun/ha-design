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
                    <output data-output="position">${position}%</output>
                  </div>
                  <input
                    class="curtain-range"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value="${position}"
                    data-action="position"
                    aria-label="커튼 위치"
                    aria-valuetext="${position}% 열림"
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
          <p class="curtain-capabilities">${escapeDeviceText(capabilityNames.join(" · "))}</p>
        </div>
      </article>
    </dialog>`;
};
