import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { cameraRecordingNativeHlsSupported } from "./ha-design-camera-recording.js?v=camera-block-nav-20260927-1";
import { cameraStateCoverage, cameraStateInterval, cameraStateNeighbour } from "./ha-design-camera-event-state.js?v=camera-block-nav-20260927-1";

export const cameraHistoryTime = (timestamp, state) => new Intl.DateTimeFormat("ko-KR", {
  timeZone: state.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
}).format(new Date(timestamp * 1000));
export const cameraHistoryRange = (interval, state) => `${cameraHistoryTime(interval.start, state)}–${interval.end === state.day.end ? "24:00:00" : cameraHistoryTime(interval.end, state)}`;
export const cameraHistoryMediaStatus = state => {
  if (state.coverageStatus !== "ready") return state.coverageStatus;
  const interval = cameraStateInterval(state);
  if (interval?.type === "unknown") return "unknown";
  const coverage = cameraStateCoverage(state);
  if (!coverage.some(i => ["recorded", "unknown"].includes(i.type))) return "empty";
  if (interval?.type !== "recorded") return interval?.type ?? "unknown";
  return state.recording.status === "ready" ? "recorded" : state.recording.status === "idle" ? "loading" : state.recording.status;
};
export const renderCameraHistoryMedia = state => {
  const status = cameraHistoryMediaStatus(state), interval = cameraStateInterval(state);
  let content;
  if (status === "recorded") content = cameraRecordingNativeHlsSupported()
    ? '<video class="activity-recording-video activity-recording-native" autoplay muted playsinline controls aria-label="선택한 녹화 영상"></video>'
    : '<ha-hls-player class="activity-recording-video" aria-label="선택한 녹화 영상"></ha-hls-player>';
  else {
    const copy = {
      loading: ["불러오는 중", "녹화 영상을 준비하고 있어요."],
      unknown: ["확인 불가", "이 시간의 녹화 상태를 확인할 수 없어요."],
      error: ["확인 실패", "녹화 기록 또는 영상을 불러오지 못했어요."],
      empty: ["녹화 없음", "이 날짜에는 저장된 녹화가 없어요."],
      gap: ["녹화 없음", `${cameraHistoryRange(interval, state)}에는 저장된 영상이 없어요.`],
      unavailable: ["영상 없음", "녹화 목록의 영상을 현재 재생할 수 없어요."],
      future: ["현재 이후", "아직 지나지 않은 시간이에요."],
    }[status] ?? ["확인 불가", "녹화 상태를 확인할 수 없어요."];
    content = `<div class="media-status" role="status"><span class="status-badge">${copy[0]}</span><strong>${escapeDeviceText(copy[1])}</strong></div>`;
  }
  return `<section class="history-media" data-state="${status}" aria-label="선택한 녹화 영상">${content}</section>`;
};
export const renderCameraHistoryContext = state => {
  const interval = cameraStateInterval(state), status = cameraHistoryMediaStatus(state);
  const selected = state.selectedEvents;
  const totals = ["person", "motion", "sound"].map((kind, index) => {
    const count = selected.filter(e => e.kind === kind).length;
    return count ? `${["사람", "움직임", "소리"][index]} ${count}` : "";
  }).filter(Boolean).join(" · ");
  const messages = [];
  if (totals) messages.push(`<span class="context-events">${escapeDeviceText(totals)}</span>`);
  if (status === "gap") messages.push(`<span><strong>${cameraHistoryRange(interval, state)}</strong> · 녹화 없음</span>`);
  else if (["error", "unknown", "unavailable"].includes(status)) {
    messages.push(`<span>${interval ? cameraHistoryRange(interval, state) : ""} · ${status === "unknown" ? "녹화 상태 확인 불가" : "불러오기 실패"}</span><button type="button" data-action="${state.coverageStatus === "ready" && status !== "unknown" ? "recording-retry" : "history-retry"}">다시 확인</button>`);
  }
  if (state.status === "error") messages.push('<span role="status">감지 기록을 불러오지 못했어요.</span><button type="button" data-action="history-retry">다시 확인</button>');
  // 녹화 구간 이동은 상태와 무관하게 항상 노출한다. 재생 자체는 player controls가 소유한다.
  const previous = cameraStateNeighbour(state, true), next = cameraStateNeighbour(state, false);
  return `<div class="timeline-context" aria-live="polite">
    ${messages.length ? `<div class="context-status">${messages.join("")}</div>` : ""}
    <div class="history-nav">
      <button type="button" data-action="previous-recording" ${previous ? "" : "disabled"}>이전 녹화</button>
      <button type="button" data-action="next-recording" ${next ? "" : "disabled"}>다음 녹화</button>
    </div>
  </div>`;
};
