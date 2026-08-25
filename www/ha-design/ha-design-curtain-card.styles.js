export const curtainCardStyles = `
  :host {
    --curtain-accent: #7254A3;
    --curtain-accent-deep: #533B7C;
    --curtain-accent-tint: #EEE8F7;
    --curtain-surface: #F7F5F0;
    --curtain-text: #1A1A18;
    --curtain-muted: #716D64;
    display: block;
    font-family: "Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .curtain-hero {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #8D8378;
  }
  .curtain-scene {
    position: absolute;
    inset: 0;
    background-image: var(--curtain-image);
    background-position: center;
    background-size: cover;
    transform: scale(1.02);
  }
  .curtain-shade {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to top, rgba(20, 18, 17, .78), rgba(20, 18, 17, .08) 72%),
      linear-gradient(to right, rgba(38, 29, 48, .24), transparent 58%);
  }
  .curtain-panel {
    position: absolute;
    inset-block: 0;
    inline-size: calc((100% - var(--curtain-opening)) / 2);
    background:
      linear-gradient(90deg, rgba(78, 64, 91, .62), rgba(229, 221, 210, .52)),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, .13) 0 5px, rgba(46, 37, 52, .08) 5px 10px);
    box-shadow: 0 0 24px rgba(24, 20, 28, .28);
    transition: inline-size 220ms cubic-bezier(.2, .8, .2, 1);
  }
  .curtain-panel--left {
    inset-inline-start: 0;
  }
  .curtain-panel--right {
    inset-inline-end: 0;
    transform: scaleX(-1);
  }
  .config-error {
    padding: 16px;
    border-radius: 20px;
    color: #8F3343;
  }
  dialog {
    inline-size: min(460px, calc(100vw - 24px));
    max-inline-size: none;
    max-block-size: calc(100dvh - 24px);
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 28px;
    background: #FFFFFF;
    color: var(--curtain-text);
    box-shadow: 0 28px 90px rgba(24, 20, 28, .28);
  }
  dialog::backdrop {
    background: rgba(22, 20, 18, .48);
    backdrop-filter: blur(6px);
  }
  .curtain-detail {
    max-block-size: calc(100dvh - 24px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .curtain-detail-hero {
    position: relative;
    min-block-size: 230px;
    overflow: hidden;
    padding: 20px;
    color: #FFFFFF;
  }
  .curtain-detail-hero .curtain-scene,
  .curtain-detail-hero .curtain-shade,
  .curtain-detail-hero .curtain-panel {
    pointer-events: none;
  }
  .curtain-detail-copy {
    position: relative;
    z-index: 2;
    display: grid;
    align-content: end;
    min-block-size: 190px;
    padding-inline-end: 48px;
  }
  .curtain-detail-copy small {
    margin-block-end: 6px;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: .12em;
  }
  .curtain-detail-copy h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    letter-spacing: -.03em;
  }
  .curtain-detail-copy p {
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: 650;
  }
  .curtain-close {
    position: absolute;
    z-index: 3;
    inset-block-start: 16px;
    inset-inline-end: 16px;
    display: grid;
    place-items: center;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, .24);
    border-radius: 999px;
    background: rgba(24, 20, 28, .44);
    color: #FFFFFF;
    cursor: pointer;
    backdrop-filter: blur(8px);
  }
  .curtain-close svg,
  .curtain-control svg {
    inline-size: 20px;
    block-size: 20px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  .curtain-detail-body {
    display: grid;
    gap: 20px;
    padding: 24px 20px 28px;
  }
  .curtain-position-panel {
    padding: 20px;
    border-radius: 22px;
    background: var(--curtain-surface);
  }
  .curtain-position-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 18px;
  }
  .curtain-position-heading span {
    color: var(--curtain-muted);
    font-size: 14px;
    font-weight: 650;
  }
  .curtain-position-heading output {
    color: var(--curtain-accent-deep);
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.04em;
  }
  .curtain-range {
    inline-size: 100%;
    min-block-size: 44px;
    margin: 0;
    accent-color: var(--curtain-accent);
    cursor: pointer;
  }
  .curtain-range-labels {
    display: flex;
    justify-content: space-between;
    color: var(--curtain-muted);
    font-size: 12px;
    font-weight: 650;
  }
  .curtain-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .curtain-control {
    display: grid;
    place-items: center;
    gap: 6px;
    min-inline-size: 0;
    min-block-size: 64px;
    padding: 8px;
    border: 0;
    border-radius: 18px;
    background: var(--curtain-accent-tint);
    color: var(--curtain-accent-deep);
    font: inherit;
    font-size: 13px;
    font-weight: 750;
    cursor: pointer;
  }
  .curtain-control[data-action="stop"] {
    background: var(--curtain-accent);
    color: #FFFFFF;
  }
  .curtain-capabilities {
    color: var(--curtain-muted);
    font-size: 12px;
    font-weight: 650;
    line-height: 1.5;
    text-align: center;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 3px solid #3D6FE0;
    outline-offset: 3px;
  }
  button:disabled,
  input:disabled {
    cursor: not-allowed;
    opacity: .45;
  }
  @media (prefers-reduced-motion: reduce) {
    .curtain-panel {
      transition: none;
    }
  }
`;
