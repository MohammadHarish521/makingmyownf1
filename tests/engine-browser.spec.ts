import { test, expect, type Page } from '@playwright/test';
import type { SessionTelemetry } from '../src/engine/contracts';

const telemetry = (page: Page) => page.evaluate(() => (window as unknown as { throttleTheory: { telemetry: SessionTelemetry } }).throttleTheory.telemetry);
async function boot(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => !!(window as unknown as { throttleTheory?: unknown }).throttleTheory, undefined, { timeout: 60_000 });
  await page.clock.install();
  // Render at 10 Hz during virtual time; each frame still runs six real 60 Hz steps.
  await page.evaluate(() => {
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
}
async function start(page: Page, mode = 'Quick race') {
  await page.locator(`[data-mode="${mode}"]`).click();
  await page.locator('[data-track="2"]').click();
  await page.locator('#ride').click();
}
test('real browser: countdown, drive, gears, analog telemetry, pause, recover, restart, menu and resize', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await boot(page); await start(page);
  expect((await telemetry(page)).vehicles).toHaveLength(6);
  await page.clock.runFor(3500);
  expect((await telemetry(page)).phase).toBe('running');
  await page.keyboard.down('KeyW'); await page.clock.runFor(2500); await page.keyboard.up('KeyW');
  const accelerated = await telemetry(page);
  expect(accelerated.vehicles[0].speedMps).toBeGreaterThan(8);
  expect(accelerated.vehicles[0].audio.throttle).toBe(1);
  await page.keyboard.press('KeyE'); await page.clock.runFor(100);
  const manualGear = (await telemetry(page)).vehicles[0].gear;
  await page.keyboard.down('KeyS'); await page.clock.runFor(1000); await page.keyboard.up('KeyS');
  expect((await telemetry(page)).vehicles[0].speedMps).toBeLessThan(accelerated.vehicles[0].speedMps);
  expect((await telemetry(page)).vehicles[0].gear).toBe(manualGear);
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(300); await page.keyboard.up('ArrowRight');
  expect((await telemetry(page)).vehicles[0].input.steer).toBe(-1);
  await page.keyboard.press('KeyC');
  await page.keyboard.press('Escape'); const paused = await telemetry(page);
  expect(paused.phase).toBe('paused'); await page.clock.runFor(2000);
  expect((await telemetry(page)).elapsedS).toBe(paused.elapsedS);
  expect((await telemetry(page)).tick).toBe(paused.tick);
  await page.locator('#resume').click();
  const progress = (await telemetry(page)).vehicles[0].progressM;
  await page.keyboard.press('KeyR'); const recovered = await telemetry(page);
  expect(recovered.vehicles[0].progressM).toBe(progress);
  expect(recovered.vehicles[0].lateralM).toBe(0);
  expect(recovered.vehicles[0].timing.valid).toBe(false);
  await page.keyboard.press('Escape'); await page.locator('#restart').click();
  expect((await telemetry(page)).elapsedS).toBe(0);
  expect((await telemetry(page)).phase).toBe('countdown');
  expect((await telemetry(page)).vehicles[0].timing.valid).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/engine-mobile.png' });
  await page.keyboard.press('Escape'); await page.locator('#exit').click();
  expect((await telemetry(page)).phase).toBe('disposed');
  await expect(page.locator('[data-mode="Practice"]')).toBeVisible();
  expect(errors).toEqual([]);
});
test('gamepad analog throttle reaches solver telemetry and audio without keyboard input', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await boot(page); await start(page, 'Practice'); await page.clock.runFor(3500);
  await page.evaluate(() => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [{ connected: true, axes: [0, 0], buttons: Array.from({ length: 8 }, (_, i) => ({ value: i === 7 ? .6 : 0, pressed: i === 7, touched: false })) }] }));
  await page.clock.runFor(1500); const t = await telemetry(page), v = t.vehicles[0];
  expect(v.input.throttle).toBe(.6); expect(v.audio.throttle).toBe(.6);
  expect(v.speedMps).toBeGreaterThan(3); expect(t.vehicles).toHaveLength(1);
  expect(v.wheels).toHaveLength(4); expect(v.wheels[0].slipAngleRad).toBeNull();
  await page.screenshot({ path: 'artifacts/engine-driving.png' }); expect(errors).toEqual([]);
});
