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
  .camera-download-dialog { inline-size: min(620px, calc(100vw - 24px)); max-inline-size: 620px; overflow-y: auto; }
  .download-content { display: grid; gap: 12px; padding: 20px; font-size: 14px; line-height: 1.5; word-break: keep-all; }
  .download-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .download-header h3 { margin: 0; font-size: 20px; }
  .download-content p { margin: 0; }
  .download-caption { color: var(--text-secondary, #716D64); font-size: 12px; overflow-wrap: anywhere; }
  .download-fields { display: grid; gap: 12px; min-inline-size: 0; }
  .download-fields label { display: grid; gap: 6px; min-inline-size: 0; font-weight: 700; }
  .download-fields input { box-sizing: border-box; inline-size: 100%; min-inline-size: 0; min-block-size: 44px; padding: 10px; border: 1px solid var(--border-subtle, rgba(26,26,24,.15)); border-radius: 10px; background: var(--surface-soft, #F7F5F0); color: inherit; color-scheme: light; font: inherit; font-size: 16px; }
  .download-feedback { display: grid; gap: 8px; }
  .download-error, .download-gap { color: var(--status-warning, #A64D32); }
  .download-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .download-actions > * { flex: 1; }
  .download-actions .download-save { background: var(--camera-accent); color: #FFF; }
  .download-content :is(input, button, a):focus-visible { outline: 3px solid var(--camera-accent); outline-offset: 2px; }
  .download-fields[hidden], .trim-preview-cover[hidden] { display: none; }
  .trim-preview-stage { position: relative; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 12px; background: #17191F; }
  .trim-preview-video { display: block; inline-size: 100%; block-size: 100%; object-fit: contain; }
  .trim-preview-stage:is([data-state="gap"], [data-state="error"], [data-state="invalid"]) .trim-preview-video { visibility: hidden; }
  .trim-preview-cover { position: absolute; inset: 0; display: grid; align-content: center; justify-items: center; gap: 8px; padding: 12px; background: rgba(15,19,22,.78); color: #FFF; text-align: center; }
  .trim-preview-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; min-block-size: 44px; align-items: center; gap: 8px; }
  .trim-frame-time { color: var(--text-secondary, #716D64); font-size: 12px; font-variant-numeric: tabular-nums; }
  .trim-preview-toolbar button, .trim-preview-cover button, .trim-navigation button, .trim-boundary-times button, .trim-manual-toggle { min-block-size: 44px; padding: 6px 10px; border: 1px solid var(--border-subtle, rgba(26,26,24,.1)); border-radius: 10px; background: var(--surface-soft, #F7F5F0); color: var(--camera-accent); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
  .trim-navigation button:disabled { opacity: .4; cursor: default; }
  .trim-boundary-times { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .trim-boundary-times button { display: grid; gap: 2px; }
  .trim-boundary-times small { color: var(--text-secondary, #716D64); font-size: 11px; font-weight: 400; }
  .trim-boundary-times strong { font-size: 16px; font-variant-numeric: tabular-nums; }
  .trim-track { position: relative; block-size: 112px; margin-inline: 22px; touch-action: none; cursor: crosshair; }
  .trim-rail { position: absolute; inset-inline: 0; inset-block-start: 50px; block-size: 12px; background: var(--surface-soft, #F7F5F0); }
  .trim-selection { position: absolute; inset-block-start: 44px; block-size: 24px; box-sizing: border-box; border: 2px solid var(--camera-accent); background: var(--camera-tint, #E7F0F1); pointer-events: none; }
  .trim-coverage { position: absolute; inset-inline: 0; inset-block-start: 53px; block-size: 6px; overflow: hidden; pointer-events: none; }
  .trim-coverage i { position: absolute; inset-block: 0; background: #A6B9BF; }
  .trim-coverage i:is(.loading, .unknown, .error) { background: repeating-linear-gradient(135deg, #DDD 0 4px, #8B8173 4px 5px); }
  .trim-handle { position: absolute; inline-size: 44px; block-size: 44px; padding: 0; transform: translateX(-50%); border: 2px solid var(--camera-accent); border-radius: 10px; background: var(--surface-card, #FFF); color: var(--camera-accent); font: inherit; font-size: 12px; font-weight: 800; cursor: ew-resize; touch-action: none; user-select: none; }
  .trim-handle.start { inset-block-start: 0; }
  .trim-handle.end { inset-block-end: 0; }
  .trim-handle::after { position: absolute; inset-inline-start: calc(50% - 1px); inline-size: 2px; block-size: 12px; background: var(--camera-accent); content: ''; }
  .trim-handle.start::after { inset-block-start: 100%; }
  .trim-handle.end::after { inset-block-end: 100%; }
  .trim-playhead { position: absolute; inset-block-start: 44px; block-size: 24px; inline-size: 2px; background: var(--text-primary, #1A1A18); pointer-events: none; }
  .trim-axis { display: flex; justify-content: space-between; gap: 8px; color: var(--text-secondary, #716D64); font-size: 10px; font-variant-numeric: tabular-nums; }
  .trim-navigation { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
  .trim-navigation button { padding-inline: 2px; }
  .trim-duration { font-weight: 700; }
  .trim-duration small { color: var(--text-secondary, #716D64); font-size: 11px; font-weight: 400; }
  .trim-manual-toggle { justify-self: start; border: 0; padding-inline: 0; background: transparent; }
`;
