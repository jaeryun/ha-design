export const washerCardStyles = `
  :host {
    --washer-accent: var(--accent-climate, #3D6FE0);
    display: block;
    inline-size: 100%;
    color: var(--text-primary, #1A1A18);
    font-family: "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .washer-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      linear-gradient(112deg,
        var(--text-primary, #1A1A18) 0%,
        color-mix(in srgb, var(--text-secondary, #716D64) 78%, var(--text-primary, #1A1A18)) 52%,
        var(--surface-pressed, #ECE8E0) 52%,
        var(--surface-soft, #F7F5F0) 100%);
  }
  .washer-scene.variant-deep {
    background:
      radial-gradient(circle at 75% 30%, color-mix(in srgb, var(--accent-climate, #3D6FE0) 32%, transparent), transparent 34%),
      linear-gradient(120deg,
        var(--text-primary, #1A1A18),
        color-mix(in srgb, var(--accent-climate-deep, #284EA8) 52%, var(--text-primary, #1A1A18)) 58%,
        color-mix(in srgb, var(--accent-climate-tint, #EAF0FF) 42%, var(--text-secondary, #716D64)));
  }
  .washer-scene.variant-linen {
    background:
      radial-gradient(circle at 78% 48%,
        var(--surface-card, #FFFFFF) 0%,
        var(--surface-soft, #F7F5F0) 25%,
        color-mix(in srgb, var(--surface-canvas, #F0EDE7) 72%, var(--text-secondary, #716D64)) 26%,
        transparent 48%),
      linear-gradient(112deg,
        color-mix(in srgb, var(--text-primary, #1A1A18) 84%, var(--text-secondary, #716D64)),
        color-mix(in srgb, var(--text-secondary, #716D64) 76%, var(--surface-canvas, #F0EDE7)));
  }
  .scene-aura {
    position: absolute;
    inset-block-start: -72%;
    inset-inline-end: -8%;
    inline-size: 62%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: color-mix(in srgb, var(--surface-card, #FFFFFF) 28%, transparent);
    filter: blur(24px);
  }
  .scene-orbit {
    position: absolute;
    inset-block: var(--space-2, 8px);
    inset-inline-end: 3%;
    aspect-ratio: 1;
    border: 1px solid color-mix(in srgb, var(--surface-card, #FFFFFF) 22%, transparent);
    border-radius: 50%;
  }
  .washer-product {
    position: absolute;
    z-index: 1;
    inset-block: 2px;
    inset-inline-end: clamp(var(--space-2, 8px), 5cqi, var(--space-8, 32px));
    inline-size: 40%;
    min-inline-size: 112px;
    max-inline-size: 164px;
  }
  .washer-product img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
    filter: drop-shadow(-12px 16px 16px color-mix(in srgb, var(--text-primary, #1A1A18) 28%, transparent));
    transform: scale(1.42);
  }
  .scene-shade {
    position: absolute;
    z-index: 1;
    inset: 0;
    background: linear-gradient(90deg, color-mix(in srgb, var(--text-primary, #1A1A18) 84%, transparent), transparent 72%);
  }
  .variant-linen .scene-shade {
    background: linear-gradient(90deg, color-mix(in srgb, var(--text-primary, #1A1A18) 88%, transparent), transparent 68%);
  }
  .washer-card .device-compact-badge {
    background: color-mix(in srgb, var(--text-primary, #1A1A18) 78%, transparent);
  }
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
    box-shadow: 0 28px 80px color-mix(in srgb, var(--text-primary, #1A1A18) 26%, transparent);
  }
  dialog::backdrop {
    background: color-mix(in srgb, var(--text-primary, #1A1A18) 52%, transparent);
    backdrop-filter: blur(8px);
  }
  .dialog-scroll {
    position: relative;
    max-block-size: calc(100dvh - var(--space-6, 24px));
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .dialog-close {
    position: absolute;
    z-index: 8;
    inset-block-start: var(--space-4, 16px);
    inset-inline-end: var(--space-4, 16px);
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: color-mix(in srgb, var(--text-primary, #1A1A18) 56%, transparent);
    color: var(--surface-card, #FFFFFF);
    cursor: pointer;
    backdrop-filter: blur(8px);
  }
  .dialog-close svg {
    inline-size: 20px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-width: 2;
  }
  .detail-hero {
    position: relative;
    min-block-size: 220px;
    overflow: hidden;
    color: var(--hero-text, #FFFFFF);
  }
  .detail-hero .washer-scene { position: absolute; }
  .detail-hero .washer-product {
    inset-block: var(--space-2, 8px);
    inset-inline-end: 7%;
    inline-size: 34%;
    max-inline-size: 190px;
  }
  .detail-copy {
    position: relative;
    z-index: 3;
    display: grid;
    align-content: end;
    min-block-size: 220px;
    inline-size: 58%;
    padding: var(--space-6, 24px);
  }
  .detail-copy > span,
  .section-heading span,
  .capabilities span {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .12em;
  }
  .detail-copy h2 {
    margin: var(--space-2, 8px) 0 0;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -.02em;
  }
  .detail-copy p {
    margin: var(--space-2, 8px) 0 0;
    font-size: 14px;
    font-weight: 650;
    line-height: 1.45;
  }
  .detail-body {
    display: grid;
    gap: var(--space-6, 24px);
    padding: var(--space-6, 24px);
  }
  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: var(--space-4, 16px);
    margin-block-end: var(--space-3, 12px);
  }
  .section-heading span { color: var(--washer-accent); }
  .section-heading h3 {
    margin: var(--space-1, 4px) 0 0;
    font-size: 20px;
    line-height: 1.3;
    letter-spacing: -.01em;
  }
  .section-heading small,
  .cycle-note,
  .setting-control small,
  .toggle-row small {
    color: var(--text-secondary, #716D64);
    font-size: 12px;
    line-height: 1.45;
  }
  .remote-callout {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: var(--space-3, 12px);
    align-items: center;
    padding: var(--space-4, 16px);
    border-radius: 20px;
    background: color-mix(in srgb, var(--status-warning, #C25B6A) 10%, var(--surface-card, #FFFFFF));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--status-warning, #C25B6A) 18%, transparent);
  }
  .remote-callout svg {
    inline-size: 24px;
    justify-self: center;
    fill: none;
    stroke: var(--status-warning, #C25B6A);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  .remote-callout span,
  .setting-control > span,
  .toggle-row > span {
    display: grid;
    gap: var(--space-1, 4px);
  }
  .remote-callout strong,
  .setting-control strong,
  .toggle-row strong {
    font-size: 15px;
    line-height: 1.4;
  }
  .remote-callout small {
    color: var(--text-secondary, #716D64);
    font-size: 13px;
    line-height: 1.45;
    word-break: keep-all;
  }
  .machine-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2, 8px);
  }
  .machine-actions.single { grid-template-columns: 1fr; }
  .machine-actions button {
    min-block-size: 48px;
    border: 0;
    border-radius: 14px;
    background: var(--washer-accent);
    color: var(--surface-card, #FFFFFF);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .machine-actions button.secondary {
    background: var(--surface-soft, #F7F5F0);
    color: var(--text-primary, #1A1A18);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .cycle-note { margin: var(--space-2, 8px) 0 0; }
  .setting-list,
  .toggle-list {
    overflow: hidden;
    border-radius: 20px;
    background: var(--surface-soft, #F7F5F0);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .setting-control,
  .toggle-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-4, 16px);
    align-items: center;
    min-block-size: 68px;
    padding: var(--space-3, 12px) var(--space-4, 16px);
  }
  .setting-control + .setting-control,
  .toggle-row + .toggle-row {
    border-block-start: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .setting-control select {
    min-inline-size: 104px;
    min-block-size: 44px;
    padding-inline: var(--space-3, 12px) var(--space-8, 32px);
    border: 0;
    border-radius: 12px;
    background: var(--surface-card, #FFFFFF);
    color: var(--text-primary, #1A1A18);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .setting-control select:disabled,
  .switch:disabled {
    cursor: not-allowed;
    opacity: .48;
  }
  .switch {
    position: relative;
    inline-size: 52px;
    block-size: 48px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
  }
  .switch::before {
    position: absolute;
    inset-block-start: var(--space-2, 8px);
    inset-inline: 0;
    block-size: 32px;
    border-radius: 999px;
    background: var(--surface-pressed, #ECE8E0);
    content: "";
    transition: background var(--motion-standard, 220ms) cubic-bezier(.2,.8,.2,1);
  }
  .switch::after {
    position: absolute;
    inset-block-start: var(--space-3, 12px);
    inset-inline-start: 4px;
    inline-size: 24px;
    block-size: 24px;
    border-radius: 50%;
    background: var(--surface-card, #FFFFFF);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--text-primary, #1A1A18) 18%, transparent);
    content: "";
    transition: transform var(--motion-standard, 220ms) cubic-bezier(.2,.8,.2,1);
  }
  .switch[aria-checked="true"]::before { background: var(--washer-accent); }
  .switch[aria-checked="true"]::after { transform: translateX(20px); }
  .usage-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2, 8px);
  }
  .usage-grid article {
    display: grid;
    gap: var(--space-2, 8px);
    min-block-size: 84px;
    align-content: center;
    padding: var(--space-3, 12px);
    border-radius: 16px;
    background: var(--surface-soft, #F7F5F0);
    text-align: center;
  }
  .usage-grid span { color: var(--text-secondary, #716D64); font-size: 12px; }
  .usage-grid strong { font-size: 15px; }
  .capabilities {
    display: grid;
    gap: var(--space-1, 4px);
    padding-block-start: var(--space-5, 20px);
    border-block-start: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .capabilities span { color: var(--text-tertiary, #9A958A); }
  .capabilities strong { font-size: 14px; line-height: 1.45; }
  button:focus-visible,
  select:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--washer-accent) 42%, transparent);
    outline-offset: 2px;
  }
  @container (max-width: 280px) {
    .washer-product { inset-inline-end: var(--space-1, 4px); inline-size: 50%; }
    .scene-shade { background: linear-gradient(90deg, color-mix(in srgb, var(--text-primary, #1A1A18) 88%, transparent), transparent 88%); }
  }
  @media (max-width: 520px) {
    .detail-body {
      gap: var(--space-5, 20px);
      padding: var(--space-5, 20px) var(--space-4, 16px);
    }
    .detail-hero,
    .detail-copy { min-block-size: 196px; }
    .detail-copy {
      inline-size: 68%;
      padding: var(--space-6, 24px) var(--space-4, 16px);
    }
    .detail-copy h2 { font-size: 24px; }
    .detail-hero .washer-product { inset-inline-end: 2%; inline-size: 40%; }
    .section-heading { align-items: start; }
    .setting-control {
      gap: var(--space-2, 8px);
      padding-inline: var(--space-3, 12px);
    }
    .setting-control select { min-inline-size: 96px; }
    .usage-grid { grid-template-columns: 1fr; }
    .usage-grid article { grid-template-columns: 1fr auto; min-block-size: 52px; align-items: center; text-align: start; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
  }
`;
