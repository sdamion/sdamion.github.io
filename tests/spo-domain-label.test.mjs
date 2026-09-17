import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../governance/governance.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('function getSpoDomainLabel('), source.indexOf('function openSpoOperatorGroupPools('));

test('Provider aliases never rename independent pools or operator domains', () => {
    const context = { normalizeSpoProviderName: () => 'Amazon Web Services' };
    vm.createContext(context);
    vm.runInContext(code, context);
    assert.equal(context.getSpoDomainLabel({ label: 'Amazonaws', type: 'cloud_provider' }), 'Amazon Web Services');
    for (const type of ['independent_or_unknown_pool', 'multi_provider_pool', 'no_advertised_relay_pool', 'operator']) {
        assert.equal(context.getSpoDomainLabel({ label: 'Amazonaws', type }), 'Amazonaws');
    }
});
