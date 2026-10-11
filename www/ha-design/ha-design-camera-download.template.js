import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { cameraDownloadValue } from "./ha-design-camera-download.js?v=camera-download-20261011-1";

const duration = seconds => {
  const value = Math.max(0, Math.round(seconds));
  const hours = Math.floor(value / 3600), minutes = Math.floor(value % 3600 / 60), rest = value % 60;
  return [hours ? `${hours}시간` : "", minutes ? `${minutes}분` : "", rest || (!hours && !minutes) ? `${rest}초` : ""].filter(Boolean).join(" ");
};
export const renderCameraDownload = state => {
  if (!state.open) return "";
  const ready = ["ready", "requested"].includes(state.status) && state.url;
  const status = state.status === "preparing" ? "저장 구간과 다운로드 주소를 확인하고 있어요."
    : state.status === "requested" ? "다운로드를 요청했어요. 완료 여부는 브라우저의 다운로드 목록에서 확인해 주세요."
    : ready ? "다운로드가 준비됐어요. 아래 버튼으로 MP4 파일을 저장하세요." : "범위를 정한 뒤 다운로드 준비를 눌러 주세요.";
  return `<dialog class="camera-download-dialog" aria-labelledby="camera-download-heading">
    <div class="download-content">
      <header class="download-header"><h3 id="camera-download-heading">영상 다운로드</h3><button type="button" class="header-icon" data-action="download-close" aria-label="다운로드 창 닫기">×</button></header>
      <p class="download-caption">${escapeDeviceText(state.title)} · ${escapeDeviceText(state.timeZone)} 기준 · 최근 7일</p>
      <div class="download-fields">${[["start", "시작"], ["end", "종료"]].map(([key, label]) => `<label>${label}<input type="datetime-local" step="1" data-download-field="${key}" aria-label="다운로드 ${label} 시각" min="${cameraDownloadValue(state.min, state.timeZone)}" max="${cameraDownloadValue(state.max, state.timeZone)}"></label>`).join("")}</div>
      <div class="download-feedback" aria-live="polite">
        <p class="download-status" role="status">${status}</p>
        ${state.error ? `<p class="download-error" role="alert">${escapeDeviceText(state.error)}</p>` : ""}
        ${state.coverage ? `<p>저장된 영상: 약 ${duration(state.coverage.coveredSeconds)}</p>` : ""}
        ${state.coverage?.missingSeconds >= 1 ? `<p class="download-gap">선택 범위에 녹화 공백이 약 ${duration(state.coverage.missingSeconds)} 있어요. 저장된 영상만 이어져 실제 재생 길이는 짧아집니다.</p>` : ""}
      </div>
      <p class="download-caption">키프레임 경계로 시작·끝이 조금 달라질 수 있어요. 파일은 요청할 때 생성되며 NAS의 영구 내보내기 목록에는 남지 않습니다.</p>
      <div class="download-actions">
        <button type="button" data-action="download-prepare" ${state.status === "preparing" ? "disabled" : ""}>${state.status === "preparing" ? "준비 중" : ready ? "다시 준비" : "다운로드 준비"}</button>
        ${ready ? `<a class="download-save" data-action="download-save" href="${escapeDeviceText(state.url)}" download="${escapeDeviceText(state.filename)}" rel="noreferrer">MP4 다운로드</a>` : ""}
      </div>
      ${ready ? `<p class="download-caption">${escapeDeviceText(state.filename)}<br>링크는 준비 후 10분간 유효합니다. 파일 생성·저장은 브라우저에서 진행됩니다.</p>` : ""}
    </div>
  </dialog>`;
};
