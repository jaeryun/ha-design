const DEFAULT_TRAVEL_DURATION_SECONDS = 9;

export const clampCurtainPosition = (value) =>
  Math.min(100, Math.max(0, Number(value) || 0));

export const resolveCurtainPosition = (state) => {
  if (!state) return null;
  return Number.isFinite(state.attributes.current_position)
    ? clampCurtainPosition(state.attributes.current_position)
    : state.state === "closed"
      ? 0
      : 100;
};

export const resolveCurtainTarget = (service, data) =>
  service === "open_cover"
    ? 100
    : service === "close_cover"
      ? 0
      : clampCurtainPosition(data.position);

export const curtainStatusCopy = (state, position) => {
  if (state === "unavailable") return "연결 상태 확인";
  if (state === "opening") return `열리는 중 · ${position}%`;
  if (state === "closing") return `닫히는 중 · ${position}%`;
  if (position === 0) return "닫힘";
  if (position === 100) return "완전히 열림";
  return `열림 ${position}%`;
};

export const curtainBadgeCopy = (state, position) => {
  if (state === "unavailable") return "확인 필요";
  if (state === "opening") return "열림 중";
  if (state === "closing") return "닫힘 중";
  if (position === 0) return "닫힘";
  if (position === 100) return "열림";
  return `${position}%`;
};

export class CurtainPositionMotion {
  constructor({
    onPosition,
    requestFrame = (callback) => window.requestAnimationFrame(callback),
    cancelFrame = (id) => window.cancelAnimationFrame(id),
  }) {
    this._onPosition = onPosition;
    this._requestFrame = requestFrame;
    this._cancelFrame = cancelFrame;
    this._tick = this._tick.bind(this);
  }

  get displayedPosition() {
    return this._position ?? null;
  }

  get direction() {
    return this._active ? this._direction : null;
  }

  start(from, target, travelDurationSeconds = DEFAULT_TRAVEL_DURATION_SECONDS) {
    this.clear();
    this._from = clampCurtainPosition(from);
    this._target = clampCurtainPosition(target);
    this._position = this._from;
    this._authorityBaseline = this._from;
    this._direction = this._target >= this._from ? "opening" : "closing";
    const fullTravelMs = Math.max(100, Number(travelDurationSeconds) * 1000);
    this._duration = Math.max(1, fullTravelMs * (Math.abs(this._target - this._from) / 100));
    this._startedAt = null;
    this._active = true;
    this._frameId = this._requestFrame(this._tick);
  }

  stop() {
    this._cancelScheduledFrame();
    this._active = false;
    if (this._position != null) this._position = Math.round(clampCurtainPosition(this._position));
    return this.displayedPosition;
  }

  reconcile(actualPosition) {
    if (this._position == null) return false;
    const actual = clampCurtainPosition(actualPosition);
    if (Math.abs(actual - this._authorityBaseline) < 0.5) return false;
    this.clear();
    return true;
  }

  clear() {
    this._cancelScheduledFrame();
    this._active = false;
    this._position = null;
  }

  _tick(timestamp) {
    if (!this._active) return;
    this._startedAt ??= timestamp;
    const progress = Math.min(1, (timestamp - this._startedAt) / this._duration);
    this._position = this._from + (this._target - this._from) * progress;
    this._onPosition(this._position, this._direction);
    if (progress < 1) {
      this._frameId = this._requestFrame(this._tick);
      return;
    }
    this._frameId = null;
    this._active = false;
  }

  _cancelScheduledFrame() {
    if (this._frameId == null) return;
    this._cancelFrame(this._frameId);
    this._frameId = null;
  }
}

export const syncCurtainPositionVisual = (host, root, position, direction = null) => {
  const roundedPosition = Math.round(clampCurtainPosition(position));
  const visualOpening = Math.round(roundedPosition * 0.88);
  root.querySelectorAll(".curtain-hero, .curtain-detail-hero").forEach((visual) => {
    visual.style.setProperty("--curtain-opening", `${visualOpening}%`);
  });
  const output = root.querySelector('[data-output="position"]');
  if (output) output.textContent = `${roundedPosition}%`;
  const range = root.querySelector('[data-action="position"]');
  if (range) range.value = String(roundedPosition);
  range?.setAttribute("aria-valuetext", `${roundedPosition}% 열림`);
  if (direction) {
    const statusCopy = curtainStatusCopy(direction, roundedPosition);
    const badgeCopy = curtainBadgeCopy(direction, roundedPosition);
    root.querySelectorAll(".device-compact-status span, .curtain-detail-copy p").forEach(
      (status) => {
        status.textContent = statusCopy;
      },
    );
    const badge = root.querySelector(".device-compact-badge");
    if (badge) badge.textContent = badgeCopy;
  }
  host.dispatchEvent(
    new CustomEvent("ha-design-position-change", {
      detail: { position: roundedPosition, direction },
    }),
  );
};
