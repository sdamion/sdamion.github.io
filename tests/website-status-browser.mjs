import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.argv[2]);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
    const page = await browser.newPage();
    await page.setContent('<main></main>');
    await page.addStyleTag({ content: await readFile('shared/styles.css', 'utf8') });
    await page.addScriptTag({ content: (await readFile('delegators/website-status.js', 'utf8')).replace('export function', 'function') });
    await page.evaluate(async () => {
        let calls = 0;
        const panel = createWebsiteStatusPanel(async () => {
            if (++calls > 1) throw new Error('HTTP 401');
            return { checked_at: new Date().toISOString(), backend: { uptime_seconds: 100, memory_rss_bytes: 1024, heap_used_bytes: 1024 },
                providers: { koios: { queued: 2, succeeded: 12, failed: 1, blocked_until: Date.now() + 60000 } },
                ai: { available: false }, cache: { enabled: true, cache_files: 42 }, refresh_intervals_ms: { active_votes: 300000 } };
        });
        document.querySelector('main').append(panel);
        await panel.refresh();
    });
    assert.match(await page.locator('main').innerText(), /Succeeded: 12/);
    assert.match(await page.locator('main').innerText(), /Waiting to retry/);
    for (const width of [1280, 700, 390]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const columns = await page.locator('.tdsp-tile-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        if (width <= 700) assert.equal(columns, 1);
        else assert.ok(columns > 1);
        await page.screenshot({ path: `/tmp/website-status-${width}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    assert.match(await page.locator('[role=status]').innerText(), /HTTP 401/);
    assert.equal(await page.getByRole('button', { name: 'Refresh', exact: true }).isEnabled(), true);
    console.log('Website status: rendering, mobile layout, refresh and auth error passed');
} finally { await browser.close(); }
