import assert from "node:assert/strict";
import { configureCameraHistoryPlayer } from "../www/ha-design/ha-design-camera-recording-player.js";

// Model the HTMLMediaElement reset/readiness contract, including the reset
// timeupdate. Source loading and seek completion are explicit events, not timers.
class Video extends EventTarget {
  tagName = "VIDEO";
  readyState = 0;
  duration = NaN;
  currentTime = 0;
  pause() {}
  removeAttribute() {}
  load() {}
  emit(type) { this.dispatchEvent(new Event(type)); }
  reset() {
    this.readyState = 0; this.duration = NaN; this.currentTime = 0;
    this.emit("emptied"); this.emit("timeupdate"); this.emit("loadstart");
  }
  metadata() { this.readyState = 1; this.emit("loadedmetadata"); }
  durationReady() { this.duration = 3600; this.emit("durationchange"); this.emit("loadeddata"); }
}
for (const resumeOffset of [1200, 1350]) {
  const video = new Video(), updates = [], errors = [];
  const dispose = configureCameraHistoryPlayer(video, { offsetSeconds: 1200, nativeUrl: "/signed-child" }, {
    onTime: offset => updates.push(offset), onError: error => errors.push(error),
  });
  video.metadata();
  assert.equal(video.currentTime, 0, "wait for duration readiness");
  video.durationReady();
  assert.equal(video.currentTime, 1200);
  video.currentTime = resumeOffset; video.emit("timeupdate");
  video.reset(); video.metadata();
  assert.equal(video.currentTime, 0, "reload must await usable duration");
  video.durationReady(); video.emit("timeupdate");
  console.log(JSON.stringify({ case: "same video reload", intendedOffset: resumeOffset, actualOffset: video.currentTime, onTime: updates }));
  assert.equal(video.currentTime, resumeOffset, "same-node reload must restore the last valid intended offset");
  assert.deepEqual(updates, [resumeOffset, resumeOffset], "reset timeupdate is not valid playback");
  assert.deepEqual(errors, []);
  dispose();
  video.reset(); video.metadata(); video.durationReady(); video.emit("timeupdate");
  assert.deepEqual(updates, [resumeOffset, resumeOffset], "disposed media cannot publish playback updates");
}
console.log("PASS camera same-node media reset/readiness and resume offset");
