import { escapeDeviceText } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import {
  CAMERA_EVENT_KIND,
  CAMERA_TIMELINE_HOURS,
  cameraEpisodeDurationSeconds,
  cameraTimelinePlacement,
  filterCameraEpisodes,
} from "./ha-design-camera-events.js?v=camera-events-20260901-3";
import { renderCameraActivityDetail } from "./ha-design-camera-events-detail.template.js?v=camera-native-hls-20260902-1";

const minuteFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const secondFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
});
const breadcrumbDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const EVENT_KINDS = ["person", "motion", "sound"];

const kindLabel = (kind) =>
  CAMERA_EVENT_KIND[kind]?.label?.replace(" 감지", "") ?? kind;
const eventTime = (timestamp) => minuteFormatter.format(new Date(timestamp));
const durationLabel = (durationSeconds) => {
  const totalSeconds = Math.round(durationSeconds);
  if (totalSeconds === 0) return "단발성";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  return [
    hours ? `${hours}시간` : "",
    minutes ? `${minutes}분` : "",
    seconds ? `${seconds}초` : "",
  ].filter(Boolean).join(" ");
};
const timelineMarker = (episode) => {
  const placement = cameraTimelinePlacement(episode);
  return placement.point
    ? `<span class="event-timeline-point" style="inset-inline-start:${placement.startPercent}%"></span>`
    : `<span class="event-timeline-segment" style="inset-inline-start:${placement.startPercent}%;inline-size:${placement.widthPercent}%"></span>`;
};
const timelineAxis = () => `
  <div class="event-timeline-axis" aria-hidden="true">
    ${CAMERA_TIMELINE_HOURS.map((hour) =>
      `<span>${String(hour).padStart(2, "0")}</span>`).join("")}
  </div>`;

export const renderRecentCameraEvents = (events) => {
  if (events.length === 0) {
    return '<p class="events-empty">최근 감지 기록이 없어요.</p>';
  }
  return `
    <div class="recent-event-list">
      ${events.slice(0, 3).map((event) => `
        <div class="recent-event">
          <time datetime="${escapeDeviceText(event.timestamp)}">${escapeDeviceText(eventTime(event.timestamp))}</time>
          <strong>${escapeDeviceText(CAMERA_EVENT_KIND[event.kind]?.label ?? event.kind)}</strong>
        </div>`).join("")}
    </div>`;
};
const renderFilters = (state) => `
  <nav class="event-filters" aria-label="이벤트 종류 필터">
    ${EVENT_KINDS.map((kind) => `
      <button type="button" data-event-kind-filter="${kind}" aria-pressed="${state.selectedKinds.includes(kind)}">
        ${escapeDeviceText(kindLabel(kind))}
      </button>`).join("")}
  </nav>`;

const monthBounds = (state) => {
  return {
    first: state.firstMonth,
    last: state.lastMonth,
  };
};

const renderCalendar = (state) => {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const selected = new Set(state.selectedKinds);
  const byDate = new Map();
  for (const episode of filterCameraEpisodes(state.episodes, state.selectedKinds)) {
    byDate.set(episode.dateKey, (byDate.get(episode.dateKey) ?? 0) + 1);
  }
  const blanks = Array.from({ length: firstWeekday }, () => "<span></span>").join("");
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${state.selectedMonth}-${String(day).padStart(2, "0")}`;
    const count = byDate.get(dateKey) ?? 0;
    const label = dateFormatter.format(new Date(year, month - 1, day));
    const kinds = EVENT_KINDS.filter((kind) => selected.has(kind))
      .map(kindLabel).join(" · ") || "선택 없음";
    return `
      <button type="button" class="event-day ${count ? "has-events" : ""}" data-event-date="${dateKey}"
        aria-pressed="${state.selectedDate === dateKey}"
        aria-label="${escapeDeviceText(label)}, ${escapeDeviceText(kinds)} 활동 ${count ? `구간 ${count}개` : "없음"}">
        ${day}
      </button>`;
  }).join("");
  const bounds = monthBounds(state);
  return `
    <section class="event-calendar">
      <header>
        <button class="event-month" type="button" data-event-month="-1" aria-label="이전 달" ${state.selectedMonth <= bounds.first ? "disabled" : ""}>‹</button>
        <strong>${year}년 ${month}월</strong>
        <button class="event-month" type="button" data-event-month="1" aria-label="다음 달" ${state.selectedMonth >= bounds.last ? "disabled" : ""}>›</button>
      </header>
      <div class="event-weekdays" aria-hidden="true"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
      <section class="event-calendar-grid" aria-label="이벤트 날짜 선택">${blanks}${days}</section>
    </section>`;
};

const selectedEpisodes = (state) =>
  filterCameraEpisodes(
    state.episodes.filter(({ dateKey }) => dateKey === state.selectedDate),
    state.selectedKinds,
  );

const renderDayTimeline = (state, episodes) => {
  const totalSeconds = episodes.reduce((sum, episode) =>
    sum + cameraEpisodeDurationSeconds(episode), 0);
  return `
    <section class="event-day-timeline" aria-label="${escapeDeviceText(state.selectedDate ?? "")}, ${episodes.length}개 활동 구간">
      <header><strong>24시간 활동</strong><span>${episodes.length ? `${episodes.length}구간 · ${durationLabel(totalSeconds)}` : "활동 없음"}</span></header>
      <div class="event-timeline-track" aria-hidden="true">${episodes.map(timelineMarker).join("")}</div>
      ${timelineAxis()}
    </section>`;
};

const renderEpisodeList = (state, episodes) => {
  if (state.status === "loading") return '<p class="history-state" role="status">이벤트 기록을 불러오고 있어요.</p>';
  if (state.status === "error") return '<p class="history-state" role="status">이벤트 기록을 불러오지 못했어요.</p>';
  if (episodes.length === 0) {
    return `<p class="history-state">${state.selectedKinds.length ? "선택한 감지의 활동이 없어요." : "표시할 감지를 하나 이상 선택하세요."}</p>`;
  }
  return episodes.map((episode) => {
    const start = eventTime(episode.startTimestamp);
    const end = eventTime(episode.endTimestamp);
    return `
      <button class="event-episode" type="button" data-episode-id="${escapeDeviceText(episode.id)}"
        aria-label="${start === end
          ? `${escapeDeviceText(start)} 단발성 활동 상세 보기`
          : `${escapeDeviceText(start)}부터 ${escapeDeviceText(end)}까지 활동 상세 보기`}">
        <span class="event-episode-time">${escapeDeviceText(start)}<small>${start === end ? "단발성" : `~ ${escapeDeviceText(end)}`}</small></span>
        <span class="event-episode-copy"><strong>활동 구간</strong><span>${episode.kinds.map((kind) =>
          `<i class="${escapeDeviceText(kind)}">${escapeDeviceText(kindLabel(kind))}</i>`).join("")}</span></span>
        <span class="event-episode-duration">${escapeDeviceText(durationLabel(cameraEpisodeDurationSeconds(episode)))}</span>
      </button>`;
  }).join("");
};

const renderHistory = (state) => {
  const episodes = selectedEpisodes(state);
  const date = state.selectedDate ? dateFormatter.format(new Date(`${state.selectedDate}T00:00:00`)) : "날짜 선택";
  const kinds = EVENT_KINDS.filter((kind) => state.selectedKinds.includes(kind))
    .map(kindLabel).join(" · ") || "선택 없음";
  return `
    <div class="event-body">
      ${renderFilters(state)}
      <div class="event-history-split">
        <aside class="event-calendar-rail">
          ${renderCalendar(state)}
          ${renderDayTimeline(state, episodes)}
        </aside>
        <section class="event-activity-column">
          <header><strong>${escapeDeviceText(date)}</strong><small>${episodes.length}개 활동 구간 · ${escapeDeviceText(kinds)}</small><span>5분 무감지 시 활동 종료</span></header>
          <div class="event-episode-list">${renderEpisodeList(state, episodes)}</div>
        </section>
      </div>
      <span class="event-selection-live" role="status" aria-live="polite" aria-atomic="true">${escapeDeviceText(date)}, ${episodes.length}개 활동 구간</span>
    </div>`;
};

const selectedEventContext = (episode) => {
  const date = new Date(
    episode.events[0]?.timestamp ?? episode.endTimestamp,
  );
  return {
    date: breadcrumbDateFormatter.format(date),
    eventName: `${secondFormatter.format(date)} 이벤트`,
  };
};

const responsiveBreadcrumbLabel = (full, compact) => `
  <span class="breadcrumb-label">${escapeDeviceText(full)}</span>
  <span class="breadcrumb-label-compact" aria-hidden="true">${escapeDeviceText(compact)}</span>`;

const renderEventBreadcrumb = (title, context) => `
  <nav class="event-breadcrumb" aria-label="현재 위치">
    <button class="breadcrumb-link breadcrumb-camera" type="button" data-action="camera-view" aria-label="${escapeDeviceText(title)}" title="${escapeDeviceText(title)}">${responsiveBreadcrumbLabel(title, "카메라")}</button>
    <span aria-hidden="true">›</span>
    ${context
      ? `<button class="breadcrumb-link" type="button" data-action="activity-list" aria-label="이벤트 히스토리">${responsiveBreadcrumbLabel("이벤트 히스토리", "이벤트")}</button>
        <span aria-hidden="true">›</span>
        <button class="breadcrumb-link breadcrumb-date" type="button" data-action="activity-list" aria-label="${escapeDeviceText(context.date)} 이벤트 목록">${escapeDeviceText(context.date)}</button>
        <span aria-hidden="true">›</span>
        <strong id="activity-detail-title" aria-current="page">${escapeDeviceText(context.eventName)}</strong>`
      : '<strong id="event-history-title" aria-current="page">이벤트 히스토리</strong>'}
  </nav>`;

export const renderCameraEventsView = ({ state, title = "거실 카메라" }) => {
  const selected = state.selectedEpisodeId
    ? state.episodes.find(({ id }) => id === state.selectedEpisodeId)
    : null;
  return `
    <div class="event-view" data-view="events">
      <header class="dialog-header event-header">
        <button class="header-icon" type="button" data-action="${selected ? "activity-list" : "camera-view"}" aria-label="${selected ? "이벤트 목록으로 돌아가기" : "카메라 상세로 돌아가기"}">←</button>
        ${renderEventBreadcrumb(
          title,
          selected ? selectedEventContext(selected) : null,
        )}
        <button class="header-icon" type="button" data-action="dismiss" aria-label="이벤트 히스토리 닫기">×</button>
      </header>
      ${selected
        ? renderCameraActivityDetail(selected, state.recording)
        : renderHistory(state)}
    </div>`;
};
