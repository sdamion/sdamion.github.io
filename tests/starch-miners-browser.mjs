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
    await page.addScriptTag({ path: 'shared/runtime.js' });
    await page.addScriptTag({ path: 'governance/governance-pie-chart.js' });
    const source = await readFile('starch/starch.js', 'utf8');
    await page.addScriptTag({ content: source.slice(0, source.lastIndexOf("if (document.readyState === 'loading')")) });
    await page.evaluate(() => {
        window.openExternalSiteWarning = () => { window.minerOpened = true; };
        const data = [
            { id: 'A', name: 'Online miner', online: true, wallet_address: 'addr1test', ada_handle: '$owner' },
            { id: 'B', name: 'Offline miner', online: false },
            { id: 'C', name: 'Unknown miner', online: null }
        ];
        document.body.appendChild(createStarchMinerDirectoryBody(data));
    });
    assert.equal(await page.locator('.starch-miner-card').count(), 3);
    await page.locator('.governance-pie-chart-sector').nth(1).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.starch-miner-card').count(), 1);
    assert.match(await page.locator('.starch-miner-card').innerText(), /Offline miner/);
    await page.locator('.governance-vote-legend button').filter({ hasText: /^Online/ }).click();
    assert.equal(await page.locator('.starch-miner-card').count(), 1);
    assert.equal(await page.getByRole('link', { name: '$owner', exact: true }).getAttribute('href'), 'https://cardanoscan.io/address/addr1test');
    await page.getByRole('link', { name: '$owner', exact: true }).evaluate(link => link.addEventListener('click', event => event.preventDefault()));
    await page.getByRole('link', { name: '$owner', exact: true }).click();
    assert.equal(await page.evaluate(() => Boolean(window.minerOpened)), false);
    await page.locator('.governance-vote-legend button').filter({ hasText: /^All/ }).click();
    assert.equal(await page.locator('.starch-miner-card').count(), 3);
    for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `/tmp/starch-miners-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: online/offline/unknown filters, keyboard chart, wallet link, desktop/mobile layout.');
} finally {
    await browser.close();
}
