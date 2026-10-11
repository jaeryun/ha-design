export const cameraEventDetailStyles = `
  .history-media { position: relative; display: grid; aspect-ratio: 16 / 9; place-items: center; overflow: hidden; background: var(--surface-media, #17191F); color: #FFF; }
  .activity-recording-video { display: block; inline-size: 100%; block-size: 100%; background: var(--surface-media, #17191F); object-fit: contain; }
  .media-status { display: grid; inline-size: min(100%, 460px); gap: 4px; padding: 16px; text-align: center; }
  .status-badge { justify-self: center; padding: 4px 12px; border-radius: 999px; background: #242831; font-size: 14px; font-weight: 800; }
  .media-status strong { font-size: 16px; line-height: 1.4; word-break: keep-all; }
  .history-media[data-state=unknown] { background: linear-gradient(135deg, #242831, var(--surface-media, #17191F)); }
  .history-media[data-state=error] .status-badge { background: var(--status-warning, #C25B6A); }
  .download-entry { padding: 0 20px 20px; }
  .download-entry button, .download-actions button, .download-save { display: inline-flex; min-block-size: 44px; align-items: center; justify-content: center; padding: 10px 16px; border: 1px solid var(--border-subtle, rgba(26,26,24,.08)); border-radius: 12px; background: var(--surface-soft, #F7F5F0); color: var(--camera-accent); font: inherit; font-size: 14px; font-weight: 750; text-decoration: none; cursor: pointer; }
  .download-entry button { inline-size: 100%; }
  .download-entry button:disabled, .download-actions button:disabled { cursor: default; opacity: .4; }
  .camera-download-dialog { inline-size: min(480px, calc(100vw - 24px)); max-inline-size: 480px; overflow-y: auto; }
  .download-content { display: grid; gap: 16px; padding: 20px; font-size: 14px; line-height: 1.5; word-break: keep-all; }
  .download-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .download-header h3 { margin: 0; font-size: 20px; }
  .download-content p { margin: 0; }
  .download-caption { color: var(--text-secondary, #716D64); font-size: 12px; overflow-wrap: anywhere; }
  .download-fields { display: grid; gap: 12px; min-inline-size: 0; }
  .download-fields label { display: grid; gap: 6px; min-inline-size: 0; font-weight: 700; }
  .download-fields input { box-sizing: border-box; inline-size: 100%; min-inline-size: 0; min-block-size: 44px; padding: 10px; border: 1px solid var(--border-subtle, rgba(26,26,24,.15)); border-radius: 10px; background: var(--surface-soft, #F7F5F0); color: inherit; font: inherit; font-size: 16px; }
  .download-feedback { display: grid; gap: 8px; }
  .download-error, .download-gap { color: var(--status-warning, #A64D32); }
  .download-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .download-actions > * { flex: 1; }
  .download-actions .download-save { background: var(--camera-accent); color: #FFF; }
  .download-content :is(input, button, a):focus-visible { outline: 3px solid var(--camera-accent); outline-offset: 2px; }
`;
