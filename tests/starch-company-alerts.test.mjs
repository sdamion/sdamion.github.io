import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../starch/company-alerts.js', import.meta.url), 'utf8');
function setup() {
    const storage = new Map([['tdsp-starch-company-alert-v1', JSON.stringify({ companyId: 'B0ADAD' })]]);
    const notifications = [];
    const state = { enabled: true, permitted: true, payload: {
        online_block: 1, online_updated_at: new Date().toISOString(),
        companies: [{ id: 'B0ADAD', name: 'TDSP', member_ids: ['A', 'B'] }],
        miners: [{ id: 'A', online: true }, { id: 'B', online: false }]
    } };
    const window = {
        TDSPRuntime: { onReady() {}, fetchJson: async () => state.payload },
        TDSPAlerts: { isEnabled: () => state.enabled, canSend: () => state.permitted, send: (...args) => notifications.push(args) }
    };
    vm.runInNewContext(source, { window, document: { getElementById: () => null }, console,
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
    });
    return { monitor: window.TDSPStarchCompanyAlerts, state, notifications, storage };
}
test('alerts once for an offline miner, then re-arms after recovery', async () => {
    const { monitor, state, notifications } = setup();
    await monitor.check();
    await monitor.check();
    assert.equal(notifications.length, 1);
    assert.match(notifications[0][1], /TDSP.*Offline: 1.*B/);
    state.payload.miners[1].online = true;
    await monitor.check();
    state.payload.miners[1].online = false;
    await monitor.check();
    assert.equal(notifications.length, 2);
});
test('stale snapshots, missing roster and unknown miners do not create false offline alerts', async () => {
    for (const mutation of [
        payload => { payload.online_updated_at = '2000-01-01'; },
        payload => { payload.companies[0].member_ids = null; },
        payload => { payload.miners[1].online = null; },
        payload => { payload.online_block = null; }
    ]) {
        const { monitor, state, notifications } = setup();
        mutation(state.payload);
        await monitor.check();
        assert.equal(notifications.length, 0);
    }
});
test('disabled or unpermitted notifications are not sent or marked as delivered', async () => {
    const { monitor, state, notifications } = setup();
    state.enabled = false;
    await monitor.check();
    state.enabled = true;
    state.permitted = false;
    await monitor.check();
    assert.equal(notifications.length, 0);
    state.permitted = true;
    await monitor.check();
    assert.equal(notifications.length, 1);
});
test('unknown data does not reset an existing offline alert', async () => {
    const { monitor, state, notifications } = setup();
    await monitor.check();
    state.payload.miners[1].online = null;
    await monitor.check();
    state.payload.miners[1].online = false;
    await monitor.check();
    assert.equal(notifications.length, 1);
});
test('migrates existing settings and checks multiple companies independently', async () => {
    const { monitor, state, notifications, storage } = setup();
    const key = 'tdsp-starch-company-alert-v1';
    await monitor.check();
    const saved = JSON.parse(storage.get(key));
    assert.equal(saved.companies[0].companyId, 'B0ADAD');
    saved.companies.push({ companyId: 'A1B2C3', offlineIds: [] });
    storage.set(key, JSON.stringify(saved));
    state.payload.companies.push({ id: 'A1B2C3', name: 'Second', member_ids: ['C'] });
    state.payload.miners.push({ id: 'C', online: false });
    await monitor.check();
    assert.equal(notifications.length, 2);
    assert.match(notifications[1][1], /Second.*A1B2C3/);
    await monitor.check();
    assert.equal(notifications.length, 2);
    state.payload.miners[2].online = true;
    await monitor.check();
    state.payload.miners[2].online = false;
    await monitor.check();
    assert.equal(notifications.length, 3);
    storage.set(key, JSON.stringify({ companies: [JSON.parse(storage.get(key)).companies[0]] }));
    await monitor.check();
    assert.equal(notifications.length, 3);
});
test('unavailable company does not prevent other company notifications', async () => {
    const { monitor, storage, notifications } = setup();
    storage.set('tdsp-starch-company-alert-v1', JSON.stringify({ companies: [
        { companyId: 'ABCDEF' }, { companyId: 'B0ADAD' }
    ] }));
    await monitor.check();
    assert.equal(notifications.length, 1);
});
