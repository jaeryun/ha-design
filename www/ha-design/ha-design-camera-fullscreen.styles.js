export const cameraFullscreenStyles = `
  .fullscreen-exit {
    position: absolute;
    z-index: 5;
    inset-block-start: var(--space-3, 12px);
    inset-inline-end: var(--space-3, 12px);
    display: grid;
    inline-size: 44px;
    block-size: 44px;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--hero-text, #FFFFFF) 28%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--surface-media, #17191F) 66%, transparent);
    color: var(--hero-text, #FFFFFF);
    font: inherit;
    font-size: 24px;
    cursor: pointer;
  }
  dialog.video-fullscreen {
    inline-size: 100vw;
    max-inline-size: none;
    block-size: 100dvh;
    max-block-size: none;
    border-radius: 0;
  }
  dialog.video-fullscreen .dialog-scroll,
  dialog.video-fullscreen .live-section,
  dialog.video-fullscreen .live-frame {
    block-size: 100dvh;
    max-block-size: none;
  }
  dialog.video-fullscreen .dialog-scroll { overflow: hidden; }
  dialog.video-fullscreen .dialog-header,
  dialog.video-fullscreen .live-toolbar,
  dialog.video-fullscreen .detail-body { display: none; }
  dialog.video-fullscreen .live-frame { aspect-ratio: auto; }
`;
