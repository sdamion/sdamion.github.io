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

test('Portfolio uses the shared wide dialog with full-screen mobile sizing', () => {
    assert.match(read('delegators/delegator-access.js'), /dialogClass: 'governance-dialog-wide'/);
    const css = read('shared/styles.css');
    assert.match(css, /\.governance-dialog-wide\s*\{\s*width: min\(1920px, 100%\);\s*height: calc\(100dvh - 48px\);\s*max-height: calc\(100dvh - 48px\);/);
    assert.match(css, /\.governance-menu-overlay > \.governance-dialog\s*\{[^}]*height: 100dvh;/);
});

test('shared metric gain and loss tones override the default tile header colour', () => {
    const css = read('shared/styles.css');
    assert.match(css, /\.tdsp-tile-grid > \.governance-menu-card > strong\.negative\s*\{\s*color: var\(--ai-unavailable-color, #c62828\);/);
    assert.match(css, /\.tdsp-tile-grid > \.governance-menu-card > strong\.positive\s*\{\s*color: var\(--accent-strong\);/);
    assert.match(read('delegators/portfolio-src/App.tsx'), /tone=\{covered.length\?gain>=0\?'positive':'negative':''\}/);
});

test('all linked addresses feed balances and transaction history, including spent addresses', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    assert.match(app, /_empty:true/);
    assert.match(app, /new Set\(Object.values\(groups\).flat\(\)\)/);
    assert.match(app, /for\(const addressBatch of addressBatches\)/);
    assert.match(app, /linked addresses · includes spent addresses/);
});
