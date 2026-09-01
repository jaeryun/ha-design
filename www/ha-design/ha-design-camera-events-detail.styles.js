export const cameraEventDetailStyles = `
  .activity-detail { min-block-size: 100%; background: var(--surface-canvas, #F0EDE7); }
  .activity-detail-nav {
    position: sticky;
    z-index: 2;
    inset-block-start: 0;
    display: grid;
    min-block-size: 64px;
    grid-template-columns: 44px minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3, 12px);
    padding: var(--space-2, 8px) var(--space-5, 20px);
    border-block-end: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
    background: var(--surface-card, #FFFFFF);
  }
  .activity-detail-nav > span { display: grid; gap: 2px; }
  .activity-detail-nav small { color: var(--camera-accent); font-size: 10px; font-weight: 800; letter-spacing: .12em; }
  .activity-detail-nav strong { font-size: 17px; }
  .activity-detail-body { display: grid; gap: var(--space-4, 16px); padding: var(--space-5, 20px); }
  .activity-detail-hero {
    display: grid;
    gap: var(--space-3, 12px);
    padding: var(--space-5, 20px);
    border-radius: 20px;
    background:
      radial-gradient(circle at 88% 12%, rgba(255,255,255,.14), transparent 35%),
      var(--camera-accent);
    color: var(--hero-text, #FFFFFF);
  }
  .activity-detail-hero > small { color: rgba(255,255,255,.84); font-size: 11px; font-weight: 700; }
  .activity-detail-hero > div:nth-child(2) { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3, 12px); }
  .activity-detail-hero > div:nth-child(2) strong { font-size: 28px; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
  .activity-detail-hero > div:nth-child(2) span { padding: var(--space-2, 8px) 10px; border-radius: 12px; background: rgba(255,255,255,.15); font-size: 12px; font-weight: 800; }
  .activity-detail-kinds { display: flex; flex-wrap: wrap; gap: 6px; }
  .activity-detail-kinds span { padding: 6px 9px; border: 1px solid rgba(255,255,255,.22); border-radius: 999px; background: rgba(255,255,255,.1); font-size: 11px; font-weight: 750; }
  .activity-detail-panel {
    display: grid;
    gap: var(--space-3, 12px);
    padding: var(--space-4, 16px);
    border-radius: 18px;
    background: var(--surface-card, #FFFFFF);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .activity-detail-panel > header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2, 8px); }
  .activity-detail-panel > header strong,
  .activity-detail-panel h3 { margin: 0; font-size: 14px; }
  .activity-detail-panel > header span { color: var(--text-secondary, #716D64); font-size: 11px; }
  .activity-detail-facts { display: grid; gap: 1px; margin: 0; overflow: hidden; border-radius: 14px; background: var(--surface-soft, #F7F5F0); }
  .activity-detail-facts > div { display: flex; min-block-size: 44px; align-items: center; justify-content: space-between; gap: var(--space-3, 12px); padding: var(--space-2, 8px) var(--space-3, 12px); border-block-start: 1px solid var(--border-subtle, rgba(26, 26, 24, .08)); }
  .activity-detail-facts > div:first-child { border-block-start: 0; }
  .activity-detail-facts dt { color: var(--text-secondary, #716D64); font-size: 12px; }
  .activity-detail-facts dd { margin: 0; font-size: 13px; font-weight: 750; }
  .raw-event-list { overflow: hidden; border-radius: 14px; background: var(--surface-soft, #F7F5F0); }
  .raw-event {
    display: grid;
    min-block-size: 44px;
    grid-template-columns: 78px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    padding: var(--space-2, 8px) var(--space-3, 12px);
    border-block-start: 1px solid var(--border-subtle, rgba(26, 26, 24, .08));
  }
  .raw-event:first-child { border-block-start: 0; }
  .raw-event time { color: var(--text-secondary, #716D64); font-family: "SFMono-Regular", Consolas, monospace; font-size: 11px; font-variant-numeric: tabular-nums; }
  .raw-event-kind { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 750; }
  .raw-event-kind::before { inline-size: 7px; block-size: 7px; border-radius: 50%; background: currentColor; content: ""; }
  .raw-event-kind.person { color: var(--camera-accent); }
  .raw-event-kind.motion { color: var(--accent-lighting, #8A641F); }
  .raw-event-kind.sound { color: var(--accent-curtain, #7254A3); }
  @media (max-width: 520px) {
    .activity-detail-nav { padding-inline: var(--space-3, 12px); }
    .activity-detail-body { gap: var(--space-3, 12px); padding: var(--space-3, 12px); }
    .activity-detail-hero { padding: var(--space-4, 16px); }
    .activity-detail-hero > div:nth-child(2) strong { font-size: 24px; }
  }
`;
