import { escapeDeviceText } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import { CAMERA_EVENT_KIND } from "./ha-design-camera-events.js?v=camera-20260831-5";

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
});

const eventLabel = (kind) => CAMERA_EVENT_KIND[kind]?.label ?? kind;
const eventTime = (timestamp) => timeFormatter.format(new Date(timestamp));
const localDateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};
const dayLabel = (timestamp, now) => {
  const date = new Date(timestamp);
  const today = localDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (localDateKey(date) === today) return "오늘";
  if (localDateKey(date) === localDateKey(yesterday)) return "어제";
  return dateFormatter.format(date);
};

export const filteredCameraEvents = (events, filter) =>
  filter === "all" ? events : events.filter(({ kind }) => kind === filter);

export const renderRecentCameraEvents = (events) => {
  if (events.length === 0) {
    return '<p class="events-empty">최근 감지 기록이 없어요.</p>';
  }
  return `
    <div class="recent-event-list">
      ${events.slice(0, 3).map((event) => `
        <div class="recent-event">
          <time datetime="${escapeDeviceText(event.timestamp)}">${escapeDeviceText(eventTime(event.timestamp))}</time>
          <strong>${escapeDeviceText(eventLabel(event.kind))}</strong>
        </div>`).join("")}
    </div>`;
};

const renderHistoryList = (events, now) => {
  const groups = new Map();
  for (const event of events) {
    const key = localDateKey(event.timestamp);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return [...groups.values()].map((items) => `
    <section class="history-day" aria-label="${escapeDeviceText(dayLabel(items[0].timestamp, now))}">
      <header><h3>${escapeDeviceText(dayLabel(items[0].timestamp, now))}</h3><span>${items.length}개</span></header>
      <div class="history-list">
        ${items.map((event) => `
          <article class="history-event" data-event-kind="${escapeDeviceText(event.kind)}">
            <span class="event-kind-icon" aria-hidden="true"></span>
            <span><strong>${escapeDeviceText(eventLabel(event.kind))}</strong><time datetime="${escapeDeviceText(event.timestamp)}">${escapeDeviceText(eventTime(event.timestamp))} · 거실 카메라</time></span>
          </article>`).join("")}
      </div>
    </section>`).join("");
};

const historyContent = ({ events, status, filter, visibleCount, now }) => {
  if (status === "loading") {
    return '<p class="history-state" role="status">이벤트 기록을 불러오고 있어요.</p>';
  }
  if (status === "error") {
    return '<p class="history-state" role="status">이벤트 기록을 불러오지 못했어요.</p>';
  }
  const filtered = filteredCameraEvents(events, filter);
  if (filtered.length === 0) {
    return '<p class="history-state">선택한 종류의 이벤트가 없어요.</p>';
  }
  const visible = filtered.slice(0, visibleCount);
  return `
    ${renderHistoryList(visible, now)}
    ${visible.length < filtered.length
      ? `<button class="load-more" type="button" data-action="events-more">이전 이벤트 더 보기</button>`
      : ""}`;
};

export const renderCameraEventsView = ({
  events,
  status,
  filter,
  visibleCount,
  now = new Date(),
}) => {
  const filtered = filteredCameraEvents(events, filter);
  return `
    <div class="event-view" data-view="events">
      <header class="dialog-header event-header">
        <button class="header-icon" type="button" data-action="camera-view" aria-label="카메라 상세로 돌아가기">←</button>
        <span><small>CAMERA · EVENT HISTORY</small><strong>이벤트 히스토리</strong></span>
        <button class="header-icon" type="button" data-action="dismiss" aria-label="이벤트 히스토리 닫기">×</button>
      </header>
      <div class="event-body">
        <header class="event-summary">
          <span><small>최근 7일</small><strong class="event-total">${filtered.length}개 이벤트</strong></span>
          <small>Home Assistant 기록</small>
        </header>
        <nav class="event-filters" aria-label="이벤트 종류 필터">
          ${[
            ["all", "전체"],
            ["person", "사람"],
            ["motion", "움직임"],
          ].map(([value, label]) => `
            <button type="button" data-filter="${value}" aria-pressed="${filter === value}">${label}</button>`).join("")}
        </nav>
        <div class="event-history">${historyContent({ events, status, filter, visibleCount, now })}</div>
      </div>
    </div>`;
};
