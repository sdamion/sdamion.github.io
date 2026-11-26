import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = {window: {}};
vm.runInNewContext(readFileSync(new URL('../governance/governance-catalyst-format.js', import.meta.url), 'utf8'), context);
const format = context.window.TDSPCatalystFormat.create({formatAdaAmount: value => `ADA ${value}`}).formatProposalAmount;

test('Pilot cards ignore synthetic legacy receipt zeros while preserving actual zero payments', () => {
    const pilot = {source: 'project_catalyst_pilot_2026', currency: 'ADA', amount_requested: 140000, amount_requested_usd: null, amount_received: 0, amount_received_usd: 0};
    assert.equal(format(pilot, 'received'), null);
    assert.equal(format({...pilot, amount_received: null, amount_received_usd: null}, 'received'), null);
    assert.equal(format({...pilot, payment_data_available: true}, 'received'), '$0');
    assert.equal(format({amount_received_usd: 0}, 'received'), '$0');
    assert.equal(format(pilot, 'requested'), 'ADA 140000');
});

test('unknown USD values are not formatted as zero; native ADA receipts remain usable', () => {
    assert.equal(format({amount_received_usd: null}, 'received'), null);
    assert.equal(format({amount_received_usd: ''}, 'received'), null);
    assert.equal(format({currency: 'ADA', amount_received: 25000, amount_received_usd: null}, 'received'), 'ADA 25000');
    assert.equal(format({amount_received_usd: 100}, 'received'), '$100');
});
