import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import {
  CAMERA_EVENT_KIND,
  CAMERA_TIMELINE_HOURS,
  cameraEpisodeDurationSeconds,
  cameraTimelineEventGroups,
  localCameraDateKey,
} from "./ha-design-camera-events.js?v=camera-time-history-20260906-1";
import {
  cameraRecordingCoverage,
  cameraRecordingNativeHlsSupported,
  cameraRecordingWindow,
} from "./ha-design-camera-recording.js?v=camera-time-history-20260906-1";

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

const timelineAxis = (className, hours) => `
  <div class="activity-timeline-axis ${className}" aria-hidden="true">
    ${hours.map((hour) =>
      `<span>${String(hour).padStart(2, "0")}</span>`).join("")}
  </div>`;

const secondOfDay = (timestamp) => {
  const date = new Date(timestamp);
  return date.getHours() * 3600
    + date.getMinutes() * 60
    + date.getSeconds()
    + date.getMilliseconds() / 1000;
};

const renderTimelineEvents = (
  episodes,
  selectedEpisodeId,
  proximityMinutes,
) => cameraTimelineEventGroups(episodes, proximityMinutes).map((group) => {
  const selected = group.episodes.includes(selectedEpisodeId);
  const episodeId = selected ? selectedEpisodeId : group.episodes.at(-1);
  const episode = episodes.find(({ id }) => id === episodeId);
  const kind = group.eventCount === 1
    ? episode.events[0].kind
    : "cluster";
  const position = selected
    ? secondOfDay(episode.events[0]?.timestamp ?? episode.endTimestamp)
      / (24 * 60 * 60) * 100
    : group.centerPercent;
  return `<span class="activity-timeline-target"
    data-timeline-episode="${escapeDeviceText(episodeId)}"
    data-timeline-episodes="${escapeDeviceText(group.episodes.join(","))}"
    style="inset-inline-start:${position}%"
    aria-hidden="true"><i class="activity-timeline-event ${escapeDeviceText(kind)} ${selected ? "selected" : ""}">${group.eventCount > 1 ? group.eventCount : ""}</i></span>`;
}).join("");

const renderActivityTimeline = (episode, episodes, recording) => {
  const selectedTime = episode.events[0]?.timestamp ?? episode.endTimestamp;
  const selectedSeconds = secondOfDay(selectedTime);
  const today = localCameraDateKey(new Date());
  const selectedDate = localCameraDateKey(selectedTime);
  const nowPercent = selectedDate === today
    ? secondOfDay(new Date()) / (24 * 60 * 60) * 100
    : null;
  const events = episodes.flatMap((item) => item.events);
  const coverage = cameraRecordingCoverage(events);
  const verifiedCoverage = recording.status === "ready"
    ? cameraRecordingCoverage([{
      timestamp: recording.anchorTimestamp ?? selectedTime,
    }])
    : [];
  return `
    <section class="activity-detail-panel activity-timeline-panel">
      <header><strong>녹화 타임라인</strong><span>${escapeDeviceText(secondFormatter.format(new Date(selectedTime)))}</span></header>
      <div class="activity-timeline" data-activity-timeline tabindex="0" role="slider"
        aria-label="선택한 날짜의 녹화 타임라인"
        aria-valuemin="0" aria-valuemax="86399" aria-valuenow="${Math.floor(selectedSeconds)}"
        aria-valuetext="${escapeDeviceText(secondFormatter.format(new Date(selectedTime)))}">
        <div class="activity-timeline-plot">
          <div class="activity-event-lane activity-events-desktop">${renderTimelineEvents(episodes, episode.id, 45)}</div>
          <div class="activity-event-lane activity-events-mobile">${renderTimelineEvents(episodes, episode.id, 90)}</div>
          <div class="activity-coverage-lane">
            ${coverage.map(({ startPercent, widthPercent }) =>
              `<span class="activity-coverage-candidate" style="inset-inline-start:${startPercent}%;inline-size:${widthPercent}%"></span>`).join("")}
            ${verifiedCoverage.map(({ startPercent, widthPercent }) =>
              `<span class="activity-coverage-recorded" style="inset-inline-start:${startPercent}%;inline-size:${widthPercent}%"></span>`).join("")}
            ${nowPercent === null ? "" : `<span class="activity-coverage-future" style="inset-inline-start:${nowPercent}%;inline-size:${100 - nowPercent}%"></span>`}
          </div>
          ${nowPercent === null ? "" : `<span class="activity-now" style="inset-inline-start:${nowPercent}%"><i>지금</i></span>`}
          <span class="activity-playhead" style="inset-inline-start:${selectedSeconds / (24 * 60 * 60) * 100}%"></span>
        </div>
      </div>
      ${timelineAxis("activity-axis-desktop", CAMERA_TIMELINE_HOURS)}
      ${timelineAxis("activity-axis-mobile", [0, 6, 12, 18, 24])}
    </section>`;
};

const recordingWindowLabel = (episode, recording) => {
  const window = recording.startEpoch && recording.endEpoch
    ? recording
    : cameraRecordingWindow(episode);
  return [
    `${secondFormatter.format(new Date(window.startEpoch * 1000))}–${secondFormatter.format(new Date(window.endEpoch * 1000))}`,
    durationLabel(window.durationSeconds),
  ].join(" · ");
};

const recordingFailure = (message) => `
  <div class="activity-recording-state" role="status">
    <strong>${escapeDeviceText(message)}</strong>
    <button type="button" data-action="recording-play">다시 확인</button>
  </div>`;

const renderActivityRecording = (episode, recording) => {
  const label = recordingWindowLabel(episode, recording);
  let content = '<div class="activity-recording-state" role="status"><strong>영상 준비 중…</strong><span>해당 시각의 녹화를 확인하고 있어요.</span></div>';
  if (recording.status === "loading") {
    content = '<div class="activity-recording-state" role="status"><strong>영상 준비 중…</strong><span>해당 시각의 녹화를 확인하고 있어요.</span></div>';
  } else if (recording.status === "ready") {
    content = cameraRecordingNativeHlsSupported()
      ? '<video class="activity-recording-video activity-recording-native" autoplay muted playsinline controls></video>'
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
  episodes = [episode],
) => {
  const duration = cameraEpisodeDurationSeconds(episode);
  const start = secondFormatter.format(new Date(episode.startTimestamp));
  const end = secondFormatter.format(new Date(episode.endTimestamp));
  return `
    <section class="activity-detail" data-view="activity-detail" aria-labelledby="activity-detail-title">
      <div class="activity-detail-body">
        ${renderActivityRecording(episode, recording)}
        ${renderActivityTimeline(episode, episodes, recording)}
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
