import { cameraHistoryWindow, cameraTimeZone, groupCameraEvents } from "./ha-design-camera-events.js?v=camera-time-history-20260906-2";
import { RECORDING_BLOCK_GAP, cameraRecordingBlocks, cameraRecordingCoverage, createCameraRecordingState } from "./ha-design-camera-recording.js?v=camera-block-nav-20260927-1";

export const createCameraEventState = (now = new Date(), timeZone = cameraTimeZone()) => {
  const { days } = cameraHistoryWindow(now, timeZone), day = days.at(-1);
  return { status: "idle", events: [], episodes: [], timeZone, now: now.getTime() / 1000,
    days, day, selectedDate: day.dateKey, selectedTime: now.getTime() / 1000,
    summaryStatus: "idle", summary: [], coverageStatus: "unknown", coverageUntil: now.getTime() / 1000, segments: [],
    selectedEvents: [], timelineWidth: 300, recording: createCameraRecordingState() };
};
export const refreshCameraEventWindow = (state, now, timeZone = state.timeZone) => {
  state.now = now.getTime() / 1000; state.timeZone = timeZone;
  state.days = cameraHistoryWindow(now, timeZone).days;
  state.day = state.days.find(d => d.dateKey === state.selectedDate) ?? state.days.at(-1);
  state.selectedDate = state.day.dateKey;
  state.selectedTime = Math.max(state.day.start, Math.min(state.selectedTime, state.day.end - 0.001, state.now));
};
export const setCameraEventData = (state, events) => {
  state.events = events; state.episodes = groupCameraEvents(events, state.timeZone); state.status = "ready";
};
export const invalidateCameraEventData = state => Object.assign(state, createCameraEventState(new Date(state.now * 1000), state.timeZone));
export const selectedCameraEpisodes = state => state.episodes.filter(e => e.dateKey === state.selectedDate);
export const cameraStateCoverage = state => cameraRecordingCoverage(state.segments, state.day, state.now, state.coverageStatus, state.coverageUntil);
// 표시용 띠. 이동 블록과 같은 3분 기준으로 병합해 1px 미만 조각이 생기지 않게 한다.
// 상태 판정·재생은 위의 정확한 coverage를 그대로 쓴다.
export const cameraStateTape = state => cameraRecordingCoverage(state.segments, state.day, state.now, state.coverageStatus, state.coverageUntil, RECORDING_BLOCK_GAP);
export const cameraStateInterval = state => cameraStateCoverage(state).find(i => state.selectedTime >= i.start && state.selectedTime < i.end)
  ?? cameraStateCoverage(state).findLast(i => i.type !== "future");
// 이전/다음 녹화는 segment가 아니라 녹화 블록(≤3분 공백 병합) 사이를 이동한다.
// 현재 선택이 속한 블록은 앞뒤 이동 대상에서 제외한다.
export const cameraStateNeighbour = (state, previous) => {
  const blocks = cameraRecordingBlocks(state.segments, state.day);
  const current = blocks.find(b => state.selectedTime >= b.start && state.selectedTime < b.end);
  const reference = current ?? { start: state.selectedTime, end: state.selectedTime };
  return previous
    ? blocks.findLast(b => b.end <= reference.start)
    : blocks.find(b => b.start >= reference.end);
};
