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
        const overlay = document.createElement('section');
        overlay.id = 'starch-miners-overlay';
        overlay.appendChild(createStarchMinerDirectoryBody(data));
        document.body.appendChild(overlay);
    });
    assert.equal(await page.locator('.starch-miner-card').count(), 3);
    assert.deepEqual(await page.locator('.governance-pie-label').allTextContents(), ['Online 1', 'Offline 1', 'Status unavailable 1']);
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
    await page.locator('.governance-vote-legend button').filter({ hasText: /^Offline/ }).click();
    await page.evaluate(() => {
        starchDirectory = { miners: [
            { id: 'A', name: 'New online', online: true },
            { id: 'B', name: 'New offline', online: false },
            { id: 'C', name: 'Previously unknown', online: false }
        ] };
        refreshOpenStarchMinerDirectory();
    });
    assert.equal(await page.locator('.starch-miner-card').count(), 2);
    assert.equal(await page.locator('[data-starch-miner-directory]').getAttribute('data-selected'), 'offline');
    assert.ok(await page.evaluate(() => {
        const current = document.querySelector('[data-starch-miner-directory]');
        refreshOpenStarchMinerDirectory();
        return current === document.querySelector('[data-starch-miner-directory]');
    }));
    for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `/tmp/starch-miners-${width}.png`, fullPage: true });
    }
    await page.evaluate(() => {
        window.createPoolMenuOverlay = options => {
            window.walletOverlayOptions = options;
            const overlay = document.createElement('section');
            overlay.id = options.id;
            overlay.appendChild(options.bodyNode);
            document.body.appendChild(overlay);
        };
        window.closePoolMenuOverlay = id => document.getElementById(id)?.remove();
        document.body.replaceChildren(createStarchMinerWalletList([
            { id: 'W1', name: 'First shared miner', wallet_address: 'addr1shared', ada_handle: '$same', online: true },
            { id: 'W2', name: 'Second shared miner', wallet_address: 'addr1shared', ada_handle: '$same', online: false },
            { id: 'W3', name: 'Other wallet', wallet_address: 'addr1different', ada_handle: '$same', online: true },
            { id: 'W4', name: 'Unknown owner one' },
            { id: 'W5', name: 'Unknown owner two' }
        ]));
    });
    assert.equal(await page.locator('.starch-miner-wallet-card').count(), 1);
    assert.equal(await page.locator('.starch-miner-card').count(), 3);
    assert.match(await page.locator('.starch-miner-wallet-card').innerText(), /2 Miners/);
    await page.locator('.starch-miner-wallet-card').click();
    assert.equal(await page.locator('#starch-wallet-miners-overlay .starch-miner-card').count(), 2);
    assert.match(await page.locator('#starch-wallet-miners-overlay').innerText(), /First shared miner/);
    assert.doesNotMatch(await page.locator('#starch-wallet-miners-overlay').innerText(), /Other wallet/);
    assert.ok(await page.evaluate(() => walletOverlayOptions.returnFocus.matches('.starch-miner-wallet-card')));
    await page.evaluate(() => walletOverlayOptions.closeOverlay());
    assert.equal(await page.locator('#starch-wallet-miners-overlay').count(), 0);
    assert.equal(await page.locator('.starch-miner-wallet-card').count(), 1);
    assert.deepEqual(errors, []);
    console.log('PASS: status filters, keyboard chart, wallet links, wallet grouping and child overlay, desktop/mobile layout.');
} finally {
    await browser.close();
}
