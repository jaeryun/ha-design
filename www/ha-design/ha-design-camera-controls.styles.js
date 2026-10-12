export const cameraControlStyles = `
  .ptz-layout { display: grid; grid-template-columns: 160px 1fr; gap: var(--space-4, 16px); align-items: center; }
  .ptz { position: relative; inline-size: 160px; block-size: 160px; border: 1px solid var(--border-subtle, rgba(26, 26, 24, .08)); border-radius: 50%; background: var(--surface-soft, #F7F5F0); }
  .ptz::after { position: absolute; inset: 56px; border: 8px solid var(--text-primary, #1A1A18); border-radius: 50%; content: ""; }
  .ptz-button { position: absolute; z-index: 1; display: grid; inline-size: 48px; block-size: 48px; place-items: center; border: 0; background: transparent; color: var(--camera-accent); cursor: pointer; }
  .ptz-button:disabled { cursor: not-allowed; opacity: .28; }
  .ptz-button.up { inset-block-start: 4px; inset-inline-start: 56px; }
  .ptz-button.right { inset-block-start: 56px; inset-inline-end: 4px; }
  .ptz-button.down { inset-block-end: 4px; inset-inline-start: 56px; }
  .ptz-button.left { inset-block-start: 56px; inset-inline-start: 4px; }
  .angle-control { display: grid; justify-items: center; gap: var(--space-2, 8px); padding: var(--space-4, 16px); border-radius: 20px; background: var(--surface-soft, #F7F5F0); }
  .angle-control > span { color: var(--text-secondary, #716D64); font-size: 14px; font-weight: 700; }
  .angle-control > div { display: grid; grid-template-columns: 44px 56px 44px; align-items: center; gap: var(--space-1, 4px); }
  .angle-control button { inline-size: 44px; block-size: 44px; border: 1px solid var(--border-subtle, rgba(26, 26, 24, .08)); border-radius: 50%; background: var(--surface-card, #FFFFFF); color: var(--camera-accent); font-size: 20px; cursor: pointer; }
  .angle-control strong { text-align: center; font-size: 22px; }
  @media (max-width: 520px) {
    .ptz-layout { grid-template-columns: 1fr; justify-items: center; }
    .angle-control { inline-size: 100%; }
  }
`;
