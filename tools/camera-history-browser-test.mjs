import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PLAYWRIGHT_MODULE ?? `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`;
const { chromium } = await import(pathToFileURL(modulePath));
const root = resolve(new URL('..', import.meta.url).pathname), out = process.env.CAMERA_QA_OUTPUT ?? '/tmp/ha-design-production-camera-history';
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  const path = resolve(root, `.${new URL(req.url, 'http://localhost').pathname}`);
  if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' })[extname(path)] ?? 'application/octet-stream'); res.end(await readFile(path)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const evidence = [], errors = [];
const signal = (page, name) => page.evaluate(name => { window.pendingSignal = window.qa.signal(window.qa.card, name); }, name);
const awaitSignal = page => page.evaluate(async () => { await window.pendingSignal; });
const day = async (page, date) => {
  await signal(page, 'camera-day-loaded');
  await page.locator(`[data-event-date="${date}"]`).click();
  await awaitSignal(page);
};
const screenshot = (page, width, state) => page.locator('dialog').screenshot({ path: `${out}/${width}-${state}.png` });
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'America/Los_Angeles' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    await page.goto(`${origin}/tools/camera-history-browser-test.html`);
    await page.evaluate(async () => {
      await window.qaReady;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { observer.disconnect(); reject(new Error('layout signal timeout')); }, 5000);
        const observer = new ResizeObserver(() => { clearTimeout(timer); observer.disconnect(); resolve(); });
        observer.observe(window.qa.card.shadowRoot.querySelector('.timeline-plot'));
      });
    });
    const measures = await page.evaluate(() => {
      const root = window.qa.card.shadowRoot, rect = selector => root.querySelector(selector).getBoundingClientRect();
      const axis = rect('.timeline-axis'), plot = rect('.timeline-plot'), event = rect('.event-lane'), coverage = rect('.coverage-lane');
      const visible = node => getComputedStyle(node).display !== 'none';
      return {
        days: root.querySelectorAll('[data-event-date]').length,
        selected: window.qa.card._eventController.state.selectedDate,
        sliders: root.querySelectorAll('[role="slider"]').length,
        axes: root.querySelectorAll('.timeline-axis').length,
        eventGap: coverage.top - event.bottom, plotWidth: plot.width,
        leftAlignment: axis.left - plot.left, rightAlignment: axis.right - plot.right,
        axis: [...root.querySelectorAll('.timeline-axis span')].filter(visible).map(n => Number(n.dataset.hour)),
        guides: [...root.querySelectorAll('.timeline-guide')].filter(visible).map(n => Number(n.dataset.hour)),
        guideErrors: [...root.querySelectorAll('.timeline-guide')].filter(visible).flatMap(n => {
          const label = [...root.querySelectorAll('.timeline-axis span')].find(a => a.dataset.hour === n.dataset.hour);
          if (!label) return [];
          const guide = n.getBoundingClientRect(), box = label.getBoundingClientRect();
          return [(guide.left + guide.right - box.left - box.right) / 2];
        }),
        overflow: document.documentElement.scrollWidth > innerWidth || root.querySelector('dialog').scrollWidth > root.querySelector('dialog').clientWidth,
        playheads: root.querySelectorAll('.playhead').length,
        futureImage: getComputedStyle(root.querySelector('.coverage-segment.future')).backgroundImage,
        eventButtons: root.querySelectorAll('[data-activity-timeline] button').length,
        square: [...root.querySelectorAll('.coverage-segment')].every(n => getComputedStyle(n).borderRadius === '0px'),
      };
    });
    assert.equal(measures.days, 7); assert.equal(measures.selected, '2026-09-06');
    assert.equal(measures.sliders, 1); assert.equal(measures.axes, 1); assert.equal(measures.playheads, 1);
    assert.equal(measures.eventGap, 4); assert.equal(measures.leftAlignment, 0); assert.equal(measures.rightAlignment, 0);
    assert.deepEqual(measures.axis, width === 375 ? [0,6,12,18,24] : [0,4,8,12,16,20,24]);
    assert.deepEqual(measures.guides, width === 375 ? [0,6,12] : [0,4,8,12]);
    assert.ok(measures.guideErrors.every(x => Math.abs(x) < 1)); assert.equal(measures.overflow, false);
    // "지금" 라벨과 겹치는 시간 눈금 라벨은 감춘다.
    await page.evaluate(() => window.qa.setClock('2026-09-06T07:10:00Z'));
    const nearTick = await page.evaluate(() => {
      const root = window.qa.card.shadowRoot, visible = n => n.offsetParent !== null;
      const labels = [...root.querySelectorAll('.timeline-axis span')].filter(visible);
      const now = root.querySelector('.now-boundary i');
      const centre = n => { const r = n.getBoundingClientRect(); return (r.left + r.right) / 2; };
      return {
        hours: labels.map(n => Number(n.dataset.hour)),
        gap: now && labels.length ? Math.min(...labels.map(n => Math.abs(centre(n) - centre(now)))) : null,
      };
    });
    assert.ok(!nearTick.hours.includes(16), `16시 눈금 라벨은 지금 라벨과 겹치므로 감춘다: ${nearTick.hours}`);
    assert.ok(nearTick.gap === null || nearTick.gap >= 16, `지금 라벨과 눈금 라벨 간격이 너무 좁다: ${nearTick.gap}`);
    await page.evaluate(() => window.qa.setClock('2026-09-06T05:30:00Z'));
    assert.equal(measures.futureImage, 'none'); assert.equal(measures.eventButtons, 0); assert.equal(measures.square, true);
    await day(page, '2026-09-05');
    const dragPlot = await page.locator('.timeline-plot').boundingBox();
    const dragY = dragPlot.y + 38, dragX = hour => dragPlot.x + dragPlot.width * hour / 24;
    await page.mouse.move(dragX(9), dragY); await signal(page, 'camera-recording-seeked'); await page.mouse.down(); await awaitSignal(page);
    const signsAtDown = await page.evaluate(() => window.qa.calls.filter(m => m.type === 'auth/sign_path').length);
    const playheadAtDown = await page.locator('.playhead').evaluate(n => n.style.insetInlineStart);
    await page.mouse.move(dragX(12), dragY, { steps: 4 });
    await page.mouse.move(dragX(15), dragY, { steps: 4 });
    // 아직 재생 중인 이전 구간의 timeupdate가 드래그 미리보기를 덮어쓰면 안 된다.
    await page.evaluate(() => {
      const root = window.qa.card.shadowRoot;
      const player = root.querySelector('.activity-recording-video');
      const video = player && (player.tagName === 'VIDEO' ? player : player.shadowRoot?.querySelector('video'));
      video?.dispatchEvent(new Event('timeupdate'));
    });
    const previewAfterTimeupdate = await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start);
    assert.ok(Math.abs(previewAfterTimeupdate - 54000) < 1, 'media timeupdate must not move the drag preview');
    const preview = await page.evaluate(() => {
      const root = window.qa.card.shadowRoot, state = window.qa.card._eventController.state;
      return { time: state.selectedTime - state.day.start, label: root.querySelector('.selected-time').textContent,
        aria: root.querySelector('[role="slider"]').getAttribute('aria-valuetext'),
        value: Number(root.querySelector('[role="slider"]').getAttribute('aria-valuenow')),
        playhead: root.querySelector('.playhead').style.insetInlineStart,
        signs: window.qa.calls.filter(m => m.type === 'auth/sign_path').length };
    });
    assert.ok(Math.abs(preview.time - 54000) < 1);
    assert.equal(preview.value, 54000); assert.equal(preview.aria, preview.label);
    assert.notEqual(preview.playhead, playheadAtDown); assert.equal(preview.signs, signsAtDown, 'drag preview must not load media');
    await signal(page, 'camera-recording-seeked'); await page.mouse.up(); await awaitSignal(page);
    assert.equal(await page.evaluate(() => window.qa.calls.filter(m => m.type === 'auth/sign_path').length), signsAtDown + 2, 'pointerup loads exactly one master/child pair');
    assert.ok(Math.abs(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start) - 54000) < 1);
    await day(page, '2026-09-06');
    // Real pointer input on an arbitrary timestamp, inside a VOD hour with a gap.
    let plot = await page.locator('.timeline-plot').boundingBox();
    await signal(page, 'camera-recording-seeked');
    await page.mouse.click(plot.x + plot.width * 9.5 / 24, plot.y + 38);
    await awaitSignal(page);
    const playback = await page.evaluate(() => {
      const state = window.qa.card._eventController.state, player = window.qa.card.shadowRoot.querySelector('ha-hls-player');
      return { absolute: state.selectedTime - state.day.start, offset: player.shadowRoot.querySelector('video').currentTime,
        range: state.recording.endEpoch - state.recording.startEpoch,
        signs: window.qa.calls.filter(m => m.type === 'auth/sign_path').slice(-2).map(m => m.path) };
    });
    assert.ok(Math.abs(playback.absolute - 34200) < 1);
    assert.ok(Math.abs(playback.offset - 1500) < 1, `absolute offset over gaps: ${JSON.stringify(playback)}`);
    assert.equal(playback.range, 3600);
    assert.match(playback.signs[0], /master\.m3u8$/); assert.match(playback.signs[1], /index-v1-a1\.m3u8$/);
    await screenshot(page, width, 'recorded');
    const playerTime = await page.evaluate(() => {
      const controller = window.qa.card._eventController, player = window.qa.card.shadowRoot.querySelector('ha-hls-player');
      const changed = window.qa.signal(player.shadowRoot.querySelector('video'), 'timeupdate').then(() => controller.state.selectedTime - controller.state.day.start);
      player.shadowRoot.querySelector('video').currentTime = 1200;
      return changed;
    });
    assert.equal(playerTime, 33900, 'native controls map media offset back over gap');
    const reload = await page.evaluate(async () => {
      const controller = window.qa.card._eventController;
      const player = window.qa.card.shadowRoot.querySelector('ha-hls-player');
      const video = player.shadowRoot.querySelector('video');
      const ready = Object.getOwnPropertyDescriptor(video, 'readyState'), duration = Object.getOwnPropertyDescriptor(video, 'duration');
      const before = controller.state.selectedTime;
      const resetTime = window.qa.signal(video, 'timeupdate');
      video.currentTime = 0;
      Object.defineProperties(video, { readyState: { configurable: true, value: 0 }, duration: { configurable: true, value: NaN } });
      video.dispatchEvent(new Event('emptied')); video.dispatchEvent(new Event('loadstart'));
      await resetTime;
      const afterReset = controller.state.selectedTime;
      Object.defineProperty(video, 'readyState', { configurable: true, value: 1 });
      video.dispatchEvent(new Event('loadedmetadata'));
      const beforeDuration = video.currentTime;
      const restored = window.qa.signal(video, 'timeupdate');
      Object.defineProperties(video, { readyState: ready, duration });
      video.dispatchEvent(new Event('durationchange')); video.dispatchEvent(new Event('loadeddata'));
      await restored;
      return { before, afterReset, beforeDuration, after: controller.state.selectedTime, offset: video.currentTime, sameNode: player.shadowRoot.querySelector('video') === video };
    });
    assert.equal(reload.afterReset, reload.before); assert.equal(reload.beforeDuration, 0);
    assert.equal(reload.after, reload.before); assert.equal(reload.offset, 1200); assert.equal(reload.sameNode, true);
    // Tapo 감지 marker는 같은 절대 시간축 위의 점이며, 선택은 원래 감지 시각을 유지한다.
    const pointCount = await page.locator('.event-marker').count();
    assert.equal(pointCount, 2, `today exposes two point markers: ${pointCount}`);
    const personPoint = await page.evaluate(() => {
      const marker = [...window.qa.card.shadowRoot.querySelectorAll('.event-marker')].at(-1);
      const box = marker.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
    await signal(page, 'camera-recording-seeked');
    await page.mouse.click(personPoint.x, personPoint.y);
    await awaitSignal(page);
    const selectedEvent = await page.evaluate(() => {
      const state = window.qa.card._eventController.state;
      return { id: state.selectedEvent?.id, label: state.selectedEvent?.label, event: state.selectedEvent?.time, time: state.selectedTime, day: state.day.start };
    });
    assert.equal(selectedEvent.label, '사람', JSON.stringify(selectedEvent));
    assert.ok(Math.abs(selectedEvent.event - (selectedEvent.day + 9.05 * 3600)) < 1, 'point marker selects its real detection time');
    assert.ok(Math.abs(selectedEvent.time - selectedEvent.event) < 1, 'covered detection keeps playback on the detection time');
    assert.equal(await page.locator('.event-marker.selected-event').count(), 1);
    assert.equal(await page.locator('.context-event').count(), 1);
    assert.match(await page.locator('.context-event').textContent(), /녹화 있음/);
    await screenshot(page, width, 'event');
    await page.locator('[data-action="download-open"]').click();
    const downloadDialog = page.locator('.camera-download-dialog');
    assert.equal(await downloadDialog.evaluate(node => node.open), true);
    const startField = page.locator('[data-download-field="start"]'), endField = page.locator('[data-download-field="end"]');
    assert.ok((await startField.inputValue()).startsWith('2026-09-06T09:03'), 'selected event seeds the start in HA timezone, not browser timezone');
    assert.ok((await endField.inputValue()).startsWith('2026-09-06T09:04'));
    const trimReady = () => page.waitForFunction(() => {
      const p = window.qa.card._downloadController.state.preview;
      return p.status === 'ready' && Math.abs(p.shownTime - p.target) < 0.15;
    }, null, { timeout: 5000 });
    await trimReady();
    assert.equal(await startField.isVisible(), false, 'time entry is secondary to visual trimming');
    const trimBefore = await page.evaluate(() => ({ ...window.qa.card._downloadController.state.editor }));
    const trimSigns = await page.evaluate(() => window.qa.calls.filter(call => call.type === 'auth/sign_path').length);
    const trimStep = (trimBefore.end - trimBefore.start) / 4;
    for (const [edge, target] of [['start', trimBefore.start + trimStep], ['end', trimBefore.end - trimStep]]) {
      const handle = await page.locator(`[data-trim-handle="${edge}"]`).boundingBox();
      const track = await page.locator('[data-trim-track]').boundingBox();
      const viewport = await page.evaluate(() => window.qa.card._downloadController.state.editor.viewport);
      const x = track.x + track.width * (target - viewport.start) / (viewport.end - viewport.start);
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(x, handle.y + handle.height / 2, { steps: 4 });
      await trimReady();
      const during = await page.evaluate(() => {
        const d = window.qa.card._downloadController;
        return { held: !!d.drag, start: d.state.editor.start, end: d.state.editor.end, frame: d.state.preview.shownTime };
      });
      assert.equal(during.held, true, 'the displayed frame must update before releasing the handle');
      assert.ok(Math.abs(during[edge] - target) <= 2);
      assert.ok(Math.abs(during.frame - (edge === 'end' ? during.end - 0.05 : during.start)) < 0.15);
      await page.mouse.up(); await trimReady();
    }
    assert.equal(await page.evaluate(() => window.qa.calls.filter(call => call.type === 'auth/sign_path').length), trimSigns, 'dragging within a loaded hour reuses its HLS manifests');
    const zoomBefore = await page.evaluate(() => window.qa.card._downloadController.state.editor.viewport.end - window.qa.card._downloadController.state.editor.viewport.start);
    await page.locator('[data-action="trim-zoom-in"]').click();
    assert.equal(await page.evaluate(() => window.qa.card._downloadController.state.editor.viewport.end - window.qa.card._downloadController.state.editor.viewport.start), zoomBefore / 2);
    await page.locator('[data-action="trim-fit"]').click();
    await page.locator('[data-action="trim-play"]').click(); await trimReady();
    assert.equal(await page.evaluate(() => window.qa.card._downloadController.preview.binding.video.paused), false);
    await page.evaluate(() => {
      const d = window.qa.card._downloadController, recording = d.preview.recording;
      let offset = 0;
      for (const segment of recording.segments) {
        if (d.state.editor.end >= segment.start && d.state.editor.end < segment.end) { offset += d.state.editor.end - segment.start + 1; break; }
        offset += segment.duration;
      }
      d.preview.binding.video.currentTime = offset;
    });
    await page.waitForFunction(() => !window.qa.card._downloadController.state.preview.playing);
    await trimReady();
    await downloadDialog.screenshot({ path: `${out}/${width}-visual-trim.png` });
    await page.locator('[data-action="trim-manual"]').click();
    await startField.fill('2026-09-06T08:30'); await endField.fill('2026-09-06T09:30');
    await page.locator('[data-action="trim-focus-start"]').click();
    await page.waitForFunction(() => window.qa.card._downloadController.state.preview.status === 'gap');
    assert.equal(await page.evaluate(() => window.qa.card._downloadController.state.preview.shownTime), null, 'missing footage cannot retain a misleading old preview frame');
    await startField.fill('2026-09-06T09:00'); await endField.fill('2026-09-06T09:30');
    const editedStart = await startField.inputValue();
    await page.evaluate(() => { window.qa.card._eventController.playbackTime(10); window.qa.card.hass = window.qa.hass; });
    assert.equal(await startField.inputValue(), editedStart, 'video and HA updates preserve edited date fields');
    await signal(page, 'camera-download-prepared');
    await page.locator('[data-action="download-prepare"]').click(); await awaitSignal(page);
    assert.equal(await page.evaluate(() => window.qa.card._downloadController.state.coverage.missingSeconds), 300);
    assert.equal(await page.locator('.download-gap').count(), 1);
    assert.equal(await page.locator('.download-save').getAttribute('download'), '거실 카메라_2026-09-06_090000-093000.mp4');
    assert.equal(await downloadDialog.evaluate(node => node.scrollWidth > node.clientWidth), false);
    await downloadDialog.screenshot({ path: `${out}/${width}-download.png` });
    await endField.fill('2026-09-06T08:00');
    assert.equal(await page.locator('.download-save').count(), 0, 'an edited range must lose its previous download link');
    await signal(page, 'camera-download-prepared');
    await page.locator('[data-action="download-prepare"]').click(); await awaitSignal(page);
    assert.equal(await page.locator('.download-error[role="alert"]').count(), 1);
    await page.locator('[data-action="download-close"]').press('Escape');
    assert.equal(await page.locator('.camera-download-dialog').count(), 0);
    assert.equal(await page.locator('dialog').evaluate(node => node.open), true, 'Escape closes only the nested download dialog');
    assert.equal(await page.locator('[data-action="download-open"]').evaluate(node => node.getRootNode().activeElement === node), true);
    plot = await page.locator('.timeline-plot').boundingBox();
    // 공백을 눌러도 "녹화 없음"을 보여주지 않고 가장 가까운 녹화로 붙는다(짧은 녹화도 잡힌다).
    await signal(page, 'camera-recording-loaded');
    await page.mouse.click(plot.x + plot.width * 8.5 / 24, plot.y + 38);
    await awaitSignal(page);
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start), 32400, '공백 중앙은 더 가까운 녹화 시작으로 붙는다');
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'recorded');
    assert.equal(await page.locator('[data-action="previous-recording"]').isEnabled(), true);
    assert.equal(await page.locator('[data-action="next-recording"]').isEnabled(), true);
    await screenshot(page, width, 'gap-snapped');
    await signal(page, 'camera-recording-seeked');
    await page.locator('[data-action="next-recording"]').click(); await awaitSignal(page);
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start), 33600);
    await page.locator('[role="slider"]').press('End');
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime), Date.parse('2026-09-06T05:30:00Z') / 1000 - 1);
    plot = await page.locator('.timeline-plot').boundingBox();
    await page.mouse.click(plot.x + plot.width * 22 / 24, plot.y + 38);
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime), Date.parse('2026-09-06T05:30:00Z') / 1000 - 1);
    await screenshot(page, width, 'future-clamp');
    await page.locator('[role="slider"]').press('Home');
    await page.locator('[role="slider"]').press('ArrowRight');
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start), 60);
    await page.evaluate(() => window.qa.setClock('2026-09-06T05:31:00Z'));
    await signal(page, 'camera-recording-loaded');
    plot = await page.locator('.timeline-plot').boundingBox();
    await page.mouse.click(plot.x + plot.width * (14.5 + 1/120) / 24, plot.y + 38);
    await awaitSignal(page);
    await page.waitForFunction(() => {
      const state = window.qa.card._eventController.state;
      return state.recording.status === 'ready' && state.selectedTime - state.day.start === 52199;
    });
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'recorded', '미확인 구간 클릭도 마지막 녹화로 붙는다');
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start), 52199);
    assert.equal(await page.locator('.coverage-segment.future').getAttribute('data-start'), String(Date.parse('2026-09-06T05:31:00Z') / 1000));
    await screenshot(page, width, 'unverified-since-query');
    await page.evaluate(() => window.qa.setClock('2026-09-06T05:30:00Z'));
    await day(page, '2026-09-02');
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'empty');
    assert.equal(await page.locator('.coverage-segment.recorded').count(), 0);
    assert.equal(await page.locator('[data-action="download-open"]').isDisabled(), true);
    await screenshot(page, width, 'empty');
    await day(page, '2026-09-04');
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'error');
    assert.equal(await page.locator('.coverage-segment.error').count(), 1);
    await screenshot(page, width, 'error');
    await page.evaluate(() => window.qa.setMode('unknown'));
    await day(page, '2026-09-03');
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'unknown');
    assert.equal(await page.locator('.coverage-segment.unknown').count(), 1);
    await screenshot(page, width, 'unknown');
    await page.evaluate(() => window.qa.setMode('loading'));
    await signal(page, 'camera-day-loaded');
    await page.locator('[data-event-date="2026-09-05"]').click();
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'loading');
    await screenshot(page, width, 'loading');
    const pendingIntents = [];
    for (const input of ['pointer', 'keyboard']) {
      if (input === 'keyboard') {
        await signal(page, 'camera-day-loaded');
        await page.locator('[data-event-date="2026-09-03"]').click();
      }
      if (input === 'pointer') {
        const pendingPlot = await page.locator('.timeline-plot').boundingBox();
        await page.mouse.click(pendingPlot.x + pendingPlot.width / 2, pendingPlot.y + 38);
      } else await page.locator('[data-activity-timeline]').press('ArrowRight');
      const before = await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start);
      assert.ok(Math.abs(before - (input === 'pointer' ? 43200 : 43260)) < 1);
      await page.evaluate(() => { window.resumeSeek = window.qa.signal(window.qa.card, 'camera-recording-seeked'); window.qa.release(); });
      await awaitSignal(page);
      await page.evaluate(async () => { await window.resumeSeek; });
      const result = await page.evaluate(() => {
        const state = window.qa.card._eventController.state;
        return { selectedAfter: state.selectedTime - state.day.start, playbackOffset: window.qa.card.shadowRoot.querySelector('ha-hls-player').shadowRoot.querySelector('video').currentTime,
          vodStart: state.recording.startEpoch - state.day.start };
      });
      const intent = { input, selectedBefore: before, ...result };
      console.log(JSON.stringify({ width, case: 'real input during pending day query', ...intent }));
      assert.ok(Math.abs(result.selectedAfter - before) < 0.01, `coverage overwrote input: ${JSON.stringify(intent)}`);
      assert.equal(result.vodStart, 43200);
      assert.ok(Math.abs(result.playbackOffset - (before - 43200)) < 0.01);
      pendingIntents.push(intent);
    }
    await page.evaluate(() => window.qa.setMode('ready'));
    // 감지 이력 조회가 실패해도 이미 확인된 녹화는 그대로 남고 재시도를 제공한다.
    await page.evaluate(() => window.qa.setEventMode('error'));
    await day(page, '2026-09-05');
    assert.equal(await page.locator('.event-marker').count(), 0);
    assert.equal(await page.locator('.event-status [data-action="events-retry"]').count(), 1);
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'recorded');
    await screenshot(page, width, 'event-error');
    await page.evaluate(() => window.qa.setEventMode('ready'));
    await signal(page, 'camera-events-loaded');
    await page.locator('[data-action="events-retry"]').click();
    await awaitSignal(page);
    assert.equal(await page.locator('.event-marker').count(), 6, 'retry restores the point markers');
    // 감지가 없는 날짜도 녹화 coverage를 바꾸지 않는다.
    await page.evaluate(() => window.qa.setEventMode('empty'));
    await day(page, '2026-09-03');
    assert.equal(await page.locator('.event-marker').count(), 0);
    assert.match(await page.locator('.event-status').textContent(), /감지 기록이 없어요/);
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'recorded');
    await screenshot(page, width, 'event-empty');
    // 감지 이력만 늦게 도착해도 녹화 coverage와 요약은 먼저 표시된다.
    await page.evaluate(() => window.qa.setEventMode('loading'));
    await signal(page, 'camera-day-loaded');
    await page.locator('[data-event-date="2026-09-05"]').click();
    await page.waitForFunction(() => /불러오는 중/.test(window.qa.card.shadowRoot.querySelector('.event-status')?.textContent ?? ''));
    assert.equal(await page.locator('.event-marker').count(), 0);
    assert.ok(await page.locator('.coverage-segment.recorded').count() > 0, 'recording coverage renders while detection history is pending');
    await page.evaluate(() => window.qa.releaseEvents());
    await awaitSignal(page);
    await page.evaluate(() => window.qa.setEventMode('ready'));
    assert.equal(await page.locator('.event-marker').count(), 6, 'late detection history fills the same lane');
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'recorded');
    // 설정한 감지별 필터는 marker만 좁히고 전체는 원래 개수로 되돌린다.
    const personFilter = '[data-event-filter="binary_sensor.test_person_detection"]';
    await page.locator(personFilter).click();
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.eventFilter), 'binary_sensor.test_person_detection');
    assert.equal(await page.locator(`${personFilter}[aria-pressed="true"]`).count(), 1);
    assert.equal(await page.locator('[data-event-filter=""]').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.event-marker').count(), 1);
    await page.locator('[data-event-filter=""]').click();
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.eventFilter), null);
    assert.equal(await page.locator('.event-marker').count(), 6);
    // 감지 시각에 영상이 없으면 원래 감지 시각을 유지한 채 가까운 녹화로 이동한다.
    const gapPoint = await page.evaluate(() => {
      const markers = [...window.qa.card.shadowRoot.querySelectorAll('.event-marker')];
      const target = 8.5 / 24 * 100;
      const marker = markers.reduce((best, node) => Math.abs(parseFloat(node.style.insetInlineStart) - target) < Math.abs(parseFloat(best.style.insetInlineStart) - target) ? node : best, markers[0]);
      const box = marker.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    });
    await signal(page, 'camera-recording-seeked');
    await page.mouse.click(gapPoint.x, gapPoint.y);
    await awaitSignal(page);
    const snapped = await page.evaluate(() => {
      const state = window.qa.card._eventController.state;
      return { event: state.selectedEvent?.time, label: state.selectedEvent?.label, time: state.selectedTime, day: state.day.start };
    });
    assert.equal(snapped.label, '움직임');
    assert.ok(Math.abs(snapped.event - (snapped.day + 8.5 * 3600)) < 1, 'selectedEvent keeps the original detection time');
    assert.notEqual(snapped.time, snapped.event, 'playback snaps to a nearby recording');
    assert.match(await page.locator('.context-event').textContent(), /녹화 없음/);
    assert.equal(await page.locator('.context-event-note').count(), 1);
    await screenshot(page, width, 'event-snapped');
    // 설정한 sensor 하나를 확인할 수 없어도 이미 조회한 이력은 숨기지 않는다.
    await page.evaluate(() => window.qa.setSourceUnavailable('binary_sensor.test_baby_cry_detection', true));
    await day(page, '2026-09-05');
    assert.equal(await page.locator('.unavailable-event-sources').count(), 1);
    assert.match(await page.locator('.unavailable-event-sources').textContent(), /아기 울음/);
    assert.equal(await page.locator('.event-marker').count(), 6, 'unavailable source does not hide historical events');
    await page.locator('[role="slider"]').press('Escape');
    assert.equal(await page.locator('[data-view="camera"]').count(), 1);
    await page.locator('[data-action="live-view"]').press('Escape');
    assert.equal(await page.locator('dialog').evaluate(n => n.open), false);
    evidence.push({ width, ...measures, playback, selectedEvent, snapped, pointCount, pendingIntents, reload });
    await context.close();
    for (const native of [false, true]) {
      const interaction = await browser.newPage({ viewport: { width, height: 900 }, timezoneId: 'Asia/Seoul' });
      interaction.on('pageerror', error => errors.push(`interaction ${width}/${native}: ${error.message}`));
      await interaction.goto(`${origin}/tools/camera-interaction-test.html${native ? '?native-hls' : ''}`);
      const result = await interaction.evaluate(async () => {
        if (document.body.dataset.result === 'pending') await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('interaction completion timeout')), 10000);
          window.addEventListener('camera-test-complete', () => { clearTimeout(timeout); resolve(); }, { once: true });
        });
        return { result: document.body.dataset.result, output: document.querySelector('#result').textContent };
      });
      assert.equal(result.result, 'pass', `${width}/${native}: ${result.output}`);
      evidence.push({ width, native, interaction: result.result });
      await interaction.close();
    }
  }
  const offlineContext = await browser.newContext({ viewport: { width: 768, height: 900 }, timezoneId: 'America/Los_Angeles' });
  const offlinePage = await offlineContext.newPage();
  offlinePage.on('pageerror', error => errors.push(`offline: ${error.message}`));
  await offlinePage.goto(`${origin}/tools/camera-history-browser-test.html?unavailable-config`);
  await offlinePage.evaluate(() => window.qaReady);
  const offline = await offlinePage.evaluate(() => ({
    summary: window.qa.calls.filter(m => m.type === 'frigate/recordings/summary').length,
    day: window.qa.calls.filter(m => m.type === 'frigate/recordings/get').length,
    status: window.qa.card._eventController.state.coverageStatus,
    recorded: window.qa.card.shadowRoot.querySelectorAll('.coverage-segment.recorded').length,
    player: !!window.qa.card.shadowRoot.querySelector('ha-hls-player.activity-recording-video'),
    live: !!window.qa.card.shadowRoot.querySelector('ha-design-camera-webrtc-player'),
    events: window.qa.card.shadowRoot.querySelector('.event-status')?.textContent ?? '',
    eventMarkers: window.qa.card.shadowRoot.querySelectorAll('.event-marker').length,
  }));
  assert.ok(offline.summary > 0 && offline.day > 0, JSON.stringify(offline));
  assert.equal(offline.status, 'ready'); assert.ok(offline.recorded > 0); assert.equal(offline.player, true);
  assert.equal(offline.live, false);
  assert.match(offline.events, /설정되지 않아/); assert.equal(offline.eventMarkers, 0);
  evidence.push({ unavailableConfig: offline });
  await offlineContext.close();
  assert.deepEqual(errors, []);
  await writeFile(`${out}/measurements.json`, JSON.stringify({ status: 'PASS', evidence, errors }, null, 2));
  console.log(`PASS camera browser QA at 375/768/1280, HA/native HLS, states and interaction; evidence: ${out}`);
} catch (error) {
  await writeFile(`${out}/failure.json`, JSON.stringify({ error: error.stack, evidence, errors }, null, 2));
  throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
