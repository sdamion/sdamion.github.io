import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const {chromium} = await import(process.argv[2] || 'playwright');
const root = path.resolve('.');
const pools = [
    {ticker: 'tdsp', name: 'The Dutch Stake Pool', website: 'https://example.com/tdsp'},
    {ticker: 'test', name: 'Test Starch Pool', website: 'https://example.com/test'}
];
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
    for (const width of [1440, 390]) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        const errors = [], requests = [];
        let unavailable = false;
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.origin !== 'http://tdsp.test') {
                requests.push(url.pathname);
                const starch = url.pathname === '/api/starch/pools';
                const payload = starch ? {pools, pool_count: pools.length, tdsp: pools[0], epoch: 670} : {};
                return route.fulfill({status: starch && unavailable ? 503 : 200, contentType: 'application/json', body: JSON.stringify(payload)});
            }
            const file = path.resolve(root, url.pathname.slice(1) || 'index.html');
            if (!file.startsWith(root + path.sep)) return route.abort();
            try {
                const contentType = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
                await route.fulfill({contentType, body: await readFile(file)});
            } catch { await route.fulfill({status: 404, body: ''}); }
        });
        await page.goto('http://tdsp.test');
        await page.locator('#starch-pools-card').scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.getElementById('starch-pool-count').textContent === '2');
        for (const failRefresh of [false, true]) {
            unavailable = failRefresh;
            await page.locator('#starch-pools-card').click();
            const overlay = page.locator('[data-governance-overlay-id="pool-starch-overlay"]');
            await overlay.waitFor({state: 'visible'});
            assert.equal(await overlay.locator('.starch-pool-link-card').count(), 2);
            assert.match(await overlay.innerText(), /The Dutch Stake Pool/);
            assert.match(await overlay.innerText(), /Test Starch Pool/);
            await overlay.locator('.governance-close').first().click();
            await overlay.waitFor({state: 'detached'});
        }
        assert.ok(requests.filter(url => url === '/api/starch/pools').length >= 3);
        assert.deepEqual(requests.filter(url => /^\/api\/(?:pool|dreps?|spos?|mithril|leader-schedule)(?:\/|$)/.test(url)), []);
        assert.deepEqual(errors, []);
        await page.close();
    }
    console.log('PASS: Starch pool counts and lists load on desktop/mobile and survive refresh failure without retired directory requests.');
} finally { await browser.close(); }
