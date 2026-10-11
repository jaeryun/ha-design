import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { cameraTimelineTicks } from "./ha-design-camera-events.js?v=camera-frigate-motion-20261011-1";
import { cameraStateTape } from "./ha-design-camera-event-state.js?v=camera-frigate-motion-20261011-1";
import { cameraHistoryTime, cameraHistoryRange, renderCameraHistoryMedia, renderCameraHistoryContext } from "./ha-design-camera-events-detail.template.js?v=camera-frigate-motion-20261011-1";

const summaryLabel = state => {
  if (state.coverageStatus !== "ready") return ({ unknown: "확인 불가", loading: "불러오는 중", error: "확인 실패" })[state.coverageStatus] ?? "확인 불가";
  const coverage = cameraStateTape(state);
  if (coverage.some(i => i.type === "unknown")) return "일부 확인 불가";
  if (!coverage.some(i => i.type === "recorded")) return "녹화 없음";
  return coverage.some(i => i.type === "gap") ? "일부 녹화" : "전체 녹화";
};
const renderDays = state => `<nav class="day-selector" aria-label="최근 7일">${state.days.map(day => {
  const today = day.dateKey === state.days.at(-1).dateKey;
  const summary = state.summary.find(row => row.day === day.dateKey);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: state.timeZone }).format(new Date(day.start * 1000));
  const label = state.selectedDate === day.dateKey ? summaryLabel(state) : state.summaryStatus === "ready" ? (summary?.hours.some(h => h.duration > 0) ? "녹화 있음" : "녹화 없음") : state.summaryStatus === "error" ? "확인 실패" : "확인 불가";
  return `<button class="day-button" type="button" data-event-date="${day.dateKey}" aria-pressed="${state.selectedDate === day.dateKey}" aria-label="${day.dateKey}${today ? ", 오늘" : ""}, ${label}"><small>${today ? "오늘" : weekday}</small><strong>${Number(day.dateKey.slice(-2))}</strong></button>`;
}).join("")}</nav>`;
const renderTimeline = state => {
  const { day } = state, span = day.end - day.start, percent = t => (t - day.start) / span * 100;
  const motion = state.motionIntervals;
  const ticks = cameraTimelineTicks(day, state.timeZone);
  const tickClass = tick => tick.desktop && tick.mobile ? "" : tick.desktop ? "desktop-only" : "mobile-only";
  const selectedTime = cameraHistoryTime(state.selectedTime, state);
  const nowInside = state.now >= day.start && state.now < day.end;
  // "지금" 라벨과 겹치는 시간 눈금 라벨은 감춘다(guide 선은 그대로 둔다).
  const labelTicks = ticks.filter(t => !nowInside || Math.abs(t.time - state.now) >= 3600);
  const date = new Intl.DateTimeFormat("ko-KR", { timeZone: state.timeZone, year: "numeric", month: "long", day: "numeric" }).format(new Date(day.start * 1000));
  return `<section class="timeline-section">
    <header class="timeline-header"><span class="timeline-date"><strong>${escapeDeviceText(date)}</strong><small>${summaryLabel(state)}</small></span><output class="selected-time">${selectedTime}</output></header>
    <div class="timeline-legend" id="timeline-sources"><span><i class="legend-motion" aria-hidden="true"></i>Frigate 움직임</span><span><i class="legend-recording" aria-hidden="true"></i>저장 영상</span></div>
    <div class="timeline-surface" data-activity-timeline tabindex="0" role="slider" aria-label="${escapeDeviceText(date)} 녹화 타임라인" aria-valuemin="0" aria-valuemax="${Math.floor(Math.min(day.end - 0.001, state.now) - day.start)}" aria-valuenow="${Math.floor(state.selectedTime - day.start)}" aria-valuetext="${selectedTime}" aria-describedby="timeline-sources timeline-motion-summary">
      <div class="timeline-plot">
        <div class="timeline-guides" aria-hidden="true">${ticks.filter(t => t.time <= state.now).map(t => `<i class="timeline-guide ${tickClass(t)}" data-hour="${t.hour}" style="inset-inline-start:${percent(t.time)}%"></i>`).join("")}</div>
        <div class="motion-lane" aria-hidden="true">${motion.map((interval, index) =>
          `<span class="motion-interval ${state.selectedMotion === interval ? "selected-motion" : ""}" data-motion-interval="${index}" style="inset-inline-start:${percent(interval.start)}%;inline-size:max(2px,${(interval.end - interval.start) / span * 100}%);"></span>`
        ).join("")}</div>
        <div class="coverage-lane" aria-hidden="true">${cameraStateTape(state).map(i => `<span class="coverage-segment ${i.type}" data-start="${i.start}" data-end="${i.end}" style="inset-inline-start:${percent(i.start)}%;inline-size:${(i.end - i.start) / span * 100}%"></span>`).join("")}</div>
        ${state.now >= day.start && state.now < day.end ? `<span class="now-boundary" style="inset-inline-start:${percent(state.now)}%"><i>지금</i></span>` : ""}
        <span class="playhead" style="inset-inline-start:${percent(state.selectedTime)}%"></span>
      </div>
      <div class="timeline-axis" aria-hidden="true">${labelTicks.map(t => `<span class="${tickClass(t)}" data-hour="${t.hour}" style="inset-inline-start:${percent(t.time)}%">${String(t.hour).padStart(2, "0")}</span>`).join("")}</div>
    </div>
    <p class="timeline-source-note">저장 영상의 움직임 분석 · 30초 이내 간격은 한 구간으로 표시해요.</p>
    ${renderCameraHistoryContext(state)}
    <span class="history-sr-only" id="timeline-motion-summary">${motion.map(interval => `움직임 ${cameraHistoryRange(interval, state)}`).join(". ")}</span>
  </section>`;
};
export const renderCameraHistoryView = ({ state, downloadView = "" }) => `<div class="history-view" data-view="history">
  ${renderDays(state)}${renderCameraHistoryMedia(state)}${renderTimeline(state)}
  <div class="download-entry"><button type="button" data-action="download-open" ${state.coverageStatus === "ready" && state.segments.length ? "" : "disabled"}>영상 다운로드</button></div>
  ${downloadView}
</div>`;
