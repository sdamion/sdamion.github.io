import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('wallet changes show initialisation before counting, even without a snapshot', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    const save = app.slice(app.indexOf('function saveWallets('), app.indexOf('function saveCexAddresses('));
    assert.ok(save.indexOf('setBusy(true)') < save.indexOf('setWallets(next)'));
    assert.match(save, /setAnalysis\(null\);setCounting\(null\)/);
    assert.match(app, /value=\{initialising\?'Initialising':num\(wallets.length\+cexAddresses.length,0\)\} loading=\{initialising\}/);
    assert.match(read('delegators/portfolio-src/ui.tsx'), /progress.setAttribute\('aria-label','Initialising'\)/);
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

test('ADA summary includes the priced holdings subtotal using shared delegator amount styles', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    assert.doesNotMatch(app, /<Metric label=\{valued.length===rows.length/);
    assert.match(app, /amount=\{snapshot\?\{ada,usd:valued.length\?subtotal:null\}:undefined\}/);
    assert.match(app, /\$\{valued.length\} \/ \$\{included.length\} assets valued/);
    assert.match(read('delegators/portfolio-src/ui.tsx'), /TDSPRuntime.createAdaUsdAmount\(ada,usd\)/);
});

test('all linked addresses feed balances and transaction history, including spent addresses', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    assert.match(app, /_empty:true/);
    assert.match(app, /new Set\(Object.values\(groups\).flat\(\)\)/);
    assert.match(app, /for\(const addressBatch of addressBatches\)/);
    assert.match(app, /summary title="Includes spent addresses"/);
});

test('wallet and exchange addresses use compact shared table rows', () => {
    const app = read('delegators/portfolio-src/App.tsx');
    const cex = read('delegators/portfolio-src/CexAddresses.tsx');
    const byron = read('delegators/portfolio-src/ByronExchanges.tsx');
    assert.match(app, /return <TableRow><TableCell>\{w.label\}/);
    assert.match(cex, /<TableRow key=\{entry.address\}>/);
    assert.match(byron, /title=\{row.address\}/);
    assert.match(byron, /\{short\(row.address\)\}/);
});

test('storage choice is inside Portfolio, optional, and uses the universal settings overlay', () => {
    const entry = read('delegators/portfolio-src/entry.tsx');
    const choice = read('delegators/portfolio-src/StorageChoice.tsx');
    const access = read('delegators/delegator-access.js');
    assert.match(entry, /<StorageChoice/);
    assert.match(entry, /<AssetOverlay id="portfolio-storage-overlay"/);
    assert.match(choice, /Local browser/);
    assert.match(choice, /not wallet-encrypted/);
    assert.match(choice, /Encrypted remote cache/);
    assert.match(choice, /Confirm deletion/);
    assert.match(choice, /disabled=\{mobile\}/);
    assert.match(choice, /Available on desktop, phones and tablets/);
    assert.doesNotMatch(entry, /Portfolio is available on desktop computers only/);
    assert.doesNotMatch(access, /Portfolio is available on desktop computers only/);
    assert.doesNotMatch(access, /await module\.unlockPortfolio/);
});
