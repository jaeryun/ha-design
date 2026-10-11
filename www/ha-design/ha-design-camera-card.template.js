import {
  escapeDeviceText,
  renderDeviceCompact,
} from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import "./ha-design-camera-webrtc.js?v=camera-native-fullscreen-20260905-1";

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

const icon = (name) => {
  const paths = {
    privacy: '<path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6Z"/><path d="m4 4 16 16"/>',
    direction: '<path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    recording: '<path d="M4 18V7l4-3 4 3 4-3 4 3v11"/><path d="M8 18v-4h8v4"/>',
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

export const renderCameraView = ({ config, hass, dialogOpen }) => {
  const privacyOn = enabled(hass, config.privacy_entity);
  const camera = entity(hass, config.camera_entity);
  const attributes = camera?.attributes;
  const liveReady = available(camera) && Boolean(attributes?.client_id && (config.stream_name || attributes?.camera_name));
  const liveStatus = privacyOn ? "프라이버시 모드" : liveReady ? "HD · 내부망 연결" : "연결 끊김";
  const recordingOn = enabled(hass, config.recording_entity);
  const angle = entity(hass, config.movement_angle_entity);
  const parsedAngle = Number(angle?.state);
  const angleAvailable = available(angle) && Number.isFinite(parsedAngle);
  const angleValue = angleAvailable ? parsedAngle : null;
  const movementLabel = (direction) =>
    `${direction}${angleValue === null ? "" : ` ${angleValue}도`} 이동`;
  const ptzAvailable = [
    config.movement_angle_entity,
    config.move_up_entity,
    config.move_down_entity,
    config.move_left_entity,
    config.move_right_entity,
  ].every(Boolean);

  return `
    <div data-view="camera">
      <section class="live-section" aria-label="실시간 영상">
        <div class="live-frame ${privacyOn ? "privacy-on" : ""}">
          ${dialogOpen && !privacyOn && liveReady ? '<ha-design-camera-webrtc-player class="live-video"></ha-design-camera-webrtc-player>' : ""}
          ${privacyOn
            ? '<div class="privacy-cover"><strong>프라이버시 모드</strong></div>'
            : liveReady ? "" : '<div class="live-cover" role="status"><strong>카메라에 연결할 수 없습니다</strong><small>실시간 영상만 볼 수 없어요. 과거 영상은 그대로 볼 수 있어요.</small></div>'}
        </div>
        <div class="live-toolbar"><span><strong>실시간 영상</strong><small>${escapeDeviceText(liveStatus)}</small></span><div><button type="button" data-action="snapshot">스냅샷</button></div></div>
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
        ${ptzAvailable ? `<section class="control-section">
          ${sectionHeading({ iconName: "direction", title: "방향 조절", description: privacyOn ? "프라이버시 모드에서 사용할 수 없어요" : "설정 각도만큼 이동" })}
          <div class="ptz-layout">
            <div class="ptz">
              ${directionButton(hass, config.move_up_entity, "up", movementLabel("위로"), "m7 15 5-5 5 5")}
              ${directionButton(hass, config.move_right_entity, "right", movementLabel("오른쪽으로"), "m9 7 5 5-5 5")}
              ${directionButton(hass, config.move_down_entity, "down", movementLabel("아래로"), "m7 9 5 5 5-5")}
              ${directionButton(hass, config.move_left_entity, "left", movementLabel("왼쪽으로"), "m15 7-5 5 5 5")}
            </div>
            <div class="angle-control"><span>한 번에 이동</span><div><button type="button" data-action="angle-decrease" aria-label="이동 각도 줄이기" ${angleAvailable ? "" : "disabled"}>−</button><strong>${angleValue ?? "—"}°</strong><button type="button" data-action="angle-increase" aria-label="이동 각도 늘리기" ${angleAvailable ? "" : "disabled"}>＋</button></div><small>저장된 위치 없음</small></div>
          </div>
        </section>` : ""}
        <section class="control-section">
          ${sectionHeading({
            iconName: "recording",
            title: "Frigate 녹화",
            description: "전체 영상 10일",
            action: switchButton({ action: "recording", checked: recordingOn, label: "Frigate 녹화 저장", entityId: config.recording_entity }),
          })}
          <div class="recording-status ${recordingOn ? "" : "off"}"><span><strong><i></i>${recordingOn ? "영상 저장 중" : "영상 저장 꺼짐"}</strong><small>카메라 SD카드와 별도</small></span><span>${recordingOn ? "저장 중" : "꺼짐"}</span></div>
        </section>
      </div>
    </div>`;
};

export const renderCameraCard = ({ config, hass, dialogOpen, view, historyView }) => {
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
        statusItems: [privacyOn ? "프라이버시 모드 켜짐" : "카메라 켜짐", recordingOn ? "Frigate 저장 중" : "Frigate 저장 꺼짐"],
        narrowStatusItem: recordingOn ? "Frigate 저장 중" : "Frigate 저장 꺼짐",
        badge: privacyOn ? "프라이버시" : "",
      })}
      <dialog id="${escapeDeviceText(dialogId)}" aria-label="${escapeDeviceText(title)} 상세">
        <div class="dialog-scroll">
          <header class="dialog-header">
            <span><small>${escapeDeviceText(config.eyebrow ?? "CAMERA · LOCAL")}</small><strong>${escapeDeviceText(title)}</strong></span>
            <div class="view-switch" role="group" aria-label="영상 보기 선택">
              <button type="button" data-action="live-view" aria-pressed="${view !== "history"}">실시간</button>
              <button type="button" data-action="history-view" aria-pressed="${view === "history"}">과거 영상</button>
            </div>
            <button class="header-icon dialog-close" type="button" data-action="dismiss" aria-label="카메라 상세 닫기">×</button>
          </header>
          ${view === "history" ? historyView : renderCameraView({ config, hass, dialogOpen })}
        </div>
      </dialog>
    </article>`;
};
