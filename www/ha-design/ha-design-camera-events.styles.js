export const cameraEventStyles = `
  .event-header {
    position: sticky;
    z-index: 3;
    inset-block-start: 0;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    padding-inline: var(--space-5, 20px);
    background: var(--surface-card, #FFFFFF);
  }
  .event-breadcrumb {
    display: flex;
    min-inline-size: 0;
    align-items: center;
    gap: var(--space-1, 4px);
    overflow: hidden;
    white-space: nowrap;
  }
  .event-breadcrumb > span { flex: none; color: var(--text-tertiary, #9A958A); font-size: 13px; }
  .event-breadcrumb strong {
    flex: none;
    color: var(--text-primary, #1A1A18);
    font-size: 12px;
    font-weight: 800;
  }
  .breadcrumb-link {
    min-block-size: 44px;
    flex: 0 1 auto;
    padding: 0;
    overflow: hidden;
    border: 0;
    background: transparent;
    color: var(--text-secondary, #716D64);
    font: inherit;
    font-size: 12px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  .breadcrumb-camera { max-inline-size: 120px; }
  .breadcrumb-label-compact { display: none; }
  .breadcrumb-link:focus-visible { outline: 3px solid var(--camera-tint); outline-offset: -3px; border-radius: 8px; }
  .event-body { display: grid; gap: var(--space-4, 16px); padding: var(--space-5, 20px); background: var(--surface-canvas, #F0EDE7); }
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
  .event-history-split { display: grid; grid-template-columns: 320px minmax(0, 1fr); align-items: start; gap: 14px; }
  .event-calendar-rail { position: sticky; inset-block-start: 0; display: grid; gap: 10px; }
  .event-calendar,
  .event-day-timeline {
    overflow: hidden;
    border-radius: 18px;
    background: var(--surface-card, #FFFFFF);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .event-calendar > header {
    display: grid;
    min-block-size: 58px;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    padding: 6px 10px;
    border-block-end: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .event-calendar > header strong { text-align: center; font-size: 15px; }
  .event-month {
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--camera-accent);
    font: inherit;
    font-size: 20px;
    cursor: pointer;
  }
  .event-month:disabled { cursor: not-allowed; opacity: .36; }
  .event-weekdays,
  .event-calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .event-weekdays { padding-block-start: var(--space-2, 8px); color: var(--text-secondary, #716D64); font-size: 10px; font-weight: 700; text-align: center; }
  .event-calendar-grid { gap: 2px; padding-block: 6px var(--space-3, 12px); }
  .event-calendar-grid > span { min-block-size: 44px; }
  .event-day {
    position: relative;
    display: grid;
    min-inline-size: 0;
    min-block-size: 44px;
    place-items: center;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: var(--text-primary, #1A1A18);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .event-day.has-events::after {
    position: absolute;
    inset-block-end: 5px;
    inline-size: 5px;
    block-size: 5px;
    border-radius: 50%;
    background: var(--camera-accent);
    content: "";
  }
  .event-day[aria-pressed="true"] { background: var(--camera-accent); color: var(--hero-text, #FFFFFF); font-weight: 800; }
  .event-day[aria-pressed="true"]::after { background: var(--hero-text, #FFFFFF); }
  .event-day-timeline { display: grid; gap: var(--space-2, 8px); padding: var(--space-3, 12px); }
  .event-day-timeline > header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2, 8px); }
  .event-day-timeline > header strong { font-size: 13px; }
  .event-day-timeline > header span { color: var(--text-secondary, #716D64); font-size: 10px; }
  .event-timeline-track {
    position: relative;
    block-size: 20px;
    overflow: hidden;
    border-radius: 7px;
    background: var(--surface-pressed, #ECE8E0);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .event-timeline-segment,
  .event-timeline-point { position: absolute; inset-block: 0; background: var(--camera-accent); }
  .event-timeline-point { inline-size: 2px; transform: translateX(-1px); }
  .event-timeline-axis { display: flex; justify-content: space-between; color: var(--text-secondary, #716D64); font-size: 9px; font-variant-numeric: tabular-nums; }
  .event-activity-column { display: grid; min-inline-size: 0; gap: 10px; }
  .event-activity-column > header { display: grid; gap: 3px; }
  .event-activity-column > header strong { font-size: 16px; }
  .event-activity-column > header small,
  .event-activity-column > header span { color: var(--text-secondary, #716D64); font-size: 10px; }
  .event-episode-list { display: grid; gap: var(--space-2, 8px); }
  .event-episode {
    display: grid;
    inline-size: 100%;
    min-block-size: 74px;
    grid-template-columns: 58px minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3, 12px);
    padding: var(--space-3, 12px);
    border: 0;
    border-radius: 18px;
    background: var(--surface-card, #FFFFFF);
    color: inherit;
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .event-episode-time { display: grid; gap: 2px; color: var(--camera-accent); font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .event-episode-time small { color: var(--text-secondary, #716D64); font-size: 9px; }
  .event-episode-copy { min-inline-size: 0; }
  .event-episode-copy > strong { display: block; font-size: 14px; }
  .event-episode-copy > span { display: flex; flex-wrap: wrap; gap: 5px; margin-block-start: 6px; }
  .event-episode-copy i { display: inline-flex; align-items: center; gap: 4px; color: var(--text-secondary, #716D64); font-size: 10px; font-style: normal; }
  .event-episode-copy i::before { inline-size: 6px; block-size: 6px; border-radius: 50%; background: currentColor; content: ""; }
  .event-episode-copy i.person { color: var(--camera-accent); }
  .event-episode-copy i.motion { color: var(--accent-lighting, #8A641F); }
  .event-episode-copy i.sound { color: var(--accent-curtain, #7254A3); }
  .event-episode-duration { display: grid; min-inline-size: 48px; min-block-size: 42px; place-items: center; padding-inline: var(--space-2, 8px); border-radius: 14px; background: var(--camera-tint); color: var(--camera-accent); font-size: 12px; font-weight: 850; }
  .history-state { min-block-size: 120px; margin: 0; padding: var(--space-5, 20px); border-radius: 18px; background: var(--surface-card, #FFFFFF); color: var(--text-secondary, #716D64); font-size: 14px; }
  .event-selection-live { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (max-width: 520px) {
    .event-header { gap: 2px; padding-inline: var(--space-1, 4px); }
    .event-breadcrumb { gap: 2px; }
    .event-breadcrumb strong,
    .breadcrumb-link { font-size: 10.5px; letter-spacing: -.02em; }
    .breadcrumb-label { display: none; }
    .breadcrumb-label-compact { display: inline; }
    .breadcrumb-camera { max-inline-size: 52px; }
    .event-body { gap: var(--space-3, 12px); padding: var(--space-3, 12px); }
    .event-filters button { font-size: 12px; }
    .event-history-split { grid-template-columns: 1fr; }
    .event-calendar-rail { position: static; }
    .event-episode { grid-template-columns: 52px minmax(0, 1fr) auto; gap: var(--space-2, 8px); padding: 10px; }
  }
`;
