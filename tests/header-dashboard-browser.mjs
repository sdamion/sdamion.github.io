import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const {chromium} = await import(process.argv[2]);
const root = process.cwd();
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== 'http://tdsp.test') {
            return route.fulfill({status: 200, contentType: 'application/json', body: '{}'});
        }
        const relative = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
        const file = path.resolve(root, relative);
        if (!file.startsWith(root + path.sep)) return route.abort();
        try {
            const body = await readFile(file);
            const contentType = ({'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.toml': 'text/plain'})[path.extname(file)] || 'application/octet-stream';
            await route.fulfill({body, contentType});
        } catch {
            await route.fulfill({status: 404, body: ''});
        }
    });
    await page.addInitScript(() => {
        window.TDSPDelegatorAccess = {
            initOverlay(scope) { window.testDashboardScope = scope; },
            closePortfolio() {}
        };
    });
    await page.goto('http://tdsp.test');
    const link = page.locator('#delegators-dashboard-link');
    for (const width of [1440, 390, 320]) {
        await page.setViewportSize({width, height: 900});
        await link.scrollIntoViewIfNeeded();
        const theme = await page.locator('#theme-toggle').boundingBox();
        const icon = await link.boundingBox();
        assert.ok(icon && theme);
        assert.ok(Math.abs(icon.y - theme.y) < 2, 'controls stay on the same row');
        assert.ok(icon.x >= theme.x + theme.width, 'dashboard follows theme toggle');
        assert.ok(icon.x + icon.width <= width, 'icon fits mobile viewport');
        await page.screenshot({path: `/tmp/tdsp-header-${width}.png`});
        await link.focus();
        await page.keyboard.press('Enter');
        await page.locator('#delegators-dashboard-overlay').waitFor();
        await page.waitForFunction(() => window.testDashboardScope === 'delegator');
        await page.getByRole('button', {name: 'Close delegators dashboard', exact: true}).click();
        await page.locator('#delegators-dashboard-overlay').waitFor({state: 'detached'});
        assert.equal(await link.evaluate(el => el === document.activeElement), true);
    }
    for (const language of ['nl', 'ja', 'es', 'en']) {
        await page.evaluate(lang => window.TDSPI18n.setLanguage(lang), language);
        await page.waitForFunction(() => document.querySelector('#delegators-dashboard-link').getAttribute('aria-label') === window.TDSPI18n.translateText('Open delegators dashboard'));
        assert.equal(await link.getAttribute('title'), await page.evaluate(() => window.TDSPI18n.translateText('Delegators Dashboard')));
    }
    const home = await readFile(path.join(root, 'home/index.js'), 'utf8');
    assert.doesNotMatch(home, /extraActions: \[delegatorsPageButton\]/);
    console.log('Header dashboard: desktop/mobile placement, keyboard opening, delegator access, focus return and four languages passed.');
} finally {
    await browser.close();
}
