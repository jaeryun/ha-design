import { escapeDeviceText } from "./ha-design-device-compact.js?v=camera-native-lifecycle-20260902-1";
import { cameraDownloadValue } from "./ha-design-camera-download.js?v=camera-tapo-events-20261011-1";
import { cameraRecordingCoverage, cameraRecordingNativeHlsSupported } from "./ha-design-camera-recording.js?v=camera-tapo-events-20261011-1";

const duration = seconds => {
  const value = Math.max(0, Math.round(seconds));
  const hours = Math.floor(value / 3600), minutes = Math.floor(value % 3600 / 60), rest = value % 60;
  return [hours ? `${hours}시간` : "", minutes ? `${minutes}분` : "", rest || (!hours && !minutes) ? `${rest}초` : ""].filter(Boolean).join(" ");
};
export const renderCameraDownload = state => {
  if (!state.open) return "";
  const ready = ["ready", "requested"].includes(state.status) && state.url;
  const editor = state.editor, preview = state.preview, viewport = editor.viewport;
  const percent = time => Math.max(0, Math.min(100, (time - viewport.start) / (viewport.end - viewport.start) * 100));
  const value = time => cameraDownloadValue(time, state.timeZone);
  const coverage = cameraRecordingCoverage(editor.segments, viewport, viewport.end, editor.coverageStatus, viewport.end, 1);
  const frameLabel = preview.shownTime == null ? "미리보기 준비 중" : `${editor.active === "end" ? "끝 직전" : editor.active === "start" ? "시작" : "미리보기"} · ${value(preview.shownTime).replace("T", " ")}`;
  const frameStatus = { loading: "영상을 불러오고 있어요.", seeking: "선택한 화면으로 이동 중", gap: "이 시각에는 저장된 영상이 없어요.", error: preview.error ?? "미리보기 영상을 불러오지 못했어요.", invalid: "입력한 시간 범위를 확인해 주세요." }[preview.status];
  const status = state.status === "preparing" ? "다운로드 준비 중"
    : state.status === "requested" ? "다운로드를 요청했어요." : "";
  return `<dialog class="camera-download-dialog" aria-labelledby="camera-download-heading">
    <div class="download-content">
      <header class="download-header"><h3 id="camera-download-heading">영상 다운로드</h3><button type="button" class="header-icon" data-action="download-close" aria-label="다운로드 창 닫기">×</button></header>
      <section class="trim-preview-stage" data-state="${preview.status}" aria-label="선택 지점 영상 미리보기">
        ${cameraRecordingNativeHlsSupported() ? '<video class="trim-preview-video activity-recording-native" muted playsinline aria-label="편집 미리보기 영상"></video>' : '<ha-hls-player class="trim-preview-video" aria-label="편집 미리보기 영상"></ha-hls-player>'}
        <div class="trim-preview-cover" ${frameStatus ? "" : "hidden"} role="status">${frameStatus ?? ""}${preview.status === "error" ? '<button type="button" data-action="trim-retry">다시 보기</button>' : ""}</div>
      </section>
      <div class="trim-preview-toolbar"><output class="trim-frame-time">${frameLabel}</output><button type="button" data-action="trim-play" ${preview.status === "invalid" ? "disabled" : ""}>${preview.playing ? "미리보기 멈춤" : "선택 구간 재생"}</button></div>
      <div class="trim-boundary-times">${[["start", "시작"], ["end", "끝"]].map(([edge, label]) => `<button type="button" data-action="trim-focus-${edge}" aria-label="${label} 화면 보기"><small>${label} · ${value(editor[edge]).slice(0, 10)}</small><strong>${value(editor[edge]).slice(11)}</strong></button>`).join("")}</div>
      <div class="trim-timeline">
        <div class="trim-track" data-trim-track role="group" aria-label="드래그로 저장 구간 선택">
          <div class="trim-rail"></div>
          <div class="trim-selection" style="inset-inline-start:${percent(editor.start)}%;inline-size:${Math.max(0, percent(editor.end) - percent(editor.start))}%"></div>
          <div class="trim-coverage" aria-hidden="true">${coverage.filter(i => i.type !== "gap").map(i => `<i class="${i.type}" style="inset-inline-start:${percent(i.start)}%;inline-size:${percent(i.end) - percent(i.start)}%"></i>`).join("")}</div>
          <i class="trim-playhead" aria-hidden="true" style="inset-inline-start:${percent(preview.shownTime ?? preview.target)}%"></i>
          ${[["start", "시작"], ["end", "끝"]].map(([edge, label]) => `<button type="button" class="trim-handle ${edge}" data-trim-handle="${edge}" role="slider" aria-label="${label} 지점" aria-valuemin="${edge === "start" ? 0 : editor.start + 1 - state.min}" aria-valuemax="${(edge === "end" ? state.max : editor.end - 1) - state.min}" aria-valuenow="${editor[edge] - state.min}" aria-valuetext="${value(editor[edge]).replace("T", " ")}" style="inset-inline-start:${percent(editor[edge])}%">${label}</button>`).join("")}
        </div>
        <div class="trim-axis"><span>${value(viewport.start).slice(5).replace("T", " ")}</span><span>${value(viewport.end).slice(5).replace("T", " ")}</span></div>
      </div>
      <div class="trim-navigation"><button type="button" data-action="trim-earlier" ${viewport.start <= state.min ? "disabled" : ""}>이전 구간</button><button type="button" data-action="trim-zoom-in" ${viewport.end - viewport.start <= 30 ? "disabled" : ""}>확대</button><button type="button" data-action="trim-fit">맞춤</button><button type="button" data-action="trim-zoom-out" ${viewport.end - viewport.start >= state.max - state.min ? "disabled" : ""}>축소</button><button type="button" data-action="trim-later" ${viewport.end >= state.max ? "disabled" : ""}>다음 구간</button></div>
      <p class="trim-duration">선택 구간 ${duration(editor.end - editor.start)}</p>
      <button type="button" class="trim-manual-toggle" data-action="trim-manual" aria-expanded="${Boolean(state.advanced)}">날짜·시간 직접 입력</button>
      <div class="download-fields" ${state.advanced ? "" : "hidden"}>${[["start", "시작"], ["end", "종료"]].map(([key, label]) => `<label>${label}<input type="datetime-local" step="1" data-download-field="${key}" aria-label="다운로드 ${label} 시각" min="${value(state.min)}" max="${value(state.max)}"></label>`).join("")}</div>
      ${state.advanced ? `<p class="download-caption">${escapeDeviceText(state.timeZone)} 기준</p>` : ""}
      <div class="download-feedback" aria-live="polite">
        ${status ? `<p class="download-status" role="status">${status}</p>` : ""}
        ${state.error ? `<p class="download-error" role="alert">${escapeDeviceText(state.error)}</p>` : ""}
        ${state.coverage?.missingSeconds >= 1 ? `<p class="download-gap">약 ${duration(state.coverage.missingSeconds)}의 빈 구간을 제외하고 저장해요.</p>` : ""}
      </div>
      <div class="download-actions"><button type="button" data-action="download-prepare" ${state.status === "preparing" ? "disabled" : ""}>${state.status === "preparing" ? "준비 중" : ready ? "다시 확인" : "선택 구간 확인"}</button>${ready ? `<a class="download-save" data-action="download-save" href="${escapeDeviceText(state.url)}" download="${escapeDeviceText(state.filename)}" rel="noreferrer">다운로드</a>` : ""}</div>
      <p class="download-caption">저장된 영상의 시작·끝은 선택한 시각과 조금 다를 수 있어요.</p>
    </div>
  </dialog>`;
};
