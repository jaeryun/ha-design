import {
  escapeDeviceText,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=adaptive-compact-20260827-1";
import { renderRecentCameraEvents } from "./ha-design-camera-events.template.js?v=camera-native-hls-20260902-1";
import "./ha-design-camera-webrtc.js?v=camera-20260831-3";

const entity = (hass, entityId) => hass?.states?.[entityId];
const available = (current) =>
  current && !["unknown", "unavailable"].includes(current.state);
const buttonAvailable = (current) =>
  current && current.state !== "unavailable";
const enabled = (hass, entityId) => entity(hass, entityId)?.state === "on";
const pictureUrl = (hass, entityId) => {
  const path = entity(hass, entityId)?.attributes?.entity_picture;
  return path ? hass.hassUrl(path) : "";
};
const detectionLabel = {
  off: "끔",
  low: "낮음",
  normal: "보통",
  high: "높음",
};

const icon = (name) => {
  const paths = {
    privacy: '<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"/><path d="m4 4 16 16"/>',
    direction: '<path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    recording: '<path d="M4 18V7l4-3 4 3 4-3 4 3v11"/><path d="M8 18v-4h8v4"/>',
    events: '<path d="M6 3v3M18 3v3M4 8h16"/><rect x="4" y="5" width="16" height="16" rx="3"/><path d="m9 14 2 2 4-4"/>',
    visual: '<circle cx="12" cy="8" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/>',
    sound: '<path d="M6 9v6M10 6v12M14 8v8M18 10v4"/>',
  };
  return `<span class="section-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${paths[name]}</svg></span>`;
};

const switchButton = ({ action, checked, label, entityId }) => `
  <button class="switch" type="button" role="switch" data-action="${action}" data-entity="${escapeDeviceText(entityId)}" aria-checked="${checked}" aria-label="${escapeDeviceText(label)}"></button>`;

const sectionHeading = ({ iconName, title, description, action = "" }) => `
  <div class="section-heading">
    ${icon(iconName)}
    <span class="section-title"><strong>${escapeDeviceText(title)}</strong><small>${escapeDeviceText(description)}</small></span>
    ${action}
  </div>`;

const detectionControl = (hass, entityId, label) => {
  const current = entity(hass, entityId);
  if (!current) return "";
  const options = available(current) ? current.attributes?.options ?? [] : [];
  return `
    <div class="detection-row">
      <strong>${escapeDeviceText(label)}</strong>
      <fieldset class="sensitivity">
        <legend>${escapeDeviceText(label)} 민감도</legend>
        ${["off", "low", "normal", "high"].map((option) => `
          <button type="button" data-entity="${escapeDeviceText(entityId)}" data-option="${option}" aria-pressed="${current.state === option}" ${options.includes(option) ? "" : "disabled"}>
            ${detectionLabel[option]}
          </button>`).join("")}
      </fieldset>
    </div>`;
};

const detectionSection = (hass, title, iconName, controls, autoTrack = "") => `
  <section class="control-section">
    ${sectionHeading({ iconName, title, description: "종류별 켜기·끄기와 민감도" })}
    <div class="detection-list">
      ${controls.map(([entityId, label]) => detectionControl(hass, entityId, label)).join("")}
    </div>
    ${autoTrack}
  </section>`;

const directionButton = (hass, entityId, direction, label, svgPath) => `
  <button class="ptz-button ${direction}" type="button" data-direction="${direction}" data-entity="${escapeDeviceText(entityId ?? "")}" aria-label="${escapeDeviceText(label)}" ${buttonAvailable(entity(hass, entityId)) ? "" : "disabled"}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${svgPath}"/></svg>
  </button>`;

const compactVisual = (hass, config, privacyOn) => `
  <div class="camera-scene ${privacyOn ? "privacy-on" : ""}">
    ${pictureUrl(hass, config.camera_entity)
      ? `<img src="${escapeDeviceText(pictureUrl(hass, config.camera_entity))}" alt="">`
      : ""}
    <span class="scene-shade" aria-hidden="true"></span>
  </div>`;

export const renderCameraView = ({ config, hass, events, dialogOpen, videoFullscreen }) => {
  const privacyOn = enabled(hass, config.privacy_entity);
  const recordingOn = enabled(hass, config.recording_entity);
  const angle = entity(hass, config.movement_angle_entity);
  const angleValue = Number(angle?.state ?? 15);
  const autoTrack = config.auto_track_entity && entity(hass, config.auto_track_entity)
    ? `<div class="tracking-row"><span><strong>자동 추적</strong><small>감지한 대상을 따라가요</small></span>${switchButton({
      action: "auto-track",
      checked: enabled(hass, config.auto_track_entity),
      label: "자동 추적",
      entityId: config.auto_track_entity,
    })}</div>`
    : "";

  return `
    <div data-view="camera">
      <header class="dialog-header">
        <span><small>MAIN CAMERA · LOCAL</small><strong>${escapeDeviceText(config.title ?? "거실 카메라")}</strong></span>
        <button class="header-icon dialog-close" type="button" data-action="dismiss" aria-label="카메라 상세 닫기">×</button>
      </header>
      <section class="live-section" aria-label="실시간 영상">
        <div class="live-frame ${privacyOn ? "privacy-on" : ""}">
          ${dialogOpen && !privacyOn ? '<ha-design-camera-webrtc-player class="live-video"></ha-design-camera-webrtc-player>' : ""}
          ${privacyOn ? '<div class="privacy-cover"><strong>프라이버시 모드</strong></div>' : ""}
          ${recordingOn ? '<span class="recording-badge" aria-label="녹화 중"><i aria-hidden="true"></i>REC</span>' : ""}
          ${videoFullscreen ? '<button class="fullscreen-exit" type="button" data-action="fullscreen-exit" aria-label="전체화면 닫기">×</button>' : ""}
        </div>
        <div class="live-toolbar"><span><strong>실시간 영상</strong><small>HD · 내부망 연결</small></span><div><button type="button" data-action="fullscreen">전체화면</button><button type="button" data-action="snapshot">스냅샷</button></div></div>
      </section>
      <div class="detail-body">
        <section class="control-section">
          ${sectionHeading({
            iconName: "privacy",
            title: "프라이버시 모드",
            description: privacyOn ? "현재 켜짐" : "현재 꺼짐",
            action: switchButton({ action: "privacy", checked: privacyOn, label: "프라이버시 모드", entityId: config.privacy_entity }),
          })}
        </section>
        <section class="control-section">
          ${sectionHeading({ iconName: "direction", title: "방향 조절", description: privacyOn ? "프라이버시 모드에서 사용할 수 없어요" : "설정 각도만큼 이동" })}
          <div class="ptz-layout">
            <div class="ptz">
              ${directionButton(hass, config.move_up_entity, "up", `위로 ${angleValue}도 이동`, "m7 15 5-5 5 5")}
              ${directionButton(hass, config.move_right_entity, "right", `오른쪽으로 ${angleValue}도 이동`, "m9 7 5 5-5 5")}
              ${directionButton(hass, config.move_down_entity, "down", `아래로 ${angleValue}도 이동`, "m7 9 5 5 5-5")}
              ${directionButton(hass, config.move_left_entity, "left", `왼쪽으로 ${angleValue}도 이동`, "m15 7-5 5 5 5")}
            </div>
            <div class="angle-control"><span>한 번에 이동</span><div><button type="button" data-action="angle-decrease" aria-label="이동 각도 줄이기">−</button><strong>${angleValue}°</strong><button type="button" data-action="angle-increase" aria-label="이동 각도 늘리기">＋</button></div><small>저장된 위치 없음</small></div>
          </div>
        </section>
        <section class="control-section">
          ${sectionHeading({
            iconName: "recording",
            title: "녹화",
            description: "연속 녹화",
            action: switchButton({ action: "recording", checked: recordingOn, label: "녹화", entityId: config.recording_entity }),
          })}
          <div class="recording-status ${recordingOn ? "" : "off"}"><span><strong><i></i>${recordingOn ? "녹화 중" : "녹화 꺼짐"}</strong><small>Frigate 로컬 녹화</small></span><span>${recordingOn ? "정상" : "꺼짐"}</span></div>
        </section>
        <section class="control-section">
          ${sectionHeading({ iconName: "events", title: "이벤트", description: "최근 감지 기록", action: '<button class="section-action" type="button" data-action="events">과거 이벤트 보기</button>' })}
          ${renderRecentCameraEvents(events)}
        </section>
        ${detectionSection(hass, "영상 감지", "visual", [
          [config.motion_detection_entity, "움직임"],
          [config.person_detection_entity, "사람"],
          [config.pet_detection_entity, "반려동물"],
          [config.vehicle_detection_entity, "차량"],
          [config.tamper_detection_entity, "가림·훼손"],
        ], autoTrack)}
        ${detectionSection(hass, "소리 감지", "sound", [
          [config.cry_detection_entity, "울음"],
          [config.bark_detection_entity, "짖는 소리"],
          [config.meow_detection_entity, "고양이 소리"],
          [config.glass_detection_entity, "유리 파손"],
        ])}
      </div>
    </div>`;
};

export const renderCameraCard = ({ config, hass, dialogOpen, videoFullscreen, view, events, eventsView }) => {
  const title = config.title ?? "거실 카메라";
  const dialogId = `camera-${title.replaceAll(/\s+/g, "-")}-details`;
  const privacyOn = enabled(hass, config.privacy_entity);
  const recordingOn = enabled(hass, config.recording_entity);
  return `
    <article class="device-card camera-card">
      ${renderDeviceCompact({
        className: "camera-launcher",
        attributes: `role="button" tabindex="0" aria-label="${escapeDeviceText(title)} 상세 열기" aria-haspopup="dialog" aria-expanded="${dialogOpen}" aria-controls="${escapeDeviceText(dialogId)}"`,
        visual: compactVisual(hass, config, privacyOn),
        eyebrow: config.eyebrow ?? "TAPO · C225 · LOCAL",
        title,
        statusItems: [privacyOn ? "프라이버시 모드 켜짐" : "카메라 켜짐", recordingOn ? "녹화 중" : "녹화 꺼짐"],
        narrowStatusItem: recordingOn ? "녹화 중" : "녹화 꺼짐",
        badge: privacyOn ? "프라이버시" : "LIVE",
      })}
      <dialog id="${escapeDeviceText(dialogId)}" class="${videoFullscreen ? "video-fullscreen" : ""}" aria-label="${escapeDeviceText(title)} 상세">
        <div class="dialog-scroll">${view === "events" ? eventsView : renderCameraView({ config, hass, events, dialogOpen, videoFullscreen })}</div>
      </dialog>
    </article>`;
};
