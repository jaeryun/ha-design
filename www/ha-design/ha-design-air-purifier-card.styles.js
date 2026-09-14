import { deviceCompactStyles } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";

export const airPurifierCardStyles = `
  ${deviceCompactStyles}
  :host {
    --ink: #1A1A18;
    --muted: #716D64;
    --canvas: #F0EDE7;
    --surface: #FFFFFF;
    --surface-soft: #F7F5F0;
    --border: rgba(26, 26, 24, .08);
    --accent: #0E9AA7;
    --accent-soft: #E7F0F1;
    --device-card-surface: var(--surface);
    --device-card-border: var(--border);
    --device-focus-ring: #3D6FE0;
    display: block;
    inline-size: 100%;
    color: var(--ink);
    font-family: Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; -webkit-tap-highlight-color: transparent; }
  svg {
    inline-size: 21px;
    block-size: 21px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .compact-hero {
    background: #F1F1F1;
  }
  .compact-hero::after,
  .modal-hero::after {
    content: "";
    position: absolute;
    z-index: 1;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(24, 22, 20, .78) 0%, rgba(24, 22, 20, .58) 42%, rgba(24, 22, 20, .06) 78%),
      linear-gradient(to top, rgba(24, 22, 20, .42), transparent 62%);
    pointer-events: none;
  }
  .purifier-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .purifier-scene img {
    position: absolute;
    z-index: 1;
    inset-block: 5px;
    inset-inline-end: -9%;
    inline-size: 78%;
    block-size: calc(100% - 10px);
    object-fit: contain;
    object-position: center;
    mix-blend-mode: multiply;
    filter: drop-shadow(0 12px 18px rgba(40, 35, 31, .28));
    transition: filter 220ms cubic-bezier(.2,.8,.2,1), transform 220ms cubic-bezier(.2,.8,.2,1);
  }
  .purifier-scene.is-off img {
    filter: grayscale(.35) brightness(.7) drop-shadow(0 10px 16px rgba(40, 35, 31, .22));
  }
  .compact-hero:hover .purifier-scene img { transform: translateY(-2px); }
  .airflow {
    position: absolute;
    z-index: 0;
    inset-block-start: 23%;
    inset-inline-end: 27%;
    inline-size: 66px;
    block-size: 66px;
    border: 1px solid rgba(255, 255, 255, .62);
    border-radius: 50%;
    opacity: 0;
    transform: scale(.55);
  }
  .is-on .airflow {
    animation: purifier-airflow 2.8s ease-out infinite;
  }
  .is-on .airflow-two { animation-delay: 1.4s; }
  @keyframes purifier-airflow {
    0% { opacity: 0; transform: scale(.45); }
    20% { opacity: .7; }
    100% { opacity: 0; transform: scale(1.35); }
  }
  .config-error { padding: 18px; color: #9B2C2C; }
  .details-dialog {
    inline-size: min(460px, calc(100vw - 24px));
    max-block-size: calc(100dvh - 24px);
    padding: 0;
    border: 0;
    border-radius: 28px;
    background: transparent;
    box-shadow: 0 28px 90px rgba(20, 20, 18, .30);
    color: var(--ink);
  }
  .details-dialog::backdrop {
    background: rgba(26, 26, 24, .48);
    backdrop-filter: blur(8px);
  }
  .details-panel {
    max-block-size: calc(100dvh - 24px);
    overflow: auto;
    border-radius: inherit;
    background: var(--surface);
    overscroll-behavior: contain;
  }
  .modal-hero {
    position: relative;
    block-size: 250px;
    overflow: hidden;
    background: #F1F1F1;
    color: white;
  }
  .modal-scene img {
    inset-block: 14px;
    inset-inline-end: -2%;
    inline-size: 70%;
    block-size: calc(100% - 28px);
  }
  .modal-hero-copy {
    position: absolute;
    z-index: 2;
    inset-inline: 24px;
    inset-block-end: 22px;
    display: grid;
    gap: 6px;
  }
  .modal-hero-copy small {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
  }
  .modal-hero-copy strong {
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -.04em;
  }
  .modal-hero-copy span { font-size: 14px; font-weight: 600; opacity: .9; }
  .dialog-close {
    position: absolute;
    z-index: 3;
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
  .details-content {
    display: grid;
    gap: 12px;
    padding: 20px;
    background: var(--canvas);
  }
  .power-row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .power-row > span:nth-child(2) { display: grid; gap: 3px; }
  .power-row strong { font-size: 14px; }
  .power-row small { color: var(--muted); font-size: 12px; line-height: 1.4; }
  .section-icon {
    display: grid;
    place-items: center;
    inline-size: 44px;
    block-size: 44px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .power-switch {
    position: relative;
    inline-size: 54px;
    min-block-size: 44px;
    padding: 10px 4px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
  }
  .power-switch::before {
    content: "";
    position: absolute;
    inset: 6px 0;
    border-radius: 999px;
    background: #B9B7B0;
    transition: background 220ms cubic-bezier(.2,.8,.2,1);
  }
  .power-switch span {
    position: relative;
    z-index: 1;
    display: block;
    inline-size: 24px;
    block-size: 24px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 7px rgba(26, 26, 24, .22);
    transform: translateX(0);
    transition: transform 220ms cubic-bezier(.2,.8,.2,1);
  }
  .power-switch[aria-checked="true"]::before { background: var(--accent); }
  .power-switch[aria-checked="true"] span { transform: translateX(22px); }
  .power-switch:disabled { cursor: not-allowed; opacity: .45; }
  :is(button):focus-visible { outline: 3px solid #3D6FE0; outline-offset: 3px; }
  .capability-note {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.55;
    text-align: center;
  }
  @media (max-width: 480px) {
    .details-dialog {
      inline-size: calc(100vw - 16px);
      max-block-size: calc(100dvh - 16px);
      border-radius: 24px;
    }
    .details-panel { max-block-size: calc(100dvh - 16px); }
    .details-content { padding: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
    .compact-hero:hover .purifier-scene img { transform: none; }
  }
`;
