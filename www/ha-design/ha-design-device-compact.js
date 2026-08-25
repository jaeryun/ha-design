export const DEVICE_COMPACT_HERO_HEIGHT = 154;
export const DEVICE_COMPACT_TAIL_HEIGHT = 10;

export const escapeDeviceText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const deviceCompactStyles = `
  :host {
    --device-compact-hero-height: ${DEVICE_COMPACT_HERO_HEIGHT}px;
    --device-compact-tail-height: ${DEVICE_COMPACT_TAIL_HEIGHT}px;
  }
  .device-card {
    overflow: hidden;
    border-radius: 24px;
    background: var(--device-card-surface, #FFFFFF);
    box-shadow:
      0 16px 48px rgba(26, 26, 24, .10),
      inset 0 0 0 1px var(--device-card-border, rgba(26, 26, 24, .08));
  }
  .device-compact {
    min-inline-size: 0;
    cursor: pointer;
    outline: 0;
  }
  .device-compact:focus-visible {
    outline: 3px solid var(--device-focus-ring, #3D6FE0);
    outline-offset: -3px;
  }
  .device-compact-visual {
    position: relative;
    display: block;
    inline-size: 100%;
    block-size: var(--device-compact-hero-height);
    min-block-size: var(--device-compact-hero-height);
    overflow: hidden;
    color: white;
  }
  .device-compact-copy {
    position: absolute;
    z-index: 2;
    inset-inline: 18px;
    inset-block-end: 16px;
    color: white;
  }
  .device-compact-eyebrow {
    display: block;
    margin-block-end: 5px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .12em;
  }
  .device-compact-title {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -.02em;
    word-break: keep-all;
  }
  .device-compact-status {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 10px;
    margin-block-start: 9px;
    font-size: 11px;
    font-weight: 650;
    line-height: 1.35;
  }
  .device-compact-badge {
    position: absolute;
    z-index: 2;
    inset-block-start: 16px;
    inset-inline-end: 16px;
    padding: 6px 11px;
    border-radius: 999px;
    background: rgba(20, 20, 18, .48);
    color: white;
    font-size: 11px;
    font-weight: 700;
    backdrop-filter: blur(8px);
  }
  .device-compact-tail {
    display: block;
    block-size: var(--device-compact-tail-height);
    background: var(--device-card-surface, #FFFFFF);
  }
`;

export const renderDeviceCompact = ({
  className = "",
  attributes = "",
  visual,
  visualClass = "",
  copyClass = "",
  eyebrow,
  title,
  statusItems = [],
  badge,
  footer = '<div class="device-compact-tail compact-tail" aria-hidden="true"></div>',
}) => `
  <section class="device-compact ${className}" ${attributes}>
    <div class="device-compact-visual ${visualClass}">
      ${visual}
      <span class="device-compact-badge badge">${escapeDeviceText(badge)}</span>
      <div class="device-compact-copy ${copyClass}">
        <span class="device-compact-eyebrow eyebrow">${escapeDeviceText(eyebrow)}</span>
        <h2 class="device-compact-title">${escapeDeviceText(title)}</h2>
        <div class="device-compact-status compact-status" aria-label="현재 상태 요약">
          ${statusItems.map((item) => `<span>${escapeDeviceText(item)}</span>`).join("")}
        </div>
      </div>
    </div>
    ${footer}
  </section>`;
