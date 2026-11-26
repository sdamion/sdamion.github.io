import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const {chromium} = await import(process.argv[2] || 'playwright');
const root = path.resolve('.');
const base = {source: 'project_catalyst_pilot_2026', project_status: 'funded', fund_name: 'Pilot 2026', currency: 'ADA', amount_requested: 140000, amount_requested_usd: null, ada_usd_rate: null};
const proposals = [
    {...base, id: 'legacy', title: 'Legacy synthetic receipt', amount_received: 0, amount_received_usd: 0},
    {...base, id: 'unknown', title: 'Unknown receipt', amount_received: null, amount_received_usd: null, payment_data_available: false},
    {...base, id: 'zero', title: 'Confirmed zero receipt', amount_received: 0, amount_received_usd: 0, payment_data_available: true},
    {...base, id: 'known', title: 'Confirmed ADA receipt', amount_received: 56000, amount_received_usd: null, payment_data_available: true}
];
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== 'http://tdsp.test') {
            const id = url.pathname.split('/').pop();
            const proposal = proposals.find(row => row.id === id);
            return route.fulfill({contentType: 'application/json', body: JSON.stringify(proposal ? {proposal} : {})});
        }
        const file = path.resolve(root, url.pathname.slice(1) || 'index.html');
        if (!file.startsWith(root + path.sep)) return route.abort();
        try {
            const contentType = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
            await route.fulfill({contentType, body: await readFile(file)});
        } catch { await route.fulfill({status: 404, body: ''}); }
    });
    await page.goto('http://tdsp.test');
    await page.waitForFunction(() => typeof createCatalystPilot2026Card === 'function');
    await page.evaluate(proposals => {
        const card = createCatalystPilot2026Card({proposal_count: proposals.length, requested_ada: 560000}, proposals);
        card.id = 'pilot-test-card';
        document.body.appendChild(card);
    }, proposals);
    await page.locator('#pilot-test-card').click();
    const list = page.locator('[data-governance-overlay-id="governance-catalyst-pilot-2026-overlay"]');
    const card = title => list.locator('.governance-card-open').filter({hasText: title});
    assert.equal(await list.locator('.governance-card-open').count(), 4);
    assert.match(await card('Confirmed zero receipt').innerText(), /Received \$0/);
    assert.match(await card('Confirmed ADA receipt').innerText(), /Received ₳ 56,000/);
    for (const language of ['nl', 'ja', 'es', 'en']) {
        await page.evaluate(language => window.TDSPI18n.setLanguage(language), language);
        const expected = await page.evaluate(() => window.TDSPI18n.translateText('Received amount unavailable'));
        if (language !== 'en') assert.notEqual(expected, 'Received amount unavailable');
        for (const title of ['Legacy synthetic receipt', 'Unknown receipt']) {
            await page.waitForFunction(({title, expected}) => Array.from(document.querySelectorAll('.governance-card-open')).some(node => node.textContent.includes(title) && node.textContent.includes(expected)), {title, expected});
            assert.doesNotMatch(await card(title).innerText(), /\$0/);
            assert.match(await card(title).innerText(), /140,000/);
        }
    }
    await card('Legacy synthetic receipt').click();
    const detail = page.locator('[data-governance-overlay-id="governance-catalyst-proposal-detail-overlay"]');
    await detail.waitFor({state: 'visible'});
    await detail.getByText('Received amount unavailable', {exact: true}).waitFor();
    assert.match(await detail.innerText(), /Received amount unavailable/);
    assert.doesNotMatch(await detail.innerText(), /\$0|Historical ADA\/USD/);
    assert.deepEqual(errors, []);
    console.log('PASS: funded Pilot cards/details distinguish unknown, zero and ADA receipts in NL/JA/ES/EN.');
} finally { await browser.close(); }
