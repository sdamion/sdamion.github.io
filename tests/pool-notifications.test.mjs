import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const code = readFileSync(new URL('../pool/status.js', import.meta.url), 'utf8');

function setup() {
    let payload;
    const alerts = [];
    const elements = new Map(['pool-summary', 'pool-relays'].map(id => [id, {
        textContent: '', appendChild() {}
    }]));
    const runtime = new Proxy({
        fetchJson: async () => payload,
        createSmallText: () => ({})
    }, { get: (target, key) => target[key] || (() => {}) });
    const window = {
        TDSPRuntime: runtime,
        TDSPAlerts: { send: (...args) => alerts.push(args) }
    };
    vm.runInNewContext(code, {
        window, console,
        document: { getElementById: id => elements.get(id) || null }
    });
    return {
        alerts,
        async load(addresses, version, overrides = {}) {
            payload = {
                pool_id: 'tdsp',
                delegators: addresses?.map(address => ({ stake_address: address })),
                delegator_count: addresses?.length,
                updated_at: new Date(version * 1000).toISOString(),
                ...overrides
            };
            await window.TDSPPoolStatus.loadPool();
        }
    };
}

test('silent baseline; detects joins and departures even at the same count', async () => {
    const { load, alerts } = setup();
    await load(['stakeA', 'stakeB'], 1);
    await load(['stakeB', 'stakeA'], 2);
    assert.equal(alerts.length, 0);
    await load(['stakeA', 'stakeC'], 3);
    assert.equal(alerts.length, 2);
    assert.equal(alerts[0][0], 'New TDSP delegators');
    assert.match(alerts[0][1], /stakeC/);
    assert.equal(alerts[1][0], 'Delegators left TDSP');
    assert.match(alerts[1][1], /stakeB/);
    assert.equal(alerts[0][3], 'delegators');
    await load(['stakeA', 'stakeC'], 4);
    assert.equal(alerts.length, 2);
});

test('ignores missing, partial, duplicate, invalid and stale snapshots', async () => {
    const { load, alerts } = setup();
    await load(['stakeA', 'stakeB'], 10);
    await load(null, 11);
    await load([], 12, { delegator_count: 2 });
    await load(['stakeA', 'stakeA'], 13);
    await load(['stakeA', ''], 14);
    await load([], 15, { updated_at: null });
    await load([], 16, { delegator_count: null });
    await load([], 9);
    await load(['stakeA', 'stakeB'], 17);
    assert.equal(alerts.length, 0);
    await load([], 18);
    assert.equal(alerts.length, 1);
    assert.match(alerts[0][1], /^2:/);
});

test('identity changes do not count as delegation changes; handles label new arrivals', async () => {
    const { load, alerts } = setup();
    await load(['stakeA'], 1);
    await load(['stakeA'], 2, { delegators: [{ stake_address: 'stakeA', ada_handle: '$alice' }] });
    assert.equal(alerts.length, 0);
    await load(['stakeA', 'stakeB'], 3, { delegators: [
        { stake_address: 'stakeA', ada_handle: '$alice' },
        { stake_address: 'stakeB', ada_handle: '$bob' }
    ] });
    assert.equal(alerts.length, 1);
    assert.match(alerts[0][1], /\$bob/);
});
