import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const {chromium} = await import(process.argv[2] || 'playwright');
const root = path.resolve('.');
const proposal = {
    proposal_id: 'gov_action1' + 'q'.repeat(48),
    proposal_tx_hash: 'a'.repeat(64), proposal_type: 'InfoAction',
    proposed_epoch: 670, expiration: 99999, block_time: 1795640000,
    ratified_epoch: null, enacted_epoch: null, expired_epoch: null, dropped_epoch: null,
    proposal_description: {tag: 'InfoAction'}, metadata_compact: true,
    meta_json: {body: {title: 'Overlay regression action'}},
    voting_summary: {epoch_no: 670, drep_yes_pct: 75, drep_no_pct: 25}
};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error' && /Governance action could not be opened/.test(message.text())) errors.push(message.text());
    });
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== 'http://tdsp.test') {
            let payload = {};
            if (url.pathname.includes('/dashboard')) payload = {proposals: [proposal], proposal_count: 1};
            else if (url.pathname === `/api/proposal/${proposal.proposal_id}`) payload = {
                proposal: {...proposal, metadata_compact: false, meta_json: {body: {
                    title: 'Overlay regression action', abstract: 'Full proposal details loaded.',
                    image: 'https://example.com/proposal-image.png'
                }}}
            };
            else if (url.pathname.endsWith('/votes')) payload = {votes_raw: [], votes: {}};
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
    const card = page.locator('.governance-card-open').filter({hasText: 'Overlay regression action'}).first();
    for (const width of [1440, 390]) {
        await page.setViewportSize({width, height: 900});
        await page.locator('#gov-active-card').click();
        await card.waitFor();
        await card.click();
        await page.evaluate(() => {});
        assert.deepEqual(errors, []);
        const overlay = page.locator('[data-governance-overlay-id="governance-overlay"]');
        await overlay.waitFor({state: 'visible'});
        await overlay.getByText('Full proposal details loaded.', {exact: true}).waitFor();
        assert.equal(await overlay.locator('img.governance-detail-image').getAttribute('src'), 'https://example.com/proposal-image.png');
        assert.equal(await overlay.locator('.governance-summary-button').count(), 1);
        assert.equal(await overlay.locator('.governance-tdspbot-button').count(), 1);
        assert.equal(await overlay.getByText('Vote as DRep', {exact: true}).count(), 0);
        await overlay.locator('.governance-close').first().click();
        await overlay.waitFor({state: 'detached'});
    }
    assert.deepEqual(errors, []);
    console.log('PASS: action tiles open and reopen details on desktop/mobile, including async metadata and images.');
} finally { await browser.close(); }
