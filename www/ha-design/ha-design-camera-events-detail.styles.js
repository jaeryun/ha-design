export const cameraEventDetailStyles = `
  .activity-detail { min-block-size: 100%; background: var(--surface-canvas, #F0EDE7); }
  .activity-detail-body { display: grid; gap: var(--space-4, 16px); padding: var(--space-5, 20px); }
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
  .activity-recording-panel { gap: 0; padding: 0; overflow: hidden; }
  .activity-recording-panel > header { box-sizing: border-box; min-block-size: 48px; align-items: center; padding: var(--space-2, 8px) var(--space-4, 16px); }
  .activity-recording-frame {
    position: relative;
    display: grid;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    place-items: center;
    background:
      radial-gradient(circle at 72% 18%, rgba(49, 95, 111, .32), transparent 42%),
      var(--surface-media, #17191F);
    color: var(--hero-text, #FFFFFF);
  }
  .activity-recording-state { display: grid; place-items: center; gap: var(--space-2, 8px); padding: var(--space-4, 16px); text-align: center; }
  .activity-recording-state strong { font-size: 15px; }
  .activity-recording-state span { color: rgba(255, 255, 255, .72); font-size: 12px; }
  .activity-recording-state button {
    min-inline-size: 96px;
    min-block-size: 44px;
    padding: var(--space-2, 8px) var(--space-4, 16px);
    border: 0;
    border-radius: 12px;
    background: var(--camera-tint, #E7F0F1);
    color: var(--camera-accent, #315F6F);
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }
  .activity-recording-state button:focus-visible { outline: 3px solid var(--hero-text, #FFFFFF); outline-offset: 2px; }
  .activity-recording-video { display: block; inline-size: 100%; block-size: 100%; }
  .activity-recording-native { background: var(--surface-media, #17191F); object-fit: contain; }
  .activity-timeline-panel { gap: var(--space-2, 8px); }
  .activity-timeline {
    position: relative;
    min-block-size: 62px;
    border-radius: 12px;
    background: var(--surface-soft, #F7F5F0);
    box-shadow: inset 0 0 0 1px var(--border-subtle, rgba(26, 26, 24, .08));
    touch-action: none;
  }
  .activity-timeline:focus-visible { outline: 3px solid var(--camera-accent); outline-offset: 2px; }
  .activity-timeline-plot { position: absolute; inset-block: 0; inset-inline: 12px; }
  .activity-event-lane { position: absolute; z-index: 3; inset-block-start: 0; inset-inline: 0; block-size: 44px; }
  .activity-events-mobile { display: none; }
  .activity-timeline-target {
    position: absolute;
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    cursor: pointer;
    transform: translateX(-50%);
  }
  .activity-timeline-event {
    display: grid;
    inline-size: 8px;
    block-size: 8px;
    place-items: center;
    border: 2px solid var(--surface-soft, #F7F5F0);
    border-radius: 50%;
    background: var(--camera-accent);
    color: var(--hero-text, #FFFFFF);
    font-size: 9px;
    font-weight: 850;
    font-style: normal;
    line-height: 1;
  }
  .activity-timeline-event.motion { background: var(--accent-lighting, #8A641F); }
  .activity-timeline-event.sound { background: var(--accent-curtain, #7254A3); }
  .activity-timeline-event.cluster { inline-size: 22px; block-size: 22px; }
  .activity-timeline-event.selected { box-shadow: 0 0 0 2px var(--surface-card, #FFFFFF), 0 0 0 4px var(--camera-accent); }
  .activity-coverage-lane {
    position: absolute;
    z-index: 1;
    inset-block-start: 38px;
    inset-inline: 0;
    block-size: 10px;
    overflow: hidden;
    border-radius: 5px;
    background: var(--surface-pressed, #ECE8E0);
  }
  .activity-coverage-recorded,
  .activity-coverage-future { position: absolute; inset-block: 0; }
  .activity-coverage-candidate { position: absolute; inset-block: 3px; min-inline-size: 2px; background: var(--camera-tint, #E7F0F1); box-shadow: inset 0 0 0 1px var(--recorded, #6E8992); }
  .activity-coverage-recorded { min-inline-size: 2px; background: var(--recorded, #6E8992); }
  .activity-coverage-future { background: color-mix(in srgb, var(--surface-soft, #F7F5F0) 82%, var(--surface-pressed, #ECE8E0)); }
  .activity-playhead,
  .activity-now { position: absolute; z-index: 4; transform: translateX(-50%); pointer-events: none; }
  .activity-playhead { inset-block: 29px 7px; inline-size: 2px; background: var(--text-primary, #1A1A18); }
  .activity-now { z-index: 2; inset-block: 33px 7px; inline-size: 1px; background: var(--text-tertiary, #9A958A); }
  .activity-now i {
    position: absolute;
    inset-block-end: -1px;
    color: var(--text-tertiary, #9A958A);
    font-size: 9px;
    font-style: normal;
    font-weight: 700;
    transform: translate(-50%, 100%);
  }
  .activity-timeline-axis { margin-inline: 12px; justify-content: space-between; color: var(--text-secondary, #716D64); font-family: "SFMono-Regular", Consolas, monospace; font-size: 9px; font-variant-numeric: tabular-nums; }
  .activity-axis-desktop { display: flex; }
  .activity-axis-mobile { display: none; }
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
    .activity-detail-body { gap: var(--space-3, 12px); padding: var(--space-3, 12px); }
    .activity-events-desktop { display: none; }
    .activity-events-mobile { display: block; }
    .activity-axis-desktop { display: none; }
    .activity-axis-mobile { display: flex; }
  }
`;
