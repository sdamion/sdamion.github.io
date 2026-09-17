import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../delegators/delegator-access.js', import.meta.url), 'utf8');
const setter = source.slice(source.indexOf('function setTranslatedText('), source.indexOf('function readLostStakeMessagedAddresses('));
const updates = source.split('\n').filter(line => /setTranslatedText\(document.getElementById\('raffle-(eligible-count|total-stake)'/.test(line)).join('\n');

test('Admin totals survive the translation pass triggered by opening overlays', () => {
    class Element {
        attrs = { 'data-i18n-auto-original': '0' };
        textContent = '0';
        setAttribute(name, value) { this.attrs[name] = value; }
    }
    const nodes = { 'raffle-eligible-count': new Element(), 'raffle-total-stake': new Element() };
    assert.ok(updates.includes('raffle-eligible-count') && updates.includes('raffle-total-stake'));
    vm.runInNewContext(setter + updates, {
        HTMLElement: Element,
        document: { getElementById: id => nodes[id] },
        t: value => value,
        formatAda: value => `ADA ${Number(value) / 1000000}`,
        payload: { pool: { eligible_count: 125, total_eligible_lovelace: '123456000000' } }
    });
    for (let pass = 0; pass < 3; pass++) {
        Object.values(nodes).forEach(node => { node.textContent = node.attrs['data-i18n-auto-original']; });
        assert.equal(nodes['raffle-eligible-count'].textContent, '125');
        assert.equal(nodes['raffle-total-stake'].textContent, 'ADA 123456');
    }
});
