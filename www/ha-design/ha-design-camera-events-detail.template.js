import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { cameraRecordingNativeHlsSupported } from "./ha-design-camera-recording.js?v=camera-tapo-events-20261011-1";
import { cameraStateInterval, cameraStateNeighbour, cameraStateTape } from "./ha-design-camera-event-state.js?v=camera-tapo-events-20261011-1";

export const cameraHistoryTime = (timestamp, state) => new Intl.DateTimeFormat("ko-KR", {
  timeZone: state.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
}).format(new Date(timestamp * 1000));
export const cameraHistoryRange = (interval, state) => `${cameraHistoryTime(interval.start, state)}–${interval.end === state.day.end ? "24:00:00" : cameraHistoryTime(interval.end, state)}`;
export const cameraHistoryMediaStatus = state => {
  if (state.coverageStatus !== "ready") return state.coverageStatus;
  const interval = cameraStateInterval(state);
  if (interval?.type === "unknown") return "unknown";
  const coverage = cameraStateTape(state);
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
      loading: "영상 불러오는 중",
      unknown: "녹화 상태를 확인할 수 없어요.",
      error: "영상을 불러오지 못했어요.",
      empty: "저장된 영상이 없어요.",
      gap: `${cameraHistoryRange(interval, state)} · 녹화 없음`,
      unavailable: "이 영상을 재생할 수 없어요.",
      future: "아직 녹화되지 않은 시간이에요.",
    }[status] ?? "녹화 상태를 확인할 수 없어요.";
    content = `<div class="media-status" role="status"><strong>${escapeDeviceText(copy)}</strong></div>`;
  }
  return `<section class="history-media" data-state="${status}" aria-label="선택한 녹화 영상">${content}</section>`;
};
export const renderCameraHistoryContext = state => {
  const status = cameraHistoryMediaStatus(state);
  const messages = [];
  const event = state.selectedEvent;
  if (event) {
    // 감지 시각의 영상 유무는 병합 표시 블록이 아니라 실제 segment 포함 여부로 판단한다.
    const coverageKnown = state.coverageStatus === "ready";
    const covered = coverageKnown && state.segments.some(segment => event.time >= segment.start && event.time < segment.end);
    messages.push(`<span class="context-event"><strong>${escapeDeviceText(event.label)}</strong> · ${cameraHistoryTime(event.time, state)}${coverageKnown ? "" : " · 녹화 미확인"}</span>`);
    // 선택한 감지 시각에 영상이 없어 재생이 다른 녹화로 이동했음을 함께 알린다.
    if (coverageKnown && !covered) messages.push('<span class="context-event-note">이 시각의 영상이 없어 가까운 영상으로 이동했어요.</span>');
  }
  if (["error", "unknown", "unavailable"].includes(status)) {
    messages.push(`<button type="button" data-action="${state.coverageStatus === "ready" && status !== "unknown" ? "recording-retry" : "history-retry"}">다시 시도</button>`);
  }
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
