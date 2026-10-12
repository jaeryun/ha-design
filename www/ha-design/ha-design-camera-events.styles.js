export const cameraEventStyles = `
  .history-view { min-inline-size: 0; background: var(--surface-card, #FFF); }
  .history-view *, .history-view *::before, .history-view *::after { box-sizing: border-box; }
  .day-selector { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; padding: 8px 12px; background: var(--surface-soft, #F7F5F0); }
  .day-button { position: relative; display: grid; min-inline-size: 0; min-block-size: 52px; grid-template-rows: auto auto; place-items: center; gap: 2px; padding: 4px; border: 0; border-radius: 12px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
  .day-button small, .day-button strong { font-size: 14px; line-height: 1.2; }
  .day-button small { color: var(--text-secondary, #716D64); font-weight: 700; }
  .day-button[aria-pressed=true] { background: var(--camera-accent); color: #FFF; }
  .day-button[aria-pressed=true] small { color: #FFF; }
  .history-view button:focus-visible, .timeline-surface:focus-visible { outline: 3px solid var(--camera-accent); outline-offset: 2px; }
  .timeline-section { display: grid; gap: 8px; padding: 16px 20px 20px; border-block-start: 1px solid var(--border-subtle, rgba(26,26,24,.08)); }
  .timeline-header { display: flex; min-block-size: 36px; align-items: center; justify-content: space-between; gap: 12px; }
  .timeline-date { display: grid; min-inline-size: 0; gap: 2px; }
  .timeline-date strong { font-size: 14px; }
  .timeline-date small { color: var(--text-secondary, #716D64); font-size: 12px; font-weight: 600; }
  .selected-time { flex: none; color: var(--camera-accent); font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; font-variant-numeric: tabular-nums; font-weight: 800; }
  .timeline-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; color: var(--text-secondary, #716D64); font-size: 12px; }
  .timeline-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .timeline-legend i { display: inline-block; flex: none; }
  .legend-event { inline-size: 16px; block-size: 6px; border-radius: 3px; background: var(--camera-accent); }
  .legend-recording { inline-size: 16px; block-size: 6px; background: var(--recorded, #6E8992); }
  .event-filters { display: flex; flex-wrap: wrap; gap: 6px; }
  .event-filter { display: inline-flex; min-block-size: 36px; align-items: center; padding: 4px 12px; border: 1px solid var(--border-subtle, rgba(26,26,24,.1)); border-radius: 999px; background: var(--surface-soft, #F7F5F0); color: var(--text-secondary, #716D64); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
  .event-filter[aria-pressed=true] { border-color: var(--camera-accent); background: var(--camera-accent); color: #FFF; }
  .event-status { display: flex; flex-wrap: wrap; min-block-size: 32px; align-items: center; gap: 8px; margin: 0; color: var(--text-secondary, #716D64); font-size: 12px; line-height: 1.5; word-break: keep-all; }
  .unavailable-event-sources { margin: 0; color: var(--status-warning, #A64D32); font-size: 12px; line-height: 1.5; word-break: keep-all; }
  .timeline-surface { position: relative; display: grid; min-block-size: 76px; grid-template-rows: 48px 20px; overflow: hidden; border: 1px solid var(--border-subtle, rgba(26,26,24,.08)); border-radius: 12px; background: var(--surface-soft, #F7F5F0); cursor: crosshair; touch-action: none; }
  .timeline-plot { position: relative; min-inline-size: 0; margin-inline: 12px; }
  .timeline-guides { position: absolute; z-index: 0; inset: 0; pointer-events: none; }
  .timeline-guide { position: absolute; inset-block: 0; inline-size: 1px; background: var(--border-subtle, rgba(26,26,24,.08)); transform: translateX(-50%); }
  .event-lane { position: absolute; z-index: 5; inset-block-start: 8px; inset-inline: 0; block-size: 20px; overflow: hidden; pointer-events: none; }
  .coverage-lane { position: absolute; z-index: 1; inset-block-start: 32px; inset-inline: 0; block-size: 12px; overflow: hidden; border-radius: 6px; background: var(--surface-pressed, #ECE8E0); box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26,26,24,.08)); }
  .coverage-segment { position: absolute; inset-block: 0; border-radius: 0; pointer-events: none; }
  .coverage-segment.recorded { background: var(--recorded, #6E8992); }
  .coverage-segment.gap { background: var(--surface-soft, #F7F5F0); box-shadow: inset 1px 0 var(--border-strong, rgba(26,26,24,.18)), inset -1px 0 var(--border-strong, rgba(26,26,24,.18)); }
  .coverage-segment.unknown, .coverage-segment.loading { background: repeating-linear-gradient(135deg, #EEE9E1 0 4px, #8B8173 4px 5px); }
  .coverage-segment.error { background: #F8E9EB; box-shadow: inset 0 0 0 1px var(--status-warning, #C25B6A); }
  .coverage-segment.future { background: color-mix(in srgb, var(--surface-soft, #F7F5F0) 82%, var(--surface-pressed, #ECE8E0)); box-shadow: none; }
  .event-marker { position: absolute; inset-block-start: 6px; inline-size: 2px; block-size: 8px; border-radius: 2px; background: var(--camera-accent); transform: translateX(-50%); pointer-events: none; }
  .event-marker.event-activity { min-inline-size: 2px; transform: none; }
  .event-marker.selected-event { box-shadow: 0 0 0 2px var(--surface-card, #FFF), 0 0 0 4px var(--camera-accent); }
  .now-boundary, .playhead { position: absolute; inset-block: 4px 2px; pointer-events: none; transform: translateX(-50%); }
  .now-boundary { z-index: 2; inline-size: 1px; background: var(--text-tertiary, #9A958A); }
  .now-boundary i { position: absolute; inset-block-end: 0; color: var(--text-tertiary, #9A958A); font-size: 9px; font-style: normal; white-space: nowrap; transform: translate(-50%, 100%); }
  .playhead { z-index: 6; inline-size: 2px; background: var(--text-primary, #1A1A18); }
  .timeline-axis { position: relative; margin-inline: 12px; color: var(--text-secondary, #716D64); font-family: 'SFMono-Regular', Consolas, monospace; font-size: 10px; font-variant-numeric: tabular-nums; }
  .timeline-axis span { position: absolute; inset-block-start: 50%; transform: translate(-50%, -50%); }
  .mobile-only { display: none; }
  .timeline-context { display: grid; gap: 8px; padding-inline: 4px; color: var(--text-secondary, #716D64); font-size: 14px; line-height: 1.45; word-break: keep-all; }
  .context-status { display: flex; flex-wrap: wrap; min-block-size: 32px; align-items: center; gap: 12px; }
  .context-status strong { color: var(--text-primary, #1A1A18); }
  .context-event { color: var(--text-primary, #1A1A18); font-weight: 700; }
  .context-event-note { color: var(--text-secondary, #716D64); }
  .history-nav { display: flex; gap: 8px; }
  .timeline-context button, .event-status button { min-block-size: 44px; padding: 8px 12px; border: 1px solid var(--border-subtle, rgba(26,26,24,.08)); border-radius: 12px; background: var(--surface-soft, #F7F5F0); color: var(--camera-accent); font: inherit; font-weight: 800; cursor: pointer; }
  .timeline-context button:disabled { opacity: .4; cursor: default; }
  .history-nav button { flex: 1; }
  .history-sr-only { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (pointer: coarse) {
    .event-filter { min-block-size: 44px; }
  }
  @media (max-width: 520px) {
    .day-selector { gap: 0; padding-inline: 8px; }
    .day-button { padding-inline: 0; }
    .timeline-section { padding: 12px 16px 16px; }
    .timeline-surface { min-block-size: 72px; grid-template-rows: 48px 16px; }
    .coverage-lane { block-size: 10px; }
    .desktop-only { display: none; }
    .mobile-only { display: block; }
    .timeline-context { gap: 6px; padding-block: 4px; }
  }
`;
