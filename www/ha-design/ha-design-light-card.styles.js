export const lightCardStyles = `
  :host {
    --ink: #1A1A18;
    --muted: #77756F;
    --canvas: #F0EDE7;
    --surface: #FFFFFF;
    --surface-soft: #F7F4EE;
    --border: rgba(26, 26, 24, .09);
    --gold: #C69A42;
    --gold-soft: #F3E9D3;
    display: block;
    inline-size: 100%;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
  }
  *, *::before, *::after { box-sizing: border-box; }
  button, input { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
  .light-card {
    display: block;
    inline-size: min(100%, 460px);
    margin-inline: auto;
    overflow: hidden;
    border-radius: 26px;
    background: var(--surface);
    box-shadow: 0 16px 48px rgba(26, 26, 24, .10), inset 0 0 0 1px var(--border);
  }
  .hero-launcher {
    position: relative;
    display: block;
    inline-size: 100%;
    block-size: 270px;
    overflow: hidden;
    padding: 0;
    border: 0;
    background: #17191F;
    color: white;
    cursor: pointer;
    text-align: left;
  }
  .hero-launcher img, .modal-hero img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    transform: scale(1.01);
    transition: filter 220ms cubic-bezier(.2,.8,.2,1), transform 220ms cubic-bezier(.2,.8,.2,1);
  }
  .is-off .hero-launcher img, .modal-hero.is-off img {
    filter: brightness(.28) saturate(.55) contrast(1.08);
  }
  .hero-launcher::after, .modal-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(12, 12, 12, .72), rgba(12, 12, 12, .05) 72%);
  }
  .hero-launcher:hover img { transform: scale(1.025); }
  .hero-copy, .modal-hero-copy {
    position: absolute;
    z-index: 1;
    inset-inline: 22px;
    inset-block-end: 22px;
    display: grid;
    gap: 6px;
  }
  .hero-copy small, .modal-hero-copy small, .section-heading small {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
  }
  .hero-copy strong, .modal-hero-copy strong {
    font-size: clamp(25px, 6vw, 32px);
    line-height: 1.1;
    letter-spacing: -.04em;
  }
  .hero-copy span, .modal-hero-copy span { font-size: 14px; font-weight: 600; opacity: .9; }
  .state-badge {
    position: absolute;
    z-index: 2;
    inset-block-start: 16px;
    inset-inline-end: 16px;
    min-block-size: 30px;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(18, 18, 16, .58);
    color: white;
    font-size: 12px;
    font-weight: 800;
    backdrop-filter: blur(12px);
  }
  .compact-tail {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 12px 16px 12px 12px;
    background: var(--surface);
  }
  .tail-launcher, .power-row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
  }
  .tail-launcher {
    min-block-size: 50px;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }
  .tail-launcher > span:nth-child(2), .power-row > span:nth-child(2) { display: grid; gap: 3px; }
  .tail-launcher strong, .power-row strong { font-size: 14px; }
  .tail-launcher small, .power-row small { color: var(--muted); font-size: 12px; }
  .tail-icon, .section-icon {
    display: grid;
    place-items: center;
    inline-size: 44px;
    block-size: 44px;
    border-radius: 50%;
    background: var(--gold-soft);
    color: var(--gold);
  }
  svg {
    inline-size: 21px;
    block-size: 21px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .power-switch {
    position: relative;
    inline-size: 54px;
    block-size: 32px;
    padding: 4px;
    border: 0;
    border-radius: 999px;
    background: #B9B7B0;
    cursor: pointer;
    transition: background 220ms cubic-bezier(.2,.8,.2,1);
  }
  .power-switch span {
    display: block;
    inline-size: 24px;
    block-size: 24px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 7px rgba(26, 26, 24, .22);
    transform: translateX(0);
    transition: transform 220ms cubic-bezier(.2,.8,.2,1);
  }
  .power-switch[aria-checked="true"] { background: var(--gold); }
  .power-switch[aria-checked="true"] span { transform: translateX(22px); }
  .power-switch:disabled { cursor: not-allowed; opacity: .45; }
  :is(button, input):focus-visible { outline: 3px solid rgba(95, 130, 195, .55); outline-offset: 3px; }
  .config-error { padding: 18px; color: #9B2C2C; }
  .details-dialog {
    inline-size: min(620px, calc(100vw - 24px));
    max-block-size: calc(100dvh - 24px);
    padding: 0;
    border: 0;
    border-radius: 28px;
    background: transparent;
    box-shadow: 0 28px 90px rgba(20, 20, 18, .30);
    color: var(--ink);
  }
  .details-dialog::backdrop { background: rgba(26, 26, 24, .48); backdrop-filter: blur(8px); }
  .details-panel {
    max-block-size: calc(100dvh - 24px);
    overflow: auto;
    border-radius: inherit;
    background: var(--surface);
    overscroll-behavior: contain;
  }
  .modal-hero { position: relative; block-size: 205px; overflow: hidden; color: white; }
  .modal-hero-copy { inset-inline: 24px; inset-block-end: 22px; }
  .dialog-close {
    position: absolute;
    z-index: 2;
    inset-block-start: 14px;
    inset-inline-end: 14px;
    display: grid;
    place-items: center;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid rgba(255,255,255,.35);
    border-radius: 50%;
    background: rgba(20,20,18,.54);
    color: white;
    cursor: pointer;
    font-size: 30px;
    font-weight: 300;
    line-height: 1;
    backdrop-filter: blur(12px);
  }
  .details-content { display: grid; gap: 14px; padding: 20px; background: var(--canvas); }
  .power-row, .control-section {
    border-radius: 20px;
    background: var(--surface);
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .power-row { padding: 14px; }
  .control-section { display: grid; gap: 18px; padding: 18px; }
  .section-heading {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
  }
  .section-heading > span:nth-child(2) { display: grid; gap: 3px; }
  .section-heading small { color: var(--gold); }
  .section-heading strong { font-size: 16px; }
  .section-heading output { color: var(--muted); font-size: 13px; font-weight: 700; }
  .control-section input[type="range"] {
    inline-size: 100%;
    block-size: 44px;
    margin: 0;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  .control-section input[type="range"]::-webkit-slider-runnable-track {
    block-size: 10px;
    border-radius: 999px;
    background: #E5E1D9;
    box-shadow: inset 0 0 0 1px rgba(26,26,24,.06);
  }
  .control-section input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    inline-size: 28px;
    block-size: 28px;
    margin-block-start: -9px;
    border: 5px solid white;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 3px 12px rgba(26,26,24,.22);
  }
  .control-section input[type="range"]::-moz-range-track { block-size: 10px; border-radius: 999px; background: #E5E1D9; }
  .control-section input[type="range"]::-moz-range-thumb {
    inline-size: 19px;
    block-size: 19px;
    border: 5px solid white;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 3px 12px rgba(26,26,24,.22);
  }
  .is-disabled { opacity: .52; }
  .is-disabled input { cursor: not-allowed; }
  .color-palette { display: grid; grid-template-columns: repeat(5, minmax(48px, 1fr)); gap: 8px; }
  .color-chip {
    display: grid;
    justify-items: center;
    gap: 7px;
    min-block-size: 62px;
    padding: 7px 4px;
    border: 1px solid transparent;
    border-radius: 14px;
    background: var(--surface-soft);
    color: var(--muted);
    cursor: pointer;
  }
  .color-chip > span { inline-size: 26px; block-size: 26px; border-radius: 50%; background: var(--chip-color); box-shadow: inset 0 0 0 1px rgba(0,0,0,.09); }
  .color-chip small { font-size: 11px; }
  .color-chip[aria-pressed="true"] { border-color: var(--gold); color: var(--ink); box-shadow: 0 0 0 2px var(--gold-soft); }
  .color-chip:disabled { cursor: not-allowed; }
  .capability-note { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.55; text-align: center; }
  @media (max-width: 480px) {
    .light-card { border-radius: 22px; }
    .hero-launcher { block-size: 230px; }
    .details-dialog { inline-size: calc(100vw - 16px); max-block-size: calc(100dvh - 16px); border-radius: 24px; }
    .details-panel { max-block-size: calc(100dvh - 16px); }
    .details-content { padding: 12px; }
    .control-section { padding: 15px; }
    .color-palette { gap: 5px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .001ms !important; animation-duration: .001ms !important; }
  }
`;
