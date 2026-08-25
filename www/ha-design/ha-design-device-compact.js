export const DEVICE_COMPACT_HERO_HEIGHT = 154;
export const DEVICE_COMPACT_TAIL_HEIGHT = 10;
export const DEVICE_COMPACT_VARIANTS = Object.freeze({
  WIDE: "wide",
  TILE: "tile",
});

export const resolveDeviceCompactVariant = (value) =>
  value === DEVICE_COMPACT_VARIANTS.TILE
    ? DEVICE_COMPACT_VARIANTS.TILE
    : DEVICE_COMPACT_VARIANTS.WIDE;

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
    --device-card-radius: 24px;
  }
  .device-card {
    overflow: hidden;
    border-radius: var(--device-card-radius);
    background: var(--device-card-surface, #FFFFFF);
    box-shadow:
      0 16px 48px rgba(26, 26, 24, .10),
      inset 0 0 0 1px var(--device-card-border, rgba(26, 26, 24, .08));
  }
  .device-compact {
    position: relative;
    min-inline-size: 0;
    cursor: pointer;
    outline: 0;
  }
  .device-compact:focus-visible {
    outline: 0;
  }
  .device-compact:focus-visible::after {
    position: absolute;
    z-index: 5;
    inset: 0;
    border: 3px solid var(--device-focus-ring, #3D6FE0);
    border-radius: var(--device-card-radius);
    pointer-events: none;
    content: "";
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
  .device-card--tile .device-compact-visual {
    block-size: auto;
    min-block-size: 0;
    aspect-ratio: 1 / 1;
  }
  .device-compact-copy {
    position: absolute;
    z-index: 2;
    inset-inline: 18px;
    inset-block-end: 16px;
    color: white;
  }
  .device-card--tile .device-compact-copy {
    inset-inline: 12px;
    inset-block-end: 12px;
    min-inline-size: 0;
  }
  .device-compact-eyebrow {
    display: block;
    margin-block-end: 5px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .12em;
  }
  .device-card--tile .device-compact-eyebrow {
    overflow: hidden;
    margin-block-end: 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .device-compact-title {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -.02em;
    word-break: keep-all;
  }
  .device-card--tile .device-compact-title {
    overflow: hidden;
    font-size: 20px;
    white-space: nowrap;
    text-overflow: ellipsis;
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
  .device-card--tile .device-compact-status {
    display: block;
    overflow: hidden;
    margin-block-start: 7px;
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .device-card--tile .device-compact-status span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
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
  .device-card--tile .device-compact-badge {
    inset-block-start: 12px;
    inset-inline-end: 12px;
    padding: 5px 9px;
  }
  .device-compact-tail {
    display: block;
    block-size: var(--device-compact-tail-height);
    background: var(--device-card-surface, #FFFFFF);
  }
`;

export const renderDeviceCompact = ({
  variant: variantValue,
  className = "",
  attributes = "",
  visual,
  visualClass = "",
  copyClass = "",
  eyebrow,
  title,
  statusItems = [],
  tileStatusItem,
  badge,
  footer = '<div class="device-compact-tail compact-tail" aria-hidden="true"></div>',
}) => {
  const variant = resolveDeviceCompactVariant(variantValue);
  const renderedStatusItems =
    variant === DEVICE_COMPACT_VARIANTS.TILE
      ? [tileStatusItem ?? statusItems[0]].filter((item) => item != null)
      : statusItems;

  return `
  <section class="device-compact device-card--${variant} ${className}" data-device-compact-variant="${variant}" ${attributes}>
    <div class="device-compact-visual ${visualClass}">
      ${visual}
      <span class="device-compact-badge badge">${escapeDeviceText(badge)}</span>
      <div class="device-compact-copy ${copyClass}">
        <span class="device-compact-eyebrow eyebrow">${escapeDeviceText(eyebrow)}</span>
        <h2 class="device-compact-title">${escapeDeviceText(title)}</h2>
        <div class="device-compact-status compact-status" aria-label="현재 상태 요약">
          ${renderedStatusItems.map((item) => `<span>${escapeDeviceText(item)}</span>`).join("")}
        </div>
      </div>
    </div>
    ${footer}
  </section>`;
};
