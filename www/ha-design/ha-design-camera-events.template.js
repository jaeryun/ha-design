import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { CAMERA_EVENT_KIND, cameraTimelineEventGroups, cameraTimelineTicks } from "./ha-design-camera-events.js?v=camera-time-history-20260906-2";
import { cameraStateCoverage, selectedCameraEpisodes } from "./ha-design-camera-event-state.js?v=camera-time-history-20260906-2";
import { cameraHistoryTime, renderCameraHistoryMedia, renderCameraHistoryContext } from "./ha-design-camera-events-detail.template.js?v=camera-time-history-20260906-2";

export const renderRecentCameraEvents = events => events.length ? `<div class="recent-event-list">${events.slice(0, 3).map(event => `<div class="recent-event"><time datetime="${escapeDeviceText(event.timestamp)}">${escapeDeviceText(new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(event.timestamp)))}</time><strong>${escapeDeviceText(CAMERA_EVENT_KIND[event.kind]?.label ?? event.kind)}</strong></div>`).join("")}</div>` : '<p class="events-empty">최근 감지 기록이 없어요.</p>';
const summaryLabel = state => {
  if (state.coverageStatus !== "ready") return ({ unknown: "확인 불가", loading: "불러오는 중", error: "확인 실패" })[state.coverageStatus] ?? "확인 불가";
  const coverage = cameraStateCoverage(state);
  if (coverage.some(i => i.type === "unknown")) return "일부 확인 불가";
  if (!coverage.some(i => i.type === "recorded")) return "녹화 없음";
  return coverage.some(i => i.type === "gap") ? "일부 녹화" : "전체 녹화";
};
const renderDays = state => `<nav class="day-selector" aria-label="최근 7일">${state.days.map(day => {
  const today = day.dateKey === state.days.at(-1).dateKey;
  const activity = state.episodes.some(e => e.dateKey === day.dateKey);
  const summary = state.summary.find(row => row.day === day.dateKey);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: state.timeZone }).format(new Date(day.start * 1000));
  const label = state.selectedDate === day.dateKey ? summaryLabel(state) : state.summaryStatus === "ready" ? (summary?.hours.some(h => h.duration > 0) ? "녹화 있음" : "녹화 없음") : state.summaryStatus === "error" ? "확인 실패" : "확인 불가";
  return `<button class="day-button ${activity ? "" : "no-activity"}" type="button" data-event-date="${day.dateKey}" aria-pressed="${state.selectedDate === day.dateKey}" aria-label="${day.dateKey}${today ? ", 오늘" : ""}, ${label}"><small>${today ? "오늘" : weekday}</small><strong>${Number(day.dateKey.slice(-2))}</strong></button>`;
}).join("")}</nav>`;
const renderTimeline = state => {
  const { day } = state, span = day.end - day.start, percent = t => (t - day.start) / span * 100;
  const groups = cameraTimelineEventGroups(selectedCameraEpisodes(state), state.timelineWidth, day);
  const ticks = cameraTimelineTicks(day, state.timeZone);
  const tickClass = tick => tick.desktop && tick.mobile ? "" : tick.desktop ? "desktop-only" : "mobile-only";
  const selectedIds = new Set(state.selectedEvents.map(e => e.id));
  const selectedTime = cameraHistoryTime(state.selectedTime, state);
  const date = new Intl.DateTimeFormat("ko-KR", { timeZone: state.timeZone, year: "numeric", month: "long", day: "numeric" }).format(new Date(day.start * 1000));
  return `<section class="timeline-section">
    <header class="timeline-header"><span class="timeline-date"><strong>${escapeDeviceText(date)}</strong><small>${summaryLabel(state)}</small></span><output class="selected-time">${selectedTime}</output></header>
    <div class="timeline-surface ${state.selectedEvents.length ? "playhead-at-event" : ""}" data-activity-timeline tabindex="0" role="slider" aria-label="${escapeDeviceText(date)} 녹화 타임라인" aria-valuemin="0" aria-valuemax="${Math.floor(Math.min(day.end - 0.001, state.now) - day.start)}" aria-valuenow="${Math.floor(state.selectedTime - day.start)}" aria-valuetext="${selectedTime}" aria-describedby="timeline-event-summary">
      <div class="timeline-plot">
        <div class="timeline-guides" aria-hidden="true">${ticks.filter(t => t.time <= state.now).map(t => `<i class="timeline-guide ${tickClass(t)}" data-hour="${t.hour}" style="inset-inline-start:${percent(t.time)}%"></i>`).join("")}</div>
        <div class="event-lane" data-event-lane aria-hidden="true">${groups.map((group, index) => {
          const kind = group.events.every(e => e.kind === group.events[0].kind) ? group.events[0].kind : "person";
          const selected = group.events.some(e => selectedIds.has(e.id));
          return `<span class="${group.type === "cluster" ? "visual-cluster" : group.type === "activity" ? "activity-window" : "event-point"} ${kind} ${selected ? "selected-event" : ""}" data-timeline-event="${index}" data-event-count="${group.events.length}" style="inset-inline-start:${group.centerPercent}%;${group.type === "activity" ? `inline-size:max(6px,${(group.end - group.start) / span * 100}%);` : ""}">${group.type === "cluster" ? group.events.length : ""}</span>`;
        }).join("")}</div>
        <div class="coverage-lane" aria-hidden="true">${cameraStateCoverage(state).map(i => `<span class="coverage-segment ${i.type}" data-start="${i.start}" data-end="${i.end}" style="inset-inline-start:${percent(i.start)}%;inline-size:${(i.end - i.start) / span * 100}%"></span>`).join("")}</div>
        ${state.now >= day.start && state.now < day.end ? `<span class="now-boundary" style="inset-inline-start:${percent(state.now)}%"><i>지금</i></span>` : ""}
        <span class="playhead" style="inset-inline-start:${percent(state.selectedTime)}%"></span>
      </div>
      <div class="timeline-axis" aria-hidden="true">${ticks.map(t => `<span class="${tickClass(t)}" data-hour="${t.hour}" style="inset-inline-start:${percent(t.time)}%">${String(t.hour).padStart(2, "0")}</span>`).join("")}</div>
    </div>
    ${renderCameraHistoryContext(state)}
    <span class="history-sr-only" id="timeline-event-summary">${groups.map(g => `${cameraHistoryTime(g.timestamp, state)} · ${Object.entries(g.counts).filter(([, count]) => count).map(([kind, count]) => `${CAMERA_EVENT_KIND[kind].label} ${count}`).join(" · ")}`).join(". ")}</span>
  </section>`;
};
export const renderCameraEventsView = ({ state, title = "거실 카메라" }) => `<div class="event-view" data-view="events">
  <header class="dialog-header event-header"><button class="header-icon" type="button" data-action="camera-view" aria-label="카메라 상세로 돌아가기">←</button><span class="history-title"><small>CAMERA · HISTORY</small><strong aria-current="page">${escapeDeviceText(title)} 기록</strong></span><button class="header-icon" type="button" data-action="dismiss" aria-label="카메라 기록 닫기">×</button></header>
  ${renderDays(state)}${renderCameraHistoryMedia(state)}${renderTimeline(state)}
</div>`;
