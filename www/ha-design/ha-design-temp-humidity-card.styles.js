import {
  DEVICE_COMPACT_HERO_HEIGHT,
  DEVICE_COMPACT_TAIL_HEIGHT,
  deviceCompactStyles,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import { CHART_HEIGHT } from "./ha-design-temp-humidity-history.js?v=temp-humidity-20261013-4";

// 승인 시안 A의 compact 높이 계약: tone 패널(hero) + 빈 흰 tail.
export const TEMP_HUMIDITY_COMPACT_HEIGHT = DEVICE_COMPACT_HERO_HEIGHT + DEVICE_COMPACT_TAIL_HEIGHT;

export const tempHumidityCardStyles = `
  ${deviceCompactStyles}
  :host {
    --temp-canvas: #F0EDE7;
    --temp-ink: #1a1a18;
    --temp-muted: #6b675f;
    --temp-tertiary: #9a958a;
    --temp-accent: #315f6f;
    --temp-accent-tint: #e7f0f1;
    --temp-gold: #8a641f;
    --temp-surface: #FFFFFF;
    --temp-surface-soft: #F7F5F0;
    --temp-border-subtle: rgba(26, 26, 24, .08);
    --temp-panel-edge: rgba(26, 26, 24, .06);
    --device-card-surface: var(--temp-surface);
    --device-card-border: var(--temp-panel-edge);
    --device-focus-ring: var(--temp-accent);
    display: block;
    inline-size: 100%;
    color: var(--temp-ink);
    font-family: Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; -webkit-tap-highlight-color: transparent; }
  .temp-launcher {
    display: block;
    inline-size: 100%;
    min-block-size: ${TEMP_HUMIDITY_COMPACT_HEIGHT}px;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: start;
  }
  .temp-panel {
    background: var(--temp-surface);
  }
  .temp-panel::after {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 95% at 12% 0%, rgba(255, 255, 255, .95) 0%, rgba(255, 255, 255, 0) 58%),
      linear-gradient(158deg, #fbf8f2 0%, #f3eee5 58%, #ebe5d9 100%);
    box-shadow: inset 0 0 0 1px var(--temp-panel-edge);
    content: "";
    pointer-events: none;
  }
  .temp-copy {
    position: absolute;
    z-index: 2;
    inset-block-start: 16px;
    inset-inline-start: 18px;
    inset-inline-end: 108px;
    display: grid;
    gap: 2px;
    color: var(--temp-ink);
  }
  .temp-eyebrow {
    overflow: hidden;
    color: var(--temp-tertiary);
    font-size: 10px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .14em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .temp-title {
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .temp-badge {
    position: absolute;
    z-index: 2;
    inset-block-start: 14px;
    inset-inline-end: 16px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
  }
  .temp-badge[data-tone="comfort"] { background: var(--temp-accent-tint); color: #2f5a68; }
  .temp-badge[data-tone="caution"] { background: #f6ece4; color: #8a5a35; }
  .temp-badge[data-tone="unknown"] { background: #f1eeea; color: var(--temp-muted); }
  .temp-readout {
    position: absolute;
    z-index: 2;
    inset-block-end: 16px;
    inset-inline: 18px;
    display: flex;
    align-items: flex-end;
    gap: 22px;
  }
  .temp-readout-item { display: grid; gap: 2px; min-inline-size: 0; }
  .temp-readout-label {
    color: var(--temp-muted);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: .04em;
  }
  .temp-readout-value {
    color: var(--temp-ink);
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -.01em;
  }
  .temp-readout-unit {
    margin-inline-start: 2px;
    color: var(--temp-muted);
    font-size: 14px;
    font-weight: 600;
  }
  /* 사진 hero 모드: 승인 시안 4안. 값은 config에서 CSS 변수로 내려온다. */
  .temp-hero {
    background-color: var(--temp-surface-soft);
    background-image: var(--temp-hero);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  .temp-hero::after { content: none; }
  .temp-hero-scrim {
    position: absolute;
    z-index: 1;
    inset: 0;
    background: linear-gradient(180deg, rgba(20, 17, 14, .05) 0%, rgba(20, 17, 14, .20) 45%, rgba(20, 17, 14, .55) 100%);
    pointer-events: none;
  }
  .temp-hero .temp-copy { color: #fff; }
  .temp-hero .temp-eyebrow { color: rgba(255, 255, 255, .9); }
  .temp-hero .temp-title { color: #fff; }
  .temp-hero .temp-badge { background: rgba(255, 255, 255, .92); color: var(--temp-ink); }
  .temp-bar {
    position: absolute;
    z-index: 2;
    inset-block-end: 12px;
    inset-inline: 12px;
    display: flex;
    align-items: flex-end;
    gap: 20px;
    padding: 10px 14px;
    border-radius: 16px;
    background: rgba(251, 248, 242, .90);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }
  .temp-bar .temp-readout-value { color: var(--temp-ink); font-size: 28px; font-weight: 700; }
  .temp-bar .temp-readout-unit { color: var(--temp-muted); font-size: 14px; font-weight: 600; }
  .temp-bar .temp-readout-label { color: var(--temp-muted); font-size: 11px; font-weight: 600; }
  @container (max-width: 280px) {
    .temp-copy { inset-inline-start: 12px; inset-inline-end: 96px; inset-block-start: 12px; }
    .temp-badge { inset-block-start: 12px; inset-inline-end: 12px; padding: 3px 9px; }
    .temp-readout { inset-inline: 12px; inset-block-end: 12px; gap: 16px; }
    .temp-readout-value { font-size: 26px; }
    .temp-hero { background-image: var(--temp-hero-narrow); }
    .temp-hero .temp-title { font-size: 14px; }
    .temp-bar { inset-inline: 10px; padding: 8px 10px; gap: 12px; }
    .temp-bar .temp-readout-value { font-size: 22px; }
  }
  @container (max-width: 240px) {
    .temp-readout { gap: 12px; }
    .temp-readout-value { font-size: 22px; }
    .temp-readout-unit { font-size: 12px; }
    .temp-readout-label { font-size: 10px; }
  }
  @container (max-width: 200px) {
    .temp-hero .temp-eyebrow { display: none; }
    .temp-bar .temp-readout-value { font-size: 19px; }
  }

  .temp-dialog {
    inline-size: min(620px, calc(100vw - 24px));
    max-block-size: calc(100dvh - 24px);
    padding: 0;
    border: 0;
    border-radius: 24px;
    background: var(--temp-surface);
    box-shadow: 0 16px 48px rgba(26, 26, 24, .10);
    color: var(--temp-ink);
    overflow: hidden;
  }
  .temp-dialog::backdrop { background: rgba(26, 26, 24, .42); }
  .temp-dialog-head {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 20px 14px;
    border-block-end: 1px solid var(--temp-border-subtle);
    background: var(--temp-surface);
  }
  .temp-dialog-heading { display: grid; gap: 2px; min-inline-size: 0; }
  .temp-dialog-eyebrow {
    color: var(--temp-tertiary);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .14em;
  }
  .temp-dialog-title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    line-height: 1.3;
  }
  .temp-dialog-close {
    display: grid;
    place-items: center;
    flex: none;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid var(--temp-border-subtle);
    border-radius: 999px;
    background: var(--temp-surface-soft);
    color: var(--temp-ink);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .temp-dialog-body {
    display: grid;
    gap: 18px;
    max-block-size: calc(100dvh - 140px);
    padding: 18px 20px 22px;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .temp-now {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--temp-surface-soft);
  }
  .temp-now-item { display: grid; gap: 4px; min-inline-size: 0; }
  .temp-now-label {
    color: var(--temp-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .04em;
  }
  .temp-now-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    word-break: keep-all;
  }
  .temp-now-value small {
    margin-inline-start: 2px;
    color: var(--temp-muted);
    font-size: 13px;
    font-weight: 600;
  }
  .temp-range-tabs {
    display: flex;
    gap: 6px;
    inline-size: fit-content;
    max-inline-size: 100%;
    padding: 4px;
    border-radius: 999px;
    background: var(--temp-surface-soft);
  }
  .temp-range-tabs button {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--temp-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .temp-range-tabs button[aria-selected="true"] {
    background: var(--temp-surface);
    color: var(--temp-ink);
    box-shadow: 0 2px 6px rgba(26, 26, 24, .10);
  }
  .temp-chart { display: grid; gap: 8px; min-inline-size: 0; margin: 0; }
  .temp-chart figcaption {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    font-weight: 600;
  }
  .temp-chart-summary {
    color: var(--temp-muted);
    font-size: 12px;
    font-weight: 500;
    text-align: end;
  }
  .temp-chart-svg {
    display: block;
    inline-size: 100%;
    block-size: ${CHART_HEIGHT}px;
    overflow: hidden;
  }
  .temp-chart-svg text {
    fill: var(--temp-tertiary);
    font-family: inherit;
    font-size: 11px;
  }
  .temp-chart-empty { fill: var(--temp-muted); font-size: 12px; }
  .temp-source {
    margin: 0;
    color: var(--temp-tertiary);
    font-size: 12px;
    line-height: 1.6;
  }
  :is(button):focus-visible { outline: 3px solid var(--temp-accent); outline-offset: 3px; }
  @media (max-width: 480px) {
    .temp-dialog {
      inline-size: calc(100vw - 16px);
      max-block-size: calc(100dvh - 16px);
      border-radius: 24px;
    }
    .temp-dialog-body { max-block-size: calc(100dvh - 132px); padding: 14px 14px 18px; }
  }
  @media (max-width: 360px) {
    .temp-now { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;
