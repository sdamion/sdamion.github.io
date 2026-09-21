import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('wallet changes show initialisation before counting, even without a snapshot', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    const save = app.slice(app.indexOf('function saveWallets('), app.indexOf('function saveCexAddresses('));
    assert.ok(save.indexOf('setBusy(true)') < save.indexOf('setWallets(next)'));
    assert.match(save, /setAnalysis\(null\);setCounting\(null\)/);
    assert.match(app, /busy&&!analysis&&counting===null&&<div role="status">/);
    assert.match(app, /<progress aria-label="Initialising wallets"\/>/);
});

test('Portfolio mounts in the universal overlay without a shadow or private stylesheet', () => {
    const entry = read('delegators/portfolio-src/entry.tsx');
    assert.doesNotMatch(entry, /attachShadow|createElement\('link'\)|styles\.css/);
    assert.equal(existsSync(new URL('../delegators/portfolio/styles.css', import.meta.url)), false);
    assert.equal(existsSync(new URL('../delegators/portfolio-src/styles.css', import.meta.url)), false);
    assert.match(read('delegators/portfolio-src/ui.tsx'), /className="table-shell"/);
    assert.match(read('delegators/portfolio-src/App.tsx'), /className="tdsp-tile-grid"/);
});

test('all linked addresses feed balances and transaction history, including spent addresses', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    assert.match(app, /_empty:true/);
    assert.match(app, /new Set\(Object.values\(groups\).flat\(\)\)/);
    assert.match(app, /for\(const addressBatch of addressBatches\)/);
    assert.match(app, /linked addresses · includes spent addresses/);
});
