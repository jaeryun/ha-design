export const toggleCameraSwitch = (hass, entityId) => {
  const current = hass.states[entityId];
  if (!current || current.state === "unavailable") return;
  const service = current.state === "on" ? "turn_off" : "turn_on";
  hass.callService("switch", service, { entity_id: entityId });
};

export const changeCameraNumber = (hass, entityId, delta) => {
  const current = hass.states[entityId];
  if (!current || current.state === "unavailable") return;
  const minimum = Number(current.attributes?.min ?? 5);
  const maximum = Number(current.attributes?.max ?? 120);
  const value = Math.min(maximum, Math.max(minimum, Number(current.state) + delta));
  hass.callService("number", "set_value", { entity_id: entityId, value });
};

export const pressCameraButton = (hass, entityId) => {
  const current = hass.states[entityId];
  if (!current || current.state === "unavailable") return;
  hass.callService("button", "press", { entity_id: entityId });
};

export const selectCameraOption = (hass, entityId, option) => {
  const current = hass.states[entityId];
  if (!current || current.state === "unavailable") return;
  hass.callService("select", "select_option", {
    entity_id: entityId,
    option,
  });
};

export const downloadCameraSnapshot = (hass, entityId) => {
  const picture = hass.states[entityId]?.attributes?.entity_picture;
  if (!picture) return;
  Object.assign(document.createElement("a"), {
    href: hass.hassUrl(picture),
    download: `camera-${Date.now()}.jpg`,
  }).click();
};

export const configureCameraPlayer = (player, hass, entityId, fitMode = "cover") => {
  if (!player) return;
  const entityChanged = player.entityid !== entityId;
  player.entityid = entityId;
  player.posterUrl = hass.hassUrl(hass.states[entityId]?.attributes?.entity_picture);
  player.autoPlay = true;
  player.playsInline = true;
  player.controls = true;
  player.fitMode = fitMode;
  if (entityChanged) player.muted = true;
};
