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
    await page.evaluate(() => {
        window.copiedValues = [];
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
            writeText: async value => window.copiedValues.push(value)
        } });
    });
    await page.addStyleTag({ content: await readFile('shared/styles.css', 'utf8') });
    await page.addScriptTag({ path: 'shared/runtime.js' });
    await page.addScriptTag({ path: 'governance/governance-pie-chart.js' });
    const home = await readFile('home/index.js', 'utf8');
    await page.addScriptTag({ content: home.slice(home.indexOf('const OVERLAY_SORT_DEFINITIONS'), home.indexOf('function installOverlaySearch(')) });
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
    assert.match(await page.locator('.starch-miner-card').innerText(), /B/);
    assert.doesNotMatch(await page.locator('.starch-miner-card').innerText(), /Offline|Online|miner/);
    assert.equal(await page.locator('.starch-miner-card .is-inactive').count(), 1);
    await page.locator('.governance-vote-legend button').filter({ hasText: /^Online/ }).click();
    assert.equal(await page.locator('.starch-miner-card').count(), 1);
    assert.equal(await page.getByRole('link', { name: '$owner', exact: true }).getAttribute('href'), 'https://cardanoscan.io/address/addr1test');
    assert.equal(await page.locator('.starch-miner-card > :first-child a').innerText(), '$owner');
    await page.getByRole('button', { name: 'Copy Wallet address', exact: true }).click();
    await page.getByRole('button', { name: 'Copy Miner ID', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.copiedValues), ['addr1test', 'A']);
    assert.equal(await page.evaluate(() => Boolean(window.minerOpened)), false);
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
    assert.doesNotMatch(await page.locator('.starch-miner-wallet-card').innerText(), /Online|Offline/);
    assert.equal(await page.locator('.starch-miner-wallet-card .pool-status-value.is-inactive').count(), 1);
    assert.deepEqual(await page.evaluate(() => [
        [true, true], [true, null], [false, null]
    ].map(states => {
        const list = createStarchMinerWalletList(states.map((online, id) => ({ id: String(id), wallet_address: 'addr1shared', online })));
        const amount = list.querySelector('.pool-status-value');
        return [amount.classList.contains('is-active'), amount.classList.contains('is-inactive')];
    })), [[true, false], [false, false], [false, true]]);
    assert.deepEqual(await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.governance-menu-card')];
        return getRelevantOverlaySortOptions(cards).filter(option => option.key === 'sortMiners').map(option => option.value);
    }), ['miners-desc', 'miners-asc']);
    for (const mode of ['miners-asc', 'miners-desc']) {
        const counts = await page.evaluate(mode => {
            const cards = [...document.querySelectorAll('.governance-menu-card')];
            sortOverlayCards(document.body, cards, mode);
            return [...document.querySelectorAll('.governance-menu-card')].map(card => Number(card.dataset.sortMiners));
        }, mode);
        assert.deepEqual(counts, mode === 'miners-desc' ? [2, 1, 1, 1] : [1, 1, 1, 2]);
    }
    const walletGroup = page.locator('.starch-miner-wallet-card');
    assert.equal(await walletGroup.locator('a').getAttribute('href'), 'https://cardanoscan.io/address/addr1shared');
    await walletGroup.getByRole('button', { name: 'Copy Wallet address', exact: true }).click();
    assert.equal(await page.locator('#starch-wallet-miners-overlay').count(), 0);
    assert.equal(await page.evaluate(() => window.copiedValues.at(-1)), 'addr1shared');
    await walletGroup.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#starch-wallet-miners-overlay .starch-miner-card').count(), 2);
    assert.match(await page.locator('#starch-wallet-miners-overlay').innerText(), /W1/);
    assert.match(await page.locator('#starch-wallet-miners-overlay').innerText(), /W2/);
    assert.doesNotMatch(await page.locator('#starch-wallet-miners-overlay').innerText(), /W3|First shared miner|Second shared miner/);
    assert.ok(await page.evaluate(() => walletOverlayOptions.returnFocus.matches('.starch-miner-wallet-card')));
    await page.evaluate(() => walletOverlayOptions.closeOverlay());
    assert.equal(await page.locator('#starch-wallet-miners-overlay').count(), 0);
    assert.equal(await page.locator('.starch-miner-wallet-card').count(), 1);
    assert.deepEqual(errors, []);
    console.log('PASS: status filters, keyboard chart, wallet links, wallet grouping and child overlay, desktop/mobile layout.');
} finally {
    await browser.close();
}
