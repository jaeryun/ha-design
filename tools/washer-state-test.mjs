import assert from "node:assert/strict";

import {
  buildWasherState,
  washerCommand,
} from "../www/ha-design/ha-design-washer-state.js";

const config = {
  control_entity: "select.washer",
  power_entity: "binary_sensor.washer_power",
  remote_control_entity: "binary_sensor.washer_remote",
  machine_state_entity: "sensor.washer_machine",
  job_state_entity: "sensor.washer_job",
  completion_time_entity: "sensor.washer_completion",
};

const state = (value, attributes = {}) => ({ state: value, attributes });
const hass = (overrides) => ({
  states: {
    "select.washer": state("stop", { options: ["stop", "run", "pause"] }),
    "binary_sensor.washer_power": state("on"),
    "binary_sensor.washer_remote": state("on"),
    "sensor.washer_machine": state("stop"),
    "sensor.washer_job": state("none"),
    "sensor.washer_completion": state("2026-08-30T10:30:00+00:00"),
    ...overrides,
  },
});

{
  // Given: the washer is actively drying with remote control enabled.
  const current = hass({
    "select.washer": state("run", { options: ["stop", "run", "pause"] }),
    "sensor.washer_machine": state("run"),
    "sensor.washer_job": state("drying"),
  });

  // When: the card derives its machine-consumed state.
  const result = buildWasherState(current, config);

  // Then: the drying phase and active controls are selected.
  assert.equal(result.phase, "drying");
  assert.equal(result.isActive, true);
  assert.equal(result.showCompletion, true);
  assert.equal(result.primaryAction, "pause");
}

{
  // Given: the washer is stopped and remote control is disabled.
  const current = hass({
    "binary_sensor.washer_remote": state("off"),
    "sensor.washer_machine": state("stop"),
    "sensor.washer_job": state("none"),
  });

  // When: stale completion data is interpreted.
  const result = buildWasherState(current, config);

  // Then: the stale timestamp is hidden and remote activation is required.
  assert.equal(result.showCompletion, false);
  assert.equal(result.canStart, false);
  assert.equal(result.primaryAction, "enable_remote");
}

{
  // Given: the washer is stopped with power and remote control enabled.
  const current = hass({});

  // When: the card derives the available action.
  const result = buildWasherState(current, config);

  // Then: the previously selected appliance cycle can be started.
  assert.equal(result.canStart, true);
  assert.equal(result.primaryAction, "start");
}

{
  // Given: the command entity is unavailable while every sensor looks ready.
  const unavailable = hass({
    "select.washer": state("unavailable"),
  });
  const missing = hass({});
  delete missing.states["select.washer"];

  // When: the two command-transport failures are derived.
  const unavailableResult = buildWasherState(unavailable, config);
  const missingResult = buildWasherState(missing, config);

  // Then: both fail closed.
  assert.equal(unavailableResult.canStart, false);
  assert.equal(unavailableResult.commandReady, false);
  assert.equal(missingResult.canStart, false);
  assert.equal(missingResult.commandReady, false);
}

{
  // Given: power and remote control are on but the machine is unavailable.
  const current = hass({
    "sensor.washer_machine": state("unavailable"),
    "sensor.washer_job": state("unavailable"),
    "sensor.washer_completion": state("unavailable"),
  });

  // When: the card derives the safety state.
  const result = buildWasherState(current, config);

  // Then: the card fails closed and hides the unavailable completion value.
  assert.equal(result.canStart, false);
  assert.equal(result.showCompletion, false);
}

{
  // Given: the configured machine-state entity is missing during reconnect.
  const current = hass({});
  delete current.states["sensor.washer_machine"];

  // When: the card derives the safety state.
  const result = buildWasherState(current, config);

  // Then: the missing state fails closed.
  assert.equal(result.canStart, false);
  assert.equal(result.phase, "status_check");
}

{
  // Given: the appliance is running but its job phase is unavailable.
  const current = hass({
    "sensor.washer_machine": state("run"),
    "sensor.washer_job": state("unavailable"),
  });

  // When: the phase is derived.
  const result = buildWasherState(current, config);

  // Then: a running appliance is never presented as idle.
  assert.equal(result.phase, "status_check");
  assert.equal(result.isActive, true);
}

{
  // Given: the washer is running but the completion timestamp is unavailable.
  const current = hass({
    "sensor.washer_machine": state("run"),
    "sensor.washer_job": state("wash"),
    "sensor.washer_completion": state("unavailable"),
  });

  // When: the active state is derived.
  const result = buildWasherState(current, config);

  // Then: no unavailable completion value is presented as a real time.
  assert.equal(result.showCompletion, false);
}

{
  // Given: a card action selected by the user.
  // When: it is converted to the SmartThings select command.
  const pause = washerCommand("pause", config);
  const stop = washerCommand("stop", config);

  // Then: each action targets the configured entity and exact option.
  assert.deepEqual(pause, {
    domain: "select",
    service: "select_option",
    data: { entity_id: "select.washer", option: "pause" },
  });
  assert.deepEqual(stop, {
    domain: "select",
    service: "select_option",
    data: { entity_id: "select.washer", option: "stop" },
  });
}

console.log("PASS washer state contract");
