import { escapeDeviceText } from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import {
  CAMERA_EVENT_KIND,
  CAMERA_TIMELINE_HOURS,
  cameraEpisodeDurationSeconds,
  cameraTimelinePlacement,
} from "./ha-design-camera-events.js?v=camera-events-20260901-3";
import {
  cameraRecordingNativeHlsSupported,
  cameraRecordingWindow,
} from "./ha-design-camera-recording.js?v=camera-native-hls-20260902-1";

const secondFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const kindLabel = (kind) =>
  CAMERA_EVENT_KIND[kind]?.label?.replace(" 감지", "") ?? kind;

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

const recordingWindowLabel = (episode, recording) => {
  const window = recording.startEpoch && recording.endEpoch
    ? recording
    : cameraRecordingWindow(episode);
  return [
    `${secondFormatter.format(new Date(window.startEpoch * 1000))}–${secondFormatter.format(new Date(window.endEpoch * 1000))}`,
    durationLabel(window.durationSeconds),
  ].join(" · ");
};

const recordingAction = (label, description) => `
  <button class="activity-recording-action" type="button" data-action="recording-play">
    <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5Z"/></svg></span>
    <strong>${escapeDeviceText(label)}</strong>
    <small>${escapeDeviceText(description)}</small>
  </button>`;

const recordingFailure = (message) => `
  <div class="activity-recording-state" role="status">
    <strong>${escapeDeviceText(message)}</strong>
    <button type="button" data-action="recording-play">다시 확인</button>
  </div>`;

const renderActivityRecording = (episode, recording) => {
  const label = recordingWindowLabel(episode, recording);
  let content = recordingAction("녹화 영상 재생", label);
  if (recording.status === "loading") {
    content = '<div class="activity-recording-state" role="status"><strong>영상 준비 중…</strong><span>해당 시각의 녹화를 확인하고 있어요.</span></div>';
  } else if (recording.status === "ready") {
    content = cameraRecordingNativeHlsSupported()
      ? '<video class="activity-recording-video activity-recording-native"></video>'
      : '<ha-hls-player class="activity-recording-video"></ha-hls-player>';
  } else if (recording.status === "unavailable") {
    content = recordingFailure("이 시간의 녹화 영상이 없습니다.");
  } else if (recording.status === "error") {
    content = recordingFailure("영상을 불러오지 못했어요.");
  }
  return `
    <section class="activity-detail-panel activity-recording-panel" aria-labelledby="activity-recording-title">
      <div class="activity-recording-frame">${content}</div>
      <header><strong id="activity-recording-title">녹화 영상</strong><span>${escapeDeviceText(label)}</span></header>
    </section>`;
};

export const renderCameraActivityDetail = (
  episode,
  recording = { status: "idle" },
) => {
  const duration = cameraEpisodeDurationSeconds(episode);
  const start = secondFormatter.format(new Date(episode.startTimestamp));
  const end = secondFormatter.format(new Date(episode.endTimestamp));
  const range = start === end ? start : `${start}–${end}`;
  return `
    <section class="activity-detail" data-view="activity-detail" aria-labelledby="activity-detail-title">
      <div class="activity-detail-body">
        ${renderActivityRecording(episode, recording)}
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
