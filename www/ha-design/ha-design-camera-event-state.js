import {
  cameraHistoryWindow,
  filterCameraEpisodes,
  groupCameraEvents,
} from "./ha-design-camera-events.js?v=camera-events-20260901-3";

const DEFAULT_KINDS = ["person", "motion", "sound"];

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const createCameraEventState = (now = new Date()) => {
  const window = cameraHistoryWindow(now);
  return {
    status: "idle",
    events: [],
    episodes: [],
    selectedKinds: [...DEFAULT_KINDS],
    selectedDate: null,
    selectedMonth: monthKey(now),
    firstMonth: window.firstMonth,
    lastMonth: window.lastMonth,
    selectedEpisodeId: null,
    listScroll: 0,
  };
};

export const refreshCameraEventWindow = (state, now) => {
  const window = cameraHistoryWindow(now);
  state.firstMonth = window.firstMonth;
  state.lastMonth = window.lastMonth;
};

export const resetCameraEventState = (state) => {
  state.selectedKinds = [...DEFAULT_KINDS];
  state.selectedEpisodeId = null;
  const newest = state.episodes[0];
  if (newest) {
    state.selectedDate = newest.dateKey;
    state.selectedMonth = newest.dateKey.slice(0, 7);
  }
};

export const setCameraEventStatus = (state, status) => {
  state.status = status;
};

export const setCameraEventData = (state, events) => {
  state.events = events;
  state.episodes = groupCameraEvents(events);
  state.status = "ready";
  resetCameraEventState(state);
};

export const invalidateCameraEventData = (state) => {
  state.status = "idle";
  state.events = [];
  state.episodes = [];
  state.selectedEpisodeId = null;
};

const selectMonthDate = (state) => {
  const matching = state.episodes.find(({ dateKey }) =>
    dateKey.startsWith(state.selectedMonth));
  state.selectedDate = matching?.dateKey ?? `${state.selectedMonth}-01`;
  state.selectedEpisodeId = null;
};

export const applyCameraEventAction = (state, target) => {
  const kind = target.closest("[data-event-kind-filter]")?.dataset.eventKindFilter;
  if (kind) {
    state.selectedKinds = state.selectedKinds.includes(kind)
      ? state.selectedKinds.filter((value) => value !== kind)
      : DEFAULT_KINDS.filter((value) =>
        value === kind || state.selectedKinds.includes(value));
    state.selectedEpisodeId = null;
    return { focus: `[data-event-kind-filter="${kind}"]` };
  }
  const date = target.closest("[data-event-date]")?.dataset.eventDate;
  if (date) {
    state.selectedDate = date;
    state.selectedEpisodeId = null;
    return { focus: `[data-event-date="${date}"]` };
  }
  const monthDelta = Number(
    target.closest("[data-event-month]")?.dataset.eventMonth,
  );
  if (monthDelta) {
    const [year, month] = state.selectedMonth.split("-").map(Number);
    const nextMonth = monthKey(new Date(year, month - 1 + monthDelta, 1));
    if (nextMonth >= state.firstMonth && nextMonth <= state.lastMonth) {
      state.selectedMonth = nextMonth;
      selectMonthDate(state);
    }
    return { focus: `[data-event-date="${state.selectedDate}"]` };
  }
  const episodeId = target.closest("[data-episode-id]")?.dataset.episodeId;
  if (episodeId) {
    state.selectedEpisodeId = episodeId;
    return { focus: '[data-action="activity-list"]', scroll: "top" };
  }
  if (target.closest('[data-action="activity-list"]')) {
    const focus = `[data-episode-id="${state.selectedEpisodeId}"]`;
    state.selectedEpisodeId = null;
    return { focus, scroll: "restore" };
  }
  return null;
};

export const selectedCameraEpisodes = (state) =>
  filterCameraEpisodes(
    state.episodes.filter(({ dateKey }) => dateKey === state.selectedDate),
    state.selectedKinds,
  );

export const selectedCameraEpisode = (state) =>
  state.episodes.find(({ id }) => id === state.selectedEpisodeId) ?? null;
