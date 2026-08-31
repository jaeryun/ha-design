const PLAYER_TAG = "ha-design-camera-webrtc-player";

class HaDesignCameraWebRtcPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._session = 0;
    this._video = document.createElement("video");
    this._status = document.createElement("div");
    this._status.className = "status";
    this._status.hidden = true;
    this._video.addEventListener("loadeddata", () => {
      this._status.hidden = true;
      this.dispatchEvent(new Event("load"));
    });
    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; position: relative; overflow: hidden; background: #15171d; }
      video { display: block; width: 100%; height: 100%; background: #15171d; object-fit: cover; }
      .status { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px;
        color: white; background: #15171d; font: 600 14px/1.5 system-ui, sans-serif; text-align: center; }
      .status[hidden] { display: none; }
    `;
    this.shadowRoot.append(style, this._video, this._status);
    this.autoPlay = true;
    this.playsInline = true;
    this.controls = true;
    this.muted = true;
    this.fitMode = "cover";
  }

  connectedCallback() {
    this._connect();
  }

  disconnectedCallback() {
    this._disconnect();
  }

  set hass(value) {
    this._hass = value;
    this._connect();
  }

  set entityid(value) {
    if (this._entityid === value) return;
    this._entityid = value;
    this._disconnect();
    this._connect();
  }

  get entityid() {
    return this._entityid;
  }

  set autoPlay(value) {
    this._autoPlay = Boolean(value);
    this._video.autoplay = this._autoPlay;
  }

  get autoPlay() {
    return this._autoPlay;
  }

  set playsInline(value) {
    this._playsInline = Boolean(value);
    this._video.playsInline = this._playsInline;
  }

  get playsInline() {
    return this._playsInline;
  }

  set controls(value) {
    this._controls = Boolean(value);
    this._video.controls = this._controls;
  }

  get controls() {
    return this._controls;
  }

  set muted(value) {
    this._muted = Boolean(value);
    this._video.muted = this._muted;
  }

  get muted() {
    return this._muted;
  }

  set posterUrl(value) {
    this._posterUrl = value;
    if (value) this._video.poster = value;
    else this._video.removeAttribute("poster");
  }

  get posterUrl() {
    return this._posterUrl;
  }

  set fitMode(value) {
    this._fitMode = value;
    this._video.style.objectFit = value;
  }

  get fitMode() {
    return this._fitMode;
  }

  async _connect() {
    if (!this.isConnected || !this._hass || !this._entityid || this._socket || this._connecting) return;
    const state = this._hass.states[this._entityid];
    const clientId = state?.attributes.client_id;
    const streamName = state?.attributes.camera_name;
    if (!clientId || !streamName) return;

    const session = ++this._session;
    this._connecting = true;
    try {
      const proxyPath = `/api/frigate/${encodeURIComponent(clientId)}/go2rtc/ws/api/ws?src=${encodeURIComponent(streamName)}`;
      const signed = await this._hass.callWS({ type: "auth/sign_path", path: proxyPath, expires: 60 });
      if (!this.isConnected || session !== this._session) return;
      const socketUrl = new URL(signed.path, window.location.origin);
      socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
      this._openWebRtc(socketUrl, session);
    } catch (error) {
      this._showError(error, session);
    } finally {
      this._connecting = false;
    }
  }

  _openWebRtc(socketUrl, session) {
    const peer = new RTCPeerConnection({ bundlePolicy: "max-bundle", iceServers: [] });
    const socket = new WebSocket(socketUrl);
    const stream = new MediaStream();
    this._peer = peer;
    this._socket = socket;
    this._stream = stream;
    this._messages = Promise.resolve();

    peer.addEventListener("track", (event) => {
      stream.getTracks()
        .filter((track) => track.kind === event.track.kind)
        .forEach((track) => stream.removeTrack(track));
      stream.addTrack(event.track);
      this._video.srcObject = stream;
    });
    peer.addEventListener("icecandidate", (event) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "webrtc/candidate", value: event.candidate?.candidate ?? "" }));
    });
    peer.addEventListener("connectionstatechange", () => {
      if (peer.connectionState === "failed") this._showError(new Error("WebRTC connection failed"), session);
    });
    socket.addEventListener("open", async () => {
      try {
        peer.addTransceiver("video", { direction: "recvonly" });
        peer.addTransceiver("audio", { direction: "recvonly" });
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: "webrtc/offer", value: offer.sdp }));
      } catch (error) {
        this._showError(error, session);
      }
    });
    socket.addEventListener("message", (event) => {
      this._messages = this._messages
        .then(() => this._handleSignal(peer, JSON.parse(event.data)))
        .catch((error) => this._showError(error, session));
    });
    socket.addEventListener("error", () => this._showError(new Error("WebSocket connection failed"), session));
  }

  async _handleSignal(peer, message) {
    if (message.type === "webrtc/answer") {
      await peer.setRemoteDescription({ type: "answer", sdp: message.value });
    } else if (message.type === "webrtc/candidate" && message.value) {
      await peer.addIceCandidate({ candidate: message.value, sdpMid: "0" });
    } else if (message.type === "error") {
      throw new Error(message.value);
    }
  }

  _showError(error, session) {
    if (session !== this._session || !this.isConnected) return;
    console.error("Camera WebRTC error", error);
    this._status.textContent = "실시간 영상을 연결할 수 없습니다";
    this._status.hidden = false;
  }

  _disconnect() {
    this._session = (this._session ?? 0) + 1;
    this._socket?.close();
    this._peer?.close();
    this._stream?.getTracks().forEach((track) => track.stop());
    this._video.srcObject = null;
    this._socket = undefined;
    this._peer = undefined;
    this._stream = undefined;
    this._connecting = false;
  }
}

if (!customElements.get(PLAYER_TAG)) customElements.define(PLAYER_TAG, HaDesignCameraWebRtcPlayer);
