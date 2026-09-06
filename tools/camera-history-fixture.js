export const FIXED_NOW = "2026-09-06T05:30:00Z";
export const fixCameraClock = () => {
  const RealDate = Date;
  let current = FIXED_NOW;
  window.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [current])); }
    static now() { return new RealDate(current).getTime(); }
  };
  return value => { current = value; };
};
export const cameraSignal = (target, name) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => { target.removeEventListener(name, done); reject(new Error(`${name} timeout`)); }, 5000);
  const done = event => { clearTimeout(timeout); resolve(event); };
  target.addEventListener(name, done, { once: true });
});
const fakeMedia = video => {
  let time = 0, ready = 0, duration = NaN;
  Object.defineProperties(video, {
    currentTime: { configurable: true, get: () => time, set: value => {
      if (ready < 1) throw new Error("seek before metadata");
      time = value;
      queueMicrotask(() => { video.dispatchEvent(new Event("seeked")); video.dispatchEvent(new Event("timeupdate")); });
    } },
    readyState: { configurable: true, get: () => ready },
    duration: { configurable: true, get: () => duration },
  });
  video.controls = true; video.muted = true; video.playsInline = true;
  return async url => {
    const master = await (await fetch(url)).text();
    const childUrl = master.includes("#EXT-X-STREAM-INF") ? master.trim().split(/\r?\n/).at(-1) : url;
    const child = childUrl === url ? master : await (await fetch(childUrl)).text();
    if (!child.startsWith("#EXTM3U")) throw new Error("fake HLS invalid child");
    duration = [...child.matchAll(/#EXTINF:([\d.]+)/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    if (!duration) throw new Error("fake HLS requires media duration");
    ready = 4;
    video.dispatchEvent(new Event("loadedmetadata"));
    video.dispatchEvent(new Event("loadeddata"));
  };
};
export const installCameraFakeHls = ({ native = false } = {}) => {
  class FakeHlsPlayer extends HTMLElement {
    constructor() {
      super(); this.attachShadow({ mode: "open" });
      this.updateComplete = Promise.resolve().then(() => {
        this.shadowRoot.innerHTML = '<style>:host,video{display:block;width:100%;height:100%}</style><video controls muted playsinline></video>';
        this.loadMedia = fakeMedia(this.shadowRoot.querySelector("video"));
      });
    }
    set url(value) {
      if (value === this._url) return;
      this._url = value;
      this.loaded = this.updateComplete.then(() => this.loadMedia(value)).then(() => this.dispatchEvent(new Event("load")));
      this.loaded.catch(error => { this.dispatchEvent(new CustomEvent("streams", { detail: { hasAudio: false, hasVideo: false } })); console.error(error); });
    }
    get url() { return this._url; }
  }
  if (!customElements.get("ha-hls-player")) customElements.define("ha-hls-player", FakeHlsPlayer);
  if (native) {
    const source = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src");
    Object.defineProperty(HTMLMediaElement.prototype, "src", {
      configurable: true,
      get() { return this._fakeRecordingUrl ?? source.get.call(this); },
      set(url) {
        if (!this.matches(".activity-recording-native")) { source.set.call(this, url); return; }
        this._fakeRecordingUrl = url;
        this._fakeRecordingLoaded = fakeMedia(this)(url);
        this._fakeRecordingLoaded.catch(error => console.error(error));
      },
    });
  }
};
