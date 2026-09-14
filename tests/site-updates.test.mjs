import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const code = readFileSync(new URL('../shared/site-updates.js', import.meta.url), 'utf8');

function setup() {
    const head = (version, asset = 'home/index.js?v=1') => ({
        querySelector: () => version ? { getAttribute: () => version } : null,
        querySelectorAll: () => [{ getAttribute: key => key === 'src' ? asset : null }]
    });
    const intervals = new Map();
    const listeners = new Map();
    const navigations = [];
    const requests = [];
    let latest = head('v1');
    let failure = false;
    let overlays = [];
    const document = {
        head: head('v1'), hidden: false,
        querySelectorAll: () => overlays,
        addEventListener: (name, callback) => listeners.set(name, callback)
    };
    const window = {
        location: { protocol: 'https:', href: 'https://example.com/?keep=yes#pool', replace: url => navigations.push(url) },
        setInterval: (callback, ms) => intervals.set(ms, callback),
        setTimeout: () => 1, clearTimeout() {},
        addEventListener: (name, callback) => listeners.set(name, callback)
    };
    vm.runInNewContext(code, {
        window, document, URL, AbortController,
        DOMParser: class { parseFromString() { return { head: latest }; } },
        fetch: async (url, options) => {
            requests.push({ url, options });
            if (failure) throw new Error('offline');
            return { ok: true, headers: { get: () => 'text/html' }, text: async () => '<html></html>' };
        }
    });
    return {
        document, listeners, navigations, requests,
        update: (version, asset) => { latest = head(version, asset); },
        fail: () => { failure = true; },
        overlay: visible => { overlays = visible ? [{ isConnected: true, closest: () => null, getClientRects: () => [1] }] : []; },
        async check() { intervals.get(60000)(); await new Promise(resolve => setImmediate(resolve)); },
        apply: () => intervals.get(2000)()
    };
}

test('reloads only for a changed version, keeping the section and parameters', async () => {
    const site = setup();
    await site.check();
    assert.equal(site.navigations.length, 0);
    site.update('v2');
    await site.check();
    site.apply();
    assert.equal(site.navigations.length, 1);
    const target = new URL(site.navigations[0]);
    assert.equal(target.hash, '#pool');
    assert.equal(target.searchParams.get('keep'), 'yes');
    assert.ok(target.searchParams.get('__tdsp_version'));
    assert.equal(site.requests[0].options.cache, 'no-store');
});

test('detects entry asset changes and waits until an overlay closes', async () => {
    const site = setup();
    site.overlay(true);
    site.update('v1', 'home/index.js?v=2');
    await site.check();
    assert.equal(site.navigations.length, 0);
    site.overlay(false);
    site.apply();
    assert.equal(site.navigations.length, 1);
});

test('preserves entered text and waits while the document is hidden', async () => {
    const site = setup();
    const field = { isConnected: true, value: 'Unsaved rationale', matches: () => true };
    site.listeners.get('input')({ target: field });
    site.update('v2');
    await site.check();
    assert.equal(site.navigations.length, 0);
    field.value = '';
    site.document.hidden = true;
    site.apply();
    assert.equal(site.navigations.length, 0);
    site.document.hidden = false;
    site.apply();
    assert.equal(site.navigations.length, 1);
});

test('does not reload for an invalid page or failed network request', async () => {
    const site = setup();
    site.update(null);
    await site.check();
    site.fail();
    await site.check();
    assert.equal(site.navigations.length, 0);
});
