import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
        const path = new URL(route.request().url()).pathname;
        if (/^\/locales\/(nl|ja|es)\.toml$/.test(path)) {
            await route.fulfill({ contentType: 'text/plain', body: await readFile(path.slice(1), 'utf8') });
        } else await route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' });
    });
    await page.goto('http://127.0.0.1:8998/');
    await page.addStyleTag({ content: await readFile('shared/styles.css', 'utf8') });
    await page.addScriptTag({ path: 'shared/runtime.js' });
    await page.addScriptTag({ path: 'shared/i18n.js' });
    await page.addScriptTag({ path: 'governance/governance-drep-ncl.js' });
    const governance = await readFile('governance/governance.js', 'utf8');
    for (const [start, end] of [
        ['createTreasuryTileBar', 'getTreasuryHeaderAmount'],
        ['createGovernanceVoteBarSegment', 'createGovernanceMenuOverlay'],
        ['createConstitutionalCommitteeMemberVoteBar', 'updateConstitutionalCommitteeMemberSummaryStats']
    ]) {
        await page.addScriptTag({ content: governance.slice(governance.indexOf(`function ${start}(`), governance.indexOf(`function ${end}(`)) });
    }
    const starch = await readFile('starch/starch.js', 'utf8');
    await page.addScriptTag({ content: starch.slice(starch.indexOf('function createStarchMinerStatusBar('), starch.indexOf('function updateStarchDirectoryTiles(')) });
    await page.evaluate(() => {
        window.formatPercentage = number => `${number}%`;
        window.normalizePercentageNumber = Number;
        window.setGovernanceAutoTranslatedText = window.TDSPRuntime.setAutoTranslatedText;
        window.setGovernanceAutoTranslatedAriaLabel = window.TDSPRuntime.setAutoTranslatedAriaLabel;
        const drep = window.TDSPDrepNcl.create({
            formatNclAdaAmount: value => `\u20b3 ${value}`, formatVoteChoice: value => value,
            getNclBalanceActions: () => [{ id: 'b', epoch: 650, ask: 10 }],
            getNclSpentActions: () => [{ id: 'a', epoch: 650, ask: 40 }],
            getNclValues: () => ({ limit: 100 }), getNclPeriod: () => ({ startEpoch: 613, endEpoch: 713 }),
            getProposalTotalAsk: proposal => proposal.ask
        });
        const elements = [
            createStarchMinerStatusBar(12, 3, 20),
            createTreasuryTileBar([{ value: 75e6, label: 'In', className: 'governance-vote-bar-fill--yes' }, { value: 25e6, label: 'Out', className: 'governance-vote-bar-fill--no' }], 'Treasury'),
            createGovernanceVoteBarSegment({ yes: 75, no: 25 }),
            drep.createSpendBar({ name: 'Test', voteStats: { actions: [{ id: 'a', vote: 'Yes' }] } }),
            createConstitutionalCommitteeMemberVoteBar(1)
        ];
        document.body.className = 'theme-dark';
        elements.forEach((element, i) => {
            const card = document.createElement('div');
            card.className = 'governance-menu-card';card.id = `bar-${i}`;
            card.appendChild(element);document.body.appendChild(card);
        });
        updateConstitutionalCommitteeMemberVoteBar(document.body, 1, 80, 20, true);
        const unsafe = window.TDSPRuntime.createSegmentedBar({ segments: [{ value: Infinity, label: '<img src=x onerror=alert(1)>' }, { value: -20, label: 'Negative' }] });
        unsafe.id = 'untrusted-bar';document.body.appendChild(unsafe);
    });
    assert.equal(await page.locator('#untrusted-bar img').count(), 0);
    assert.deepEqual(await page.locator('#untrusted-bar .governance-vote-bar-fill').evaluateAll(nodes => nodes.map(node => node.style.flexBasis)), ['0%', '0%']);
    assert.match(await page.locator('#bar-0').innerText(), /Online 12.*Offline 3.*Status unavailable 5/s);
    assert.match(await page.locator('#bar-3').innerText(), /NCL Used.*40.*NCL Available.*60.*Pipeline.*10/s);
    assert.match(await page.locator('#bar-4').innerText(), /Voted 80%.*Not voted 20%/s);
    const widths = await page.locator('.governance-vote-bar-fill, .drep-ncl-bar-fill').evaluateAll(nodes => nodes.map(node => node.style.flexBasis));
    for (const language of ['nl', 'ja', 'es', 'en']) {
        await page.evaluate(language => window.TDSPI18n.setLanguage(language), language);
        assert.deepEqual(await page.locator('.governance-vote-bar-fill, .drep-ncl-bar-fill').evaluateAll(nodes => nodes.map(node => node.style.flexBasis)), widths);
        assert.match(await page.locator('#bar-0').innerText(), /12.*3.*5/s);
        assert.match(await page.locator('#bar-2').innerText(), /75%.*25%/s);
        assert.match(await page.locator('#bar-3').innerText(), /40.*60.*10/s);
        if (language === 'nl') {
            assert.match(await page.locator('#bar-2').innerText(), /Ja.*Nee/s);
            assert.doesNotMatch(await page.locator('#bar-0').innerText(), /Status unavailable/);
        }
    }
    for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    assert.deepEqual(errors, []);
    console.log('Shared bars: rendering, escaping, mobile layout and four languages passed');
} finally { await browser.close(); }
