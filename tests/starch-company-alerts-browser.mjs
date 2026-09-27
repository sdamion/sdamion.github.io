import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }));
    await page.goto('http://127.0.0.1:8998/');
    await page.addStyleTag({ content: await readFile('shared/styles.css', 'utf8') });
    await page.evaluate(html => {
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        document.body.appendChild(document.importNode(parsed.querySelector('.site-alerts'), true));
        Object.assign(document.querySelector('.site-alerts').style, { position: 'fixed', top: '20px', right: '20px', width: '260px' });
        window.translateUiText = text => text;
        window.notifications = [];
        window.Notification = class {
            static permission = 'granted';
            constructor(title, options) { window.notifications.push({ title, ...options }); }
        };
        window.TDSPRuntime = {
            onReady: callback => callback(),
            fetchJson: async () => ({ online_block: 1, online_updated_at: new Date().toISOString(),
                companies: [{ id: 'B0ADAD', name: 'TDSP', member_ids: ['A'] }], miners: [{ id: 'A', online: false }] })
        };
    }, await readFile('index.html', 'utf8'));
    const home = await readFile('home/index.js', 'utf8');
    await page.addScriptTag({ content: home.slice(0, home.indexOf('async function fetchPrices(')) + '\ninitSiteAlertsMenu();' });
    await page.addScriptTag({ path: 'starch/company-alerts.js' });
    await page.locator('#site-alerts-button').click();
    await page.locator('#site-alert-starch-company').check();
    await page.locator('#starch-company-alert-id').fill('b0adad');
    await page.locator('#starch-company-alert-form button').click();
    await page.waitForFunction(() => window.notifications.length === 1);
    assert.equal(await page.locator('#starch-company-alert-id').inputValue(), 'B0ADAD');
    await page.evaluate(() => window.TDSPStarchCompanyAlerts.check());
    assert.equal(await page.evaluate(() => window.notifications.length), 1);
    for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 800 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator('#site-alerts-menu').evaluate(menu => { menu.scrollTop = 0; });
        const bounds = await page.locator('#site-alerts-menu').boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 800);
        await page.screenshot({ path: `/tmp/starch-alerts-${width}.png` });
    }
    await page.locator('#starch-company-alert-id').fill('');
    await page.locator('#starch-company-alert-form button').click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('tdsp-starch-company-alert-v1')).companyId), '');
    assert.deepEqual(errors, []);
    console.log('PASS: alert menu save, normalized ID, notification, deduplication, removal and responsive layout.');
} finally { await browser.close(); }
