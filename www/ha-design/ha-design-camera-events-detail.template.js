import { escapeDeviceText } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import {
  CAMERA_EVENT_KIND,
  CAMERA_TIMELINE_HOURS,
  cameraEpisodeDurationSeconds,
  cameraTimelinePlacement,
} from "./ha-design-camera-events.js?v=camera-events-20260901-3";

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

const kindLabel = (kind) =>
  CAMERA_EVENT_KIND[kind]?.label?.replace(" 감지", "") ?? kind;

const durationLabel = (durationSeconds) => {
  const totalSeconds = Math.round(durationSeconds);
  if (totalSeconds === 0) return "한 시점";
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

export const renderCameraActivityDetail = (episode) => {
  const duration = cameraEpisodeDurationSeconds(episode);
  const start = secondFormatter.format(new Date(episode.startTimestamp));
  const end = secondFormatter.format(new Date(episode.endTimestamp));
  const range = start === end ? start : `${start}–${end}`;
  return `
    <section class="activity-detail" data-view="activity-detail" aria-labelledby="activity-detail-title">
      <header class="activity-detail-nav">
        <button class="header-icon" type="button" data-action="activity-list" aria-label="이벤트 목록으로 돌아가기">←</button>
        <span><small>CAMERA · ACTIVITY DETAIL</small><strong id="activity-detail-title">활동 상세</strong></span>
      </header>
      <div class="activity-detail-body">
        <section class="activity-detail-hero">
          <small>${escapeDeviceText(dateFormatter.format(new Date(episode.startTimestamp)))}</small>
          <div><strong>${escapeDeviceText(range)}</strong><span>${escapeDeviceText(durationLabel(duration))}</span></div>
          <div class="activity-detail-kinds">
            ${episode.kinds.map((kind) =>
              `<span>${escapeDeviceText(kindLabel(kind))}</span>`).join("")}
          </div>
        </section>
        <section class="activity-detail-panel">
          <header><strong>하루 안에서의 위치</strong><span>${escapeDeviceText(range)}</span></header>
          <div class="event-timeline-track" aria-hidden="true">${timelineMarker(episode)}</div>
          ${timelineAxis()}
        </section>
        <section class="activity-detail-panel">
          <h3>활동 정보</h3>
          <dl class="activity-detail-facts">
            <div><dt>시작</dt><dd>${escapeDeviceText(start)}</dd></div>
            <div><dt>종료</dt><dd>${escapeDeviceText(end)}</dd></div>
            <div><dt>지속 시간</dt><dd>${escapeDeviceText(durationLabel(duration))}</dd></div>
            <div><dt>감지 종류</dt><dd>${episode.kinds.map((kind) =>
              escapeDeviceText(kindLabel(kind))).join(" · ")}</dd></div>
          </dl>
        </section>
        <section class="activity-detail-panel raw-event-panel">
          <header><strong>원본 이벤트</strong><span>${episode.events.length}개 · 최신순</span></header>
          <div class="raw-event-list">
            ${episode.events.map((event) => `
              <article class="raw-event">
                <time datetime="${escapeDeviceText(event.timestamp)}">${escapeDeviceText(secondFormatter.format(new Date(event.timestamp)))}</time>
                <span class="raw-event-kind ${escapeDeviceText(event.kind)}">${escapeDeviceText(CAMERA_EVENT_KIND[event.kind]?.label ?? event.kind)}</span>
              </article>`).join("")}
          </div>
        </section>
      </div>
    </section>`;
};
