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
        guideErrors: [...root.querySelectorAll('.timeline-guide')].filter(visible).map(n => {
          const guide = n.getBoundingClientRect(), label = [...root.querySelectorAll('.timeline-axis span')].find(a => a.dataset.hour === n.dataset.hour).getBoundingClientRect();
          return (guide.left + guide.right - label.left - label.right) / 2;
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
    assert.equal(measures.futureImage, 'none'); assert.equal(measures.eventButtons, 0); assert.equal(measures.square, true);
    // Real pointer input on an arbitrary timestamp, inside a VOD hour with a gap.
    const plot = await page.locator('.timeline-plot').boundingBox();
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
    // Clicking a teal cluster selects its actual detection moment and kind totals.
    const cluster = page.locator('.visual-cluster').first();
    assert.ok(await cluster.count());
    const clusterBox = await cluster.boundingBox();
    await signal(page, 'camera-recording-seeked');
    await page.mouse.click(clusterBox.x + clusterBox.width / 2, clusterBox.y + clusterBox.height / 2);
    await awaitSignal(page);
    const selectedCount = await page.evaluate(() => window.qa.card._eventController.state.selectedEvents.length);
    assert.ok(selectedCount > 1);
    assert.ok(await page.locator('.timeline-context').count());
    await screenshot(page, width, 'cluster');
    // Coverage pointer seeks to an exact known gap without requesting a clip.
    await page.mouse.click(plot.x + plot.width * 8.5 / 24, plot.y + 38);
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'gap');
    assert.equal(await page.locator('[data-action="previous-recording"]').isEnabled(), true);
    assert.equal(await page.locator('[data-action="next-recording"]').isEnabled(), true);
    await screenshot(page, width, 'gap');
    await signal(page, 'camera-recording-seeked');
    await page.locator('[data-action="next-recording"]').click(); await awaitSignal(page);
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start), 32400);
    await page.locator('[role="slider"]').press('End');
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime), Date.parse('2026-09-06T05:30:00Z') / 1000);
    await page.mouse.click(plot.x + plot.width * 22 / 24, plot.y + 38);
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime), Date.parse('2026-09-06T05:30:00Z') / 1000);
    await screenshot(page, width, 'future-clamp');
    await page.locator('[role="slider"]').press('Home');
    await page.locator('[role="slider"]').press('ArrowRight');
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.selectedTime - window.qa.card._eventController.state.day.start), 60);
    await page.evaluate(() => window.qa.setClock('2026-09-06T05:31:00Z'));
    await page.mouse.click(plot.x + plot.width * (14.5 + 1/120) / 24, plot.y + 38);
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'unknown');
    assert.equal(await page.locator('.coverage-segment.future').getAttribute('data-start'), String(Date.parse('2026-09-06T05:31:00Z') / 1000));
    assert.equal(await page.locator('[data-action="history-retry"]').count(), 1);
    await screenshot(page, width, 'unknown-since-query');
    await page.evaluate(() => window.qa.setClock('2026-09-06T05:30:00Z'));
    await day(page, '2026-09-02');
    assert.equal(await page.locator('.history-media').getAttribute('data-state'), 'empty');
    assert.equal(await page.locator('.coverage-segment.recorded').count(), 0);
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
      if (input === 'pointer') await page.mouse.click(plot.x + plot.width / 2, plot.y + 38);
      else await page.locator('[role="slider"]').press('ArrowRight');
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
    // Event failure must not turn real recordings into unknown or empty coverage.
    await page.evaluate(() => window.qa.setMode('events-error'));
    await page.locator('[data-action="camera-view"]').click();
    await signal(page, 'camera-day-loaded');
    await page.locator('[data-action="events"]').click(); await awaitSignal(page);
    assert.ok(await page.locator('.coverage-segment.recorded').count());
    assert.equal(await page.evaluate(() => window.qa.card._eventController.state.status), 'error');
    await page.locator('[role="slider"]').press('Escape');
    assert.equal(await page.locator('[data-view="camera"]').count(), 1);
    await page.locator('[data-action="events"]').press('Escape');
    assert.equal(await page.locator('dialog').evaluate(n => n.open), false);
    evidence.push({ width, ...measures, playback, selectedCount, pendingIntents, reload });
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
