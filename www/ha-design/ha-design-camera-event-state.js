import { cameraHistoryWindow, cameraTimeZone, groupCameraEvents } from "./ha-design-camera-events.js?v=camera-time-history-20260906-2";
import { cameraRecordingCoverage, createCameraRecordingState } from "./ha-design-camera-recording.js?v=camera-time-history-20260906-2";

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
export const cameraStateInterval = state => cameraStateCoverage(state).find(i => state.selectedTime >= i.start && state.selectedTime < i.end)
  ?? cameraStateCoverage(state).findLast(i => i.type !== "future");
