export const cameraCardStyles = `
  :host {
    --camera-accent: var(--accent-camera, #315F6F);
    --camera-tint: var(--accent-camera-tint, #E7F0F1);
    display: block;
    inline-size: 100%;
    color: var(--text-primary, #1A1A18);
    font-family: "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .camera-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--surface-media, #17191F);
  }
  .camera-scene img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    object-position: 50% 58%;
  }
  .camera-scene.privacy-on img { filter: brightness(.28) saturate(.4); }
  .scene-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(12, 12, 12, .78), rgba(12, 12, 12, .06) 72%);
  }
  .camera-card .device-compact-tail { background: var(--camera-accent); }
  dialog {
    inline-size: min(620px, calc(100vw - var(--space-6, 24px)));
    max-inline-size: 620px;
    max-block-size: calc(100dvh - var(--space-6, 24px));
    margin: auto;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 28px;
    background: var(--surface-card, #FFFFFF);
    color: var(--text-primary, #1A1A18);
    box-shadow: 0 28px 90px color-mix(in srgb, var(--text-primary, #1A1A18) 30%, transparent);
  }
  dialog::backdrop {
    background: color-mix(in srgb, var(--text-primary, #1A1A18) 48%, transparent);
    backdrop-filter: blur(8px);
  }
  .dialog-scroll {
    max-block-size: calc(100dvh - var(--space-6, 24px));
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .dialog-header {
    display: grid;
    min-block-size: 72px;
    grid-template-columns: minmax(0, 1fr) 44px;
    align-items: center;
    gap: var(--space-5, 20px);
    padding: var(--space-3, 12px) var(--space-4, 16px) var(--space-3, 12px) var(--space-5, 20px);
    border-block-end: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .dialog-header > span { display: grid; gap: var(--space-1, 4px); }
  .dialog-header small {
    color: var(--camera-accent);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .12em;
  }
  .dialog-header strong { font-size: 20px; letter-spacing: -.02em; }
  .header-icon {
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    border: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
    border-radius: 50%;
    background: var(--surface-soft, #F7F5F0);
    color: var(--text-primary, #1A1A18);
    font: inherit;
    font-size: 24px;
    cursor: pointer;
  }
  .live-frame {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    background: var(--surface-media, #17191F);
  }
  .live-poster,
  .live-stream {
    position: absolute;
    inset: 0;
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  .live-frame.privacy-on .live-poster,
  .live-frame.privacy-on .live-stream { display: none; }
  .privacy-cover { display: grid; block-size: 100%; place-items: center; color: var(--hero-text, #FFFFFF); }
  .privacy-cover strong { font-size: 18px; }
  .live-badge,
  .recording-badge {
    position: absolute;
    inset-block-start: var(--space-3, 12px);
    min-block-size: 28px;
    padding: var(--space-1, 4px) var(--space-2, 8px);
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface-media, #17191F) 66%, transparent);
    color: var(--hero-text, #FFFFFF);
    font-size: 11px;
    font-weight: 800;
  }
  .live-badge { inset-inline-start: var(--space-3, 12px); }
  .recording-badge { inset-inline-start: 72px; }
  .live-toolbar {
    display: flex;
    min-block-size: 68px;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4, 16px);
    padding: var(--space-3, 12px) var(--space-4, 16px);
    border-block-end: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .live-toolbar > span { display: grid; gap: var(--space-1, 4px); }
  .live-toolbar strong { font-size: 15px; }
  .live-toolbar small { color: var(--text-secondary, #716D64); font-size: 12px; }
  .live-toolbar > div { display: flex; gap: var(--space-2, 8px); }
  .live-toolbar button,
  .section-action,
  .load-more {
    min-block-size: 44px;
    padding: var(--space-2, 8px) var(--space-3, 12px);
    border: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
    border-radius: 999px;
    background: var(--surface-soft, #F7F5F0);
    color: var(--camera-accent);
    font: inherit;
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
  }
  .detail-body {
    display: grid;
    gap: var(--space-4, 16px);
    padding: var(--space-5, 20px);
    background: var(--surface-canvas, #F0EDE7);
  }
  .control-section {
    display: grid;
    gap: var(--space-4, 16px);
    padding: var(--space-5, 20px);
    border-radius: 20px;
    background: var(--surface-card, #FFFFFF);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .section-heading {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3, 12px);
  }
  .section-icon {
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    border-radius: 50%;
    background: var(--camera-tint);
    color: var(--camera-accent);
  }
  .section-icon svg,
  .ptz-button svg {
    inline-size: 21px;
    block-size: 21px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  .section-title { display: grid; gap: var(--space-1, 4px); }
  .section-title strong { font-size: 15px; }
  .section-title small { color: var(--text-secondary, #716D64); font-size: 12px; }
  .switch {
    position: relative;
    inline-size: 56px;
    block-size: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .switch::before {
    position: absolute;
    inset: var(--space-2, 8px) 0;
    border-radius: 999px;
    background: var(--surface-pressed, #ECE8E0);
    content: "";
  }
  .switch::after {
    position: absolute;
    inset-block-start: var(--space-2, 8px);
    inset-inline-start: var(--space-1, 4px);
    inline-size: 28px;
    block-size: 28px;
    border-radius: 50%;
    background: var(--surface-card, #FFFFFF);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--text-primary, #1A1A18) 18%, transparent);
    content: "";
    transition: transform var(--motion-standard, 220ms) cubic-bezier(.2,.8,.2,1);
  }
  .switch[aria-checked="true"]::before { background: var(--camera-accent); }
  .switch[aria-checked="true"]::after { transform: translateX(20px); }
  button:focus-visible { outline: 3px solid color-mix(in srgb, var(--camera-accent) 46%, transparent); outline-offset: 2px; }
  @media (max-width: 520px) {
    .dialog-header { min-block-size: 64px; padding: var(--space-3, 12px) var(--space-3, 12px) var(--space-3, 12px) var(--space-4, 16px); }
    .live-toolbar { align-items: flex-start; flex-direction: column; }
    .live-toolbar > div { inline-size: 100%; }
    .live-toolbar button { flex: 1; }
    .detail-body { padding: var(--space-3, 12px); }
    .control-section { padding: var(--space-4, 16px); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; }
  }
`;
