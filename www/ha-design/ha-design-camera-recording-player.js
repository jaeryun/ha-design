// HA's HLS player owns its video in an open shadow root. Wait for that render
// and actual media readiness, never a guessed delay or a private HA field.
export const configureCameraHistoryPlayer = (player, recording, { onTime, onError, onFrame, onEnded, autoPlay = true, controls = true }) => {
  const abort = new AbortController();
  let video, observer, mediaAbort;
  let loadGeneration = 0, soughtGeneration = -1, intendedOffset = recording.offsetSeconds;
  const reset = () => { loadGeneration++; };
  const frame = () => {
    if (soughtGeneration === loadGeneration && video?.readyState >= 2 && !video.seeking) onFrame?.(video.currentTime);
  };
  const native = player.tagName === "VIDEO";
  const seek = () => {
    if (abort.signal.aborted || soughtGeneration === loadGeneration || !video || video.readyState < 1) return;
    const offset = intendedOffset;
    if (!Number.isFinite(video.duration) || video.duration < offset) return;
    try {
      video.currentTime = offset; soughtGeneration = loadGeneration;
      player.dispatchEvent(new CustomEvent("camera-recording-seeked", { bubbles: true, composed: true, detail: { offset } }));
    } catch (error) {
      onError(error);
    }
  };
  const attach = () => {
    if (abort.signal.aborted) return;
    const next = native ? player : player.shadowRoot?.querySelector("video");
    if (!next || next === video) return;
    mediaAbort?.abort();
    mediaAbort = new AbortController();
    video = next; reset();
    for (const name of ["emptied", "loadstart"]) video.addEventListener(name, reset, { signal: mediaAbort.signal });
    for (const name of ["loadedmetadata", "loadeddata", "durationchange", "canplay", "progress"]) video.addEventListener(name, seek, { signal: mediaAbort.signal });
    video.addEventListener("timeupdate", () => {
      if (soughtGeneration !== loadGeneration || video.readyState < 1 || video.seeking) return;
      intendedOffset = video.currentTime;
      onTime(intendedOffset);
    }, { signal: mediaAbort.signal });
    video.addEventListener("error", () => onError(video.error ?? new Error("Recording media error")), { signal: mediaAbort.signal });
    for (const name of ["seeked", "loadeddata"]) video.addEventListener(name, frame, { signal: mediaAbort.signal });
    video.addEventListener("ended", () => onEnded?.(), { signal: mediaAbort.signal });
    video.controls = controls;
    seek();
  };
  const observe = () => {
    if (abort.signal.aborted) return;
    attach();
    if (!native && player.shadowRoot) {
      observer = new MutationObserver(attach);
      observer.observe(player.shadowRoot, { childList: true, subtree: true });
    }
  };
  if (native) {
    attach();
    player.autoplay = autoPlay; player.playsInline = true; player.controls = controls; player.muted = true;
    player.src = recording.nativeUrl;
  } else {
    const configure = async () => {
      await customElements.whenDefined("ha-hls-player");
      if (abort.signal.aborted) return;
      player.autoPlay = autoPlay; player.playsInline = true; player.controls = controls;
      player.muted = true; player.fitMode = "contain";
      // Subscribe before assigning the URL: even a cached manifest can be fast.
      player.addEventListener("load", attach, { signal: abort.signal });
      player.addEventListener("streams", event => {
        if (event.detail?.hasVideo === false && event.detail?.hasAudio === false) onError(new Error("HA HLS playback failed"));
      }, { signal: abort.signal });
      player.url = recording.url;
      await player.updateComplete;
      observe();
    };
    void configure().catch(error => { if (!abort.signal.aborted) onError(error); });
  }
  return {
    get video() { return video; },
    seek(offset) { intendedOffset = offset; soughtGeneration = -1; seek(); },
    play() { return video?.play(); },
    pause() { video?.pause(); },
    dispose() {
      abort.abort(); mediaAbort?.abort(); observer?.disconnect();
      if (video) video.pause();
      if (native) { player.removeAttribute("src"); player.load(); }
      // HA owns HLS teardown when its custom element is disconnected.
    },
  };
};
