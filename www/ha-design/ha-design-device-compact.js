export const DEVICE_COMPACT_HERO_HEIGHT = 154;
export const DEVICE_COMPACT_TAIL_HEIGHT = 10;

export const escapeDeviceText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const preservesLiveAttribute = (element, name) =>
  (element.tagName === "DIALOG" && name === "open") ||
  (element.matches?.("video.activity-recording-native") && name === "src") ||
  (name === "style" &&
    (element.classList.contains("dialog-scroll") ||
      element.classList.contains("curtain-detail")));

const patchAttributes = (current, next) => {
  for (const { name, value } of next.attributes) {
    if (current.getAttribute(name) !== value) current.setAttribute(name, value);
  }
  for (const { name } of [...current.attributes]) {
    if (!next.hasAttribute(name) && !preservesLiveAttribute(current, name)) {
      current.removeAttribute(name);
    }
  }
  if (current instanceof HTMLInputElement && next.hasAttribute("value")) {
    current.value = next.getAttribute("value");
  }
};

const patchNode = (current, next) => {
  if (
    current.nodeType !== next.nodeType ||
    (current.nodeType === Node.ELEMENT_NODE && current.nodeName !== next.nodeName)
  ) {
    current.replaceWith(next.cloneNode(true));
    return;
  }
  if (current.nodeType === Node.TEXT_NODE) {
    if (current.data !== next.data) current.data = next.data;
    return;
  }
  if (current.nodeType !== Node.ELEMENT_NODE) return;

  patchAttributes(current, next);
  patchChildren(current, next);
};

const patchChildren = (current, next) => {
  let index = 0;
  while (index < next.childNodes.length) {
    const nextChild = next.childNodes[index];
    const currentChild = current.childNodes[index];
    if (!currentChild) {
      current.append(nextChild.cloneNode(true));
    } else {
      patchNode(currentChild, nextChild);
    }
    index += 1;
  }
  while (current.childNodes.length > next.childNodes.length) {
    current.lastChild.remove();
  }
};

export const patchCardDom = (root, html, replace = false) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  if (replace || !root.firstChild) {
    root.replaceChildren(template.content);
    return;
  }
  patchChildren(root, template.content);
};

export const deviceCompactStyles = `
  :host {
    --device-compact-hero-height: ${DEVICE_COMPACT_HERO_HEIGHT}px;
    --device-compact-tail-height: ${DEVICE_COMPACT_TAIL_HEIGHT}px;
    --device-card-radius: 24px;
    display: block;
    inline-size: 100%;
    container-type: inline-size;
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
  .device-compact-status--narrow {
    display: none;
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
  @container (max-width: 280px) {
    .device-compact-copy {
      inset-inline: 12px;
      inset-block-end: 12px;
      min-inline-size: 0;
    }
    .device-compact-eyebrow {
      overflow: hidden;
      margin-block-end: 4px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .device-compact-title {
      overflow: hidden;
      font-size: 20px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .device-compact-status--wide {
      display: none;
    }
    .device-compact-status--narrow {
      display: block;
      overflow: hidden;
      margin-block-start: 7px;
      font-size: 12px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .device-compact-status--narrow span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .device-compact-badge {
      inset-block-start: 12px;
      inset-inline-end: 12px;
      padding: 5px 9px;
    }
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
  narrowStatusItem,
  badge,
  footer = '<div class="device-compact-tail compact-tail" aria-hidden="true"></div>',
}) => {
  const narrowStatusItems =
    [narrowStatusItem ?? statusItems[0]].filter((item) => item != null);

  return `
  <section class="device-compact ${className}" data-device-compact-layout="adaptive" ${attributes}>
    <div class="device-compact-visual ${visualClass}">
      ${visual}
      <span class="device-compact-badge badge">${escapeDeviceText(badge)}</span>
      <div class="device-compact-copy ${copyClass}">
        <span class="device-compact-eyebrow eyebrow">${escapeDeviceText(eyebrow)}</span>
        <h2 class="device-compact-title">${escapeDeviceText(title)}</h2>
        <div class="device-compact-status device-compact-status--wide compact-status" aria-label="현재 상태 요약">
          ${statusItems.map((item) => `<span>${escapeDeviceText(item)}</span>`).join("")}
        </div>
        <div class="device-compact-status device-compact-status--narrow compact-status" aria-label="현재 상태 요약">
          ${narrowStatusItems.map((item) => `<span>${escapeDeviceText(item)}</span>`).join("")}
        </div>
      </div>
    </div>
    ${footer}
  </section>`;
};
