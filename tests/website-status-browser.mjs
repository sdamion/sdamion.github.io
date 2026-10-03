import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.argv[2]);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
    const page = await browser.newPage();
    await page.setContent('<main></main>');
    await page.addStyleTag({ content: await readFile('shared/styles.css', 'utf8') });
    await page.addScriptTag({ content: await readFile('shared/runtime.js', 'utf8') });
    await page.evaluate(()=>{window.createUniversalOverlay=options=>{const overlay=document.createElement('div');overlay.id=options.id;const back=document.createElement('button');back.textContent='Back';back.onclick=options.closeOverlay;overlay.append(back,...options.bodyNodes);document.body.append(overlay);return {overlay};};});
    await page.addScriptTag({ content: (await readFile('delegators/website-status.js', 'utf8')).replace('export function', 'function') });
    await page.evaluate(async () => {
        let calls = 0;
        const panel = createWebsiteStatusPanel(async () => {
            if (++calls > 2) throw new Error('HTTP 401');
            return { checked_at: new Date().toISOString(), backend: { uptime_seconds: 100, memory_rss_bytes: 1024, heap_used_bytes: 1024 },
                portfolio_storage:{used_bytes:1e9,limit_bytes:1e10,usage_percent:10,status:'healthy',measured_at:new Date().toISOString(),wallets:[{wallet_id:'a'.repeat(64),size_bytes:1e9,updated_at_ms:Date.now()}]},
                backend_storage:{used_bytes:3e9,measured_at:new Date().toISOString(),sections:[{id:'database',title:'Database',used_bytes:2e9},{id:'portfolio',title:'Portfolio',used_bytes:1e9}]},
                history: { samples: [{ time: Date.now() - 60000, memory_mb: 120, check_ms: 10 },
                    { time: Date.now(), memory_mb: 125, check_ms: 20 }] },
                monitoring: { healthy: 1, total: 3, attention: 2, sampled_at_ms: Date.now(),
                    pool: { status: 'healthy', live_stake_lovelace: '1000000', delegator_sum_lovelace: '1000000', difference_lovelace: '0', delegators: 1, issues: [] },
                    checks: [{ name: 'Pool', status: 'healthy', age_ms: 1000, interval_ms: 300000 },
                        { name: 'Prices', status: 'waiting', missed_intervals: 2, age_ms: 60000, interval_ms: 30000 },
                        { name: 'News', status: 'stale', missed_intervals: 5, age_ms: 4500000, interval_ms: 900000 }] },
                providers: { koios: { queued: 2, succeeded: 12, failed: 1, blocked_until: Date.now() + 60000 } },
                ai: { available: false }, cache: { enabled: true, cache_files: 42 }, refresh_intervals_ms: { active_votes: 300000 } };
        });
        document.querySelector('main').append(panel);
        await panel.refresh();
        if (panel.querySelectorAll('.tdsp-monitor-chart').length !== 2) throw new Error('Saved graphs missing on first open: '+panel.querySelector('[role=status]').textContent);
        await panel.refresh();
    });
    assert.match(await page.locator('main').innerText(), /Succeeded: 12/);
    assert.match(await page.locator('main').innerText(), /Waiting to retry/);
    assert.match(await page.locator('[data-amount-tone="warning"]').innerText(), /Waiting on data/);
    assert.ok(await page.getByText('Data stale', { exact: true }).count());
    const total=page.getByRole('button',{name:'Backend storage',exact:true});
    assert.match(await total.innerText(),/3 GB/);
    await total.press('Enter');
    const sections=page.locator('#website-backend-storage-overlay');
    await sections.getByText('Database',{exact:true}).waitFor();
    const storage=sections.getByRole('button',{name:'Portfolio',exact:true});
    assert.equal(await storage.locator('[data-amount-tone]').getAttribute('data-amount-tone'),'positive');
    assert.equal(await storage.locator('.governance-vote-bar-fill--yes').evaluate(node=>node.style.flexBasis),'10%');
    await storage.press('Enter');
    const detail=page.locator('#website-portfolio-storage-overlay');
    await detail.getByText('Wallet aaaaaaaaaaaa',{exact:true}).waitFor();
    assert.match(await detail.innerText(),/1 GB/);
    await detail.getByRole('button',{name:'Back'}).click();
    assert.equal(await detail.count(),0);
    assert.equal(await sections.isVisible(),true);
    await sections.getByRole('button',{name:'Back',exact:true}).click();
    assert.equal(await sections.count(),0);
    for (const width of [1280, 700, 390]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        const columns = await page.locator('.tdsp-tile-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
        if (width <= 700) assert.equal(columns, 1);
        else assert.equal(columns, 3);
        const alignment = await page.locator('.governance-menu-card').first().evaluate(tile => {
            const content = tile.firstElementChild;
            return {
                inset: content.getBoundingClientRect().left - tile.getBoundingClientRect().left,
                paragraphs: content.querySelectorAll('p').length,
                aligned: [...content.children].every(child => Math.abs(child.getBoundingClientRect().left - content.getBoundingClientRect().left) < 1)
            };
        });
        assert.ok(alignment.inset >= 16);
        assert.equal(alignment.paragraphs, 0);
        assert.equal(alignment.aligned, true);
        await page.screenshot({ path: `/tmp/website-status-${width}.png`, fullPage: true });
    }
    assert.equal(await page.locator('.tdsp-monitor-chart').count(), 2);
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    assert.match(await page.locator('[role=status]').innerText(), /HTTP 401/);
    assert.equal(await page.getByRole('button', { name: 'Refresh', exact: true }).isEnabled(), true);
    console.log('Website status: rendering, mobile layout, refresh and auth error passed');
} finally { await browser.close(); }
