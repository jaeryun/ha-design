import assert from "node:assert/strict";

import { CurtainPositionMotion } from "../www/ha-design/ha-design-curtain-motion.js";

const createScheduler = () => {
  let nextId = 1;
  const callbacks = new Map();
  return {
    requestFrame(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      callbacks.delete(id);
    },
    advance(timestamp) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(timestamp));
    },
  };
};

const scheduler = createScheduler();
const positions = [];
const motion = new CurtainPositionMotion({
  onPosition: (position, direction) => positions.push({ position, direction }),
  requestFrame: scheduler.requestFrame,
  cancelFrame: scheduler.cancelFrame,
});

motion.start(0, 100, 1);
scheduler.advance(0);
scheduler.advance(250);
assert.equal(Math.round(motion.displayedPosition), 25);
assert.equal(motion.direction, "opening");
assert.equal(motion.reconcile(0), false, "stale start position cancelled the motion");

scheduler.advance(500);
assert.equal(Math.round(motion.displayedPosition), 50);
assert.equal(motion.reconcile(36), true, "authoritative intermediate position was ignored");
assert.equal(motion.displayedPosition, null);

motion.start(100, 0, 1);
scheduler.advance(1000);
scheduler.advance(1250);
assert.equal(Math.round(motion.displayedPosition), 75);
assert.equal(motion.direction, "closing");
const stoppedPosition = motion.stop();
scheduler.advance(1500);
assert.equal(Math.round(stoppedPosition), 75);
assert.equal(Math.round(motion.displayedPosition), 75, "stop did not freeze the estimate");
assert.equal(motion.reconcile(100), false, "stale position replaced the frozen estimate");
assert.equal(motion.reconcile(72), true, "stopped position did not reconcile to HA");

motion.start(50, 100, 2);
assert.equal(motion._duration, 1000, "partial travel duration was not proportional");
motion.clear();

assert.ok(
  positions.some(({ position }) => position > 0 && position < 100),
  "motion never published an intermediate position",
);

console.log("PASS curtain live position motion");
