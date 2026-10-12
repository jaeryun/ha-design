import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { cameraTimelineTicks, groupCameraEvents } from "./ha-design-camera-events.js?v=camera-tapo-events-20261011-1";
import { cameraStateTape, cameraVisibleEvents } from "./ha-design-camera-event-state.js?v=camera-tapo-events-20261011-1";
import { cameraHistoryTime, renderCameraHistoryMedia, renderCameraHistoryContext } from "./ha-design-camera-events-detail.template.js?v=camera-tapo-events-20261011-1";

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
// 설정한 감지 센서가 있을 때만 필터를 노출한다. 값은 entityId, 전체는 빈 문자열이다.
const renderEventFilters = state => {
  const sources = state.eventSources ?? [];
  if (!sources.length) return "";
  return `<div class="event-filters" role="group" aria-label="감지 이벤트 필터">
    <button type="button" class="event-filter" data-event-filter="" aria-pressed="${state.eventFilter == null}">전체</button>
    ${sources.map(source => `<button type="button" class="event-filter" data-event-filter="${escapeDeviceText(source.entityId)}" aria-pressed="${state.eventFilter === source.entityId}">${escapeDeviceText(source.label)}</button>`).join("")}
  </div>`;
};
// 감지 상태는 녹화 coverage와 독립이다. 조회 중·실패·미설정·빈 결과를 각각 알리고,
// 확인할 수 없는 센서가 있어도 이미 조회한 이력은 숨기지 않는다.
const renderEventStatus = state => {
  const unavailable = state.unavailableEventSources ?? [];
  const warning = unavailable.length
    ? `<p class="unavailable-event-sources" role="status">일부 감지 센서를 확인할 수 없어요: ${unavailable.map(source => escapeDeviceText(source.label)).join(", ")}</p>`
    : "";
  let status = "";
  if (state.eventsStatus === "unconfigured") status = '<p class="event-status" role="status">감지 센서가 설정되지 않아 이벤트를 표시하지 않아요.</p>';
  else if (state.eventsStatus === "error") status = '<p class="event-status" role="status"><span>감지 이력을 불러오지 못했어요.</span><button type="button" data-action="events-retry">다시 확인</button></p>';
  else if (state.eventsStatus === "idle" || state.eventsStatus === "loading") status = '<p class="event-status" role="status">감지 이력을 불러오는 중이에요.</p>';
  else if (!cameraVisibleEvents(state).length) {
    status = `<p class="event-status" role="status">${state.eventFilter ? "선택한 감지의 기록이 없어요." : "이 기간에 확인된 감지 기록이 없어요."}</p>`;
  }
  return status + warning;
};
const renderTimeline = state => {
  const { day } = state, span = day.end - day.start, percent = t => (t - day.start) / span * 100;
  const ticks = cameraTimelineTicks(day, state.timeZone);
  const tickClass = tick => tick.desktop && tick.mobile ? "" : tick.desktop ? "desktop-only" : "mobile-only";
  const selectedTime = cameraHistoryTime(state.selectedTime, state);
  const nowInside = state.now >= day.start && state.now < day.end;
  // "지금" 라벨과 겹치는 시간 눈금 라벨은 감춘다(guide 선은 그대로 둔다).
  const labelTicks = ticks.filter(t => !nowInside || Math.abs(t.time - state.now) >= 3600);
  const date = new Intl.DateTimeFormat("ko-KR", { timeZone: state.timeZone, year: "numeric", month: "long", day: "numeric" }).format(new Date(day.start * 1000));
  const groups = groupCameraEvents(cameraVisibleEvents(state), state.timeZone);
  const selectedId = state.selectedEvent?.id ?? null;
  const selectedGroup = groups.find(group => group.events.some(event => event.id === selectedId));
  const groupLabel = group => `${cameraHistoryTime(group.start, state)}${group.end > group.start ? `–${cameraHistoryTime(group.end, state)}` : ""} · ${group.events.length}건`;
  const eventSummary = groups.map(group =>
    `${[...new Set(group.events.map(event => escapeDeviceText(event.label)))].join(", ")} ${groupLabel(group)}`).join(". ");
  return `<section class="timeline-section">
    <header class="timeline-header"><span class="timeline-date"><strong>${escapeDeviceText(date)}</strong><small>${summaryLabel(state)}</small></span><output class="selected-time">${selectedTime}</output></header>
    <div class="timeline-legend" id="timeline-sources"><span><i class="legend-event" aria-hidden="true"></i>Tapo 감지 이력 · 30분 묶음</span><span><i class="legend-recording" aria-hidden="true"></i>Frigate 저장 영상</span></div>
    ${renderEventFilters(state)}
    <div class="timeline-surface" data-activity-timeline tabindex="0" role="slider" aria-label="${escapeDeviceText(date)} 녹화 타임라인" aria-valuemin="0" aria-valuemax="${Math.floor(Math.min(day.end - 0.001, state.now) - day.start)}" aria-valuenow="${Math.floor(state.selectedTime - day.start)}" aria-valuetext="${selectedTime}" aria-describedby="timeline-sources timeline-event-summary">
      <div class="timeline-plot">
        <div class="timeline-guides" aria-hidden="true">${ticks.filter(t => t.time <= state.now).map(t => `<i class="timeline-guide ${tickClass(t)}" data-hour="${t.hour}" style="inset-inline-start:${percent(t.time)}%"></i>`).join("")}</div>
        <div class="event-lane" aria-hidden="true">${groups.map((group, index) =>
          `<span class="event-marker${group.events.length > 1 ? " event-activity" : ""}${group === selectedGroup ? " selected-event" : ""}" data-camera-event-group="${index}" data-start="${group.start}" data-end="${group.end}" data-event-count="${group.events.length}" style="inset-inline-start:${percent(group.start)}%;${group.events.length > 1 ? `inline-size:${(group.end - group.start) / span * 100}%;` : ""}"></span>`
        ).join("")}</div>
        <div class="coverage-lane" aria-hidden="true">${cameraStateTape(state).map(i => `<span class="coverage-segment ${i.type}" data-start="${i.start}" data-end="${i.end}" style="inset-inline-start:${percent(i.start)}%;inline-size:${(i.end - i.start) / span * 100}%"></span>`).join("")}</div>
        ${state.now >= day.start && state.now < day.end ? `<span class="now-boundary" style="inset-inline-start:${percent(state.now)}%"><i>지금</i></span>` : ""}
        <span class="playhead" style="inset-inline-start:${percent(state.selectedTime)}%"></span>
      </div>
      <div class="timeline-axis" aria-hidden="true">${labelTicks.map(t => `<span class="${tickClass(t)}" data-hour="${t.hour}" style="inset-inline-start:${percent(t.time)}%">${String(t.hour).padStart(2, "0")}</span>`).join("")}</div>
    </div>
    <p class="timeline-source-note">30분 이내로 이어진 감지를 묶어 표시해요. 구간 내내 움직였다는 뜻은 아니에요.</p>
    ${selectedGroup ? `<p class="timeline-source-note selected-event-group">활동 ${groupLabel(selectedGroup)}</p>` : ""}
    ${renderEventStatus(state)}
    ${renderCameraHistoryContext(state)}
    <span class="history-sr-only" id="timeline-event-summary">${eventSummary}</span>
  </section>`;
};
export const renderCameraHistoryView = ({ state, downloadView = "" }) => `<div class="history-view" data-view="history">
  ${renderDays(state)}${renderCameraHistoryMedia(state)}${renderTimeline(state)}
  <div class="download-entry"><button type="button" data-action="download-open" ${state.coverageStatus === "ready" && state.segments.length ? "" : "disabled"}>영상 다운로드</button></div>
  ${downloadView}
</div>`;
