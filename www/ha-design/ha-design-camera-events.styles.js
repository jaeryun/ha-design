export const cameraEventStyles = `
  .event-header {
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    padding-inline: var(--space-5, 20px);
  }
  .event-header > span { display: grid; gap: var(--space-1, 4px); }
  .event-body {
    display: grid;
    gap: var(--space-5, 20px);
    padding: var(--space-5, 20px);
    background: var(--surface-canvas, #F0EDE7);
  }
  .event-summary {
    display: flex;
    min-block-size: 96px;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-5, 20px);
    padding: var(--space-5, 20px);
    border-radius: 20px;
    background: var(--camera-accent);
    color: var(--hero-text, #FFFFFF);
  }
  .event-summary > span { display: grid; gap: var(--space-1, 4px); }
  .event-summary small { color: color-mix(in srgb, var(--hero-text, #FFFFFF) 72%, transparent); font-size: 11px; font-weight: 700; }
  .event-summary strong { font-size: 26px; letter-spacing: -.03em; }
  .event-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-1, 4px);
    padding: var(--space-1, 4px);
    border-radius: 16px;
    background: var(--surface-card, #FFFFFF);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .event-filters button {
    min-block-size: 44px;
    padding: var(--space-2, 8px);
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: var(--text-secondary, #716D64);
    font: inherit;
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
  }
  .event-filters button[aria-pressed="true"] { background: var(--camera-tint); color: var(--camera-accent); }
  .event-history { display: grid; gap: var(--space-4, 16px); }
  .history-state {
    min-block-size: 120px;
    margin: 0;
    padding: var(--space-5, 20px);
    border-radius: 20px;
    background: var(--surface-card, #FFFFFF);
    color: var(--text-secondary, #716D64);
    font-size: 14px;
  }
  .history-day { display: grid; gap: var(--space-2, 8px); }
  .history-day > header { display: flex; align-items: baseline; justify-content: space-between; padding-inline: var(--space-1, 4px); }
  .history-day h3 { margin: 0; font-size: 16px; letter-spacing: -.02em; }
  .history-day > header span { color: var(--text-secondary, #716D64); font-size: 11px; }
  .history-list {
    overflow: hidden;
    border-radius: 20px;
    background: var(--surface-card, #FFFFFF);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .history-event {
    display: grid;
    min-block-size: 72px;
    grid-template-columns: 44px minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3, 12px);
    padding: var(--space-3, 12px);
    border-block-start: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .history-event:first-child { border-block-start: 0; }
  .event-kind-icon {
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    border-radius: 50%;
    background: var(--camera-tint);
  }
  .event-kind-icon::after { inline-size: 12px; block-size: 12px; border: 3px solid var(--camera-accent); border-radius: 50%; content: ""; }
  .history-event > span:last-child { display: grid; gap: var(--space-1, 4px); }
  .history-event strong { font-size: 14px; }
  .history-event time { color: var(--text-secondary, #716D64); font-size: 12px; }
  .load-more { justify-self: center; }
  @media (max-width: 520px) {
    .event-header { padding-inline: var(--space-3, 12px); }
    .event-body { gap: var(--space-4, 16px); padding: var(--space-3, 12px); }
    .event-summary { align-items: flex-start; flex-direction: column; gap: var(--space-2, 8px); padding: var(--space-4, 16px); }
  }
`;
