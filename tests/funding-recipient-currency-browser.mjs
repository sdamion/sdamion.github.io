import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const {chromium} = await import(process.argv[2] || 'playwright');
const root = path.resolve('.');
const equivalent = {amount: 2000, estimated: true, date: '2024-12-17', usd_rate: 0.5, source: 'coinbase', basis: 'catalyst_fund_result_daily_close'};
const project = {id: 'usd-project', title: 'Dollar funded project', fund_name: 'Fund 13', currency: 'USD', amount_requested_usd: 1500, amount_received_usd: 1000, amount_received_ada: 0, received_ada_equivalent: equivalent};
const groups = [
    {key: 'usd-only', label: 'Dollar Funded Studio', value: 1000, adaValue: 0, received_ada_equivalent: {amount: 2000, estimated: true, missing_count: 0}, usdPending: false, withdrawals: [], catalystProjects: [project]},
    {key: 'mixed', label: 'Mixed Funding Studio', value: 2500, adaValue: 100, received_ada_equivalent: {amount: 4900, estimated: true, missing_count: 0}, usdPending: false, withdrawals: [{amount_ada: 100, amount_usd: 100}], catalystProjects: [{...project, id: 'mixed-project', amount_received_usd: 2400, received_ada_equivalent: {...equivalent, amount: 4800}}]},
    {key: 'pending', label: 'Pending Dollar Studio', value: 0, adaValue: 100, received_ada_equivalent: {amount: null, estimated: true, missing_count: 1}, usdPending: true, withdrawals: [], catalystProjects: [{...project, id: 'pending-project'}]}
];
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
    for (const width of [1440, 390]) {
        const page = await browser.newPage({viewport: {width, height: 900}});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.origin !== 'http://tdsp.test') {
                const payload = url.pathname === '/api/funding/recipients' ? {groups, totals: {received_usd: 3500, pending: true}}
                    : url.pathname.endsWith('/' + project.id) ? project : {};
                return route.fulfill({contentType: 'application/json', body: JSON.stringify(payload)});
            }
            const file = path.resolve(root, url.pathname.slice(1) || 'index.html');
            if (!file.startsWith(root + path.sep)) return route.abort();
            try {
                const contentType = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
                await route.fulfill({contentType, body: await readFile(file)});
            } catch { await route.fulfill({status: 404, body: ''}); }
        });
        await page.goto('http://tdsp.test');
        await page.locator('#gov-business-card').click();
        const overlay = page.locator('[data-governance-overlay-id="governance-business-overlay"]');
        const card = title => overlay.locator('.governance-card-open').filter({hasText: title});
        await card('Dollar Funded Studio').waitFor();
        assert.match(await card('Dollar Funded Studio').innerText(), /\$1,000/);
        assert.match(await card('Mixed Funding Studio').innerText(), /\$2,500/);
        assert.match(await card('Pending Dollar Studio').innerText(), /USD updating/);
        assert.match(await card('Dollar Funded Studio').innerText(), /₳ 2,000/);
        assert.match(await card('Mixed Funding Studio').innerText(), /₳ 4,900/);
        assert.doesNotMatch(await card('Pending Dollar Studio').innerText(), /₳/);
        for (const language of ['nl', 'ja', 'es', 'en']) {
            await page.evaluate(language => window.TDSPI18n.setLanguage(language), language);
            const expected = await page.evaluate(() => window.TDSPI18n.translateText('Historical ADA estimate (fund result date)'));
            if (language !== 'en') assert.notEqual(expected, 'Historical ADA estimate (fund result date)');
            await page.waitForFunction(expected => document.body.textContent.includes(expected), expected);
            assert.match(await card('Dollar Funded Studio').innerText(), /\$1,000/);
            assert.match(await card('Dollar Funded Studio').innerText(), /₳ 2,000/);
        }
        await card('Dollar Funded Studio').click();
        const detail = page.locator('[data-governance-overlay-id="governance-business-actions-overlay"]');
        const projectCard = detail.locator('.governance-card-open').filter({hasText: project.title});
        await projectCard.waitFor();
        assert.match(await projectCard.innerText(), /\$1,000/);
        assert.match(await projectCard.innerText(), /₳ 2,000/);
        assert.match(await projectCard.innerText(), /Historical ADA estimate/);
        assert.match(await projectCard.innerText(), /2024-12-17.*ADA\/USD: \$0.5/s);
        assert.match(await projectCard.innerText(), /Coinbase daily closing rate/);
        await projectCard.click();
        const proposal = page.locator('[data-governance-overlay-id="governance-catalyst-proposal-detail-overlay"]');
        await proposal.getByText('2024-12-17', {exact: true}).waitFor();
        assert.match(await proposal.innerText(), /₳ 2,000/);
        assert.match(await proposal.innerText(), /\$0.50/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({path: `/tmp/tdsp-recipient-history-${width}.png`});
        assert.deepEqual(errors, []);
        await page.close();
    }
    console.log('PASS: recipients show USD and labelled historical ADA estimates, exact dates/rates, missing data and four languages on desktop/mobile.');
} finally { await browser.close(); }
