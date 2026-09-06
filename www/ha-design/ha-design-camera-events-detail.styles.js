export const cameraEventDetailStyles = `
  .history-media { position: relative; display: grid; aspect-ratio: 16 / 9; place-items: center; overflow: hidden; background: var(--surface-media, #17191F); color: #FFF; }
  .activity-recording-video { display: block; inline-size: 100%; block-size: 100%; background: var(--surface-media, #17191F); object-fit: contain; }
  .media-status { display: grid; inline-size: min(100%, 460px); gap: 4px; padding: 16px; text-align: center; }
  .status-badge { justify-self: center; padding: 4px 12px; border-radius: 999px; background: #242831; font-size: 14px; font-weight: 800; }
  .media-status strong { font-size: 16px; line-height: 1.4; word-break: keep-all; }
  .history-media[data-state=unknown] { background: linear-gradient(135deg, #242831, var(--surface-media, #17191F)); }
  .history-media[data-state=error] .status-badge { background: var(--status-warning, #C25B6A); }
`;
