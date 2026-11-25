import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../delegators/delegator-access.js', import.meta.url), 'utf8');
const setter = source.slice(source.indexOf('function setTranslatedText('), source.indexOf('function loadMesh('));
const render = source.slice(source.indexOf('function renderAdminUsers('), source.indexOf('async function saveAdminUsers('));

test('Admin user counts survive the translation pass triggered by opening overlays', () => {
    class Element {
        attrs = { 'data-i18n-auto-original': '0' };
        textContent = '0';
        setAttribute(name, value) { this.attrs[name] = value; }
    }
    const nodes = { 'raffle-dashboard-admin-count': new Element(), 'raffle-admin-users-count': new Element() };
    vm.runInNewContext(setter + render + '\nrenderAdminUsers([{}, {}]);', {
        HTMLElement: Element,
        document: { getElementById: id => nodes[id] || null },
        t: value => value
    });
    for (let pass = 0; pass < 3; pass++) {
        Object.values(nodes).forEach(node => { node.textContent = node.attrs['data-i18n-auto-original']; });
        assert.equal(nodes['raffle-dashboard-admin-count'].textContent, '2 admins');
        assert.equal(nodes['raffle-admin-users-count'].textContent, '2 admins');
    }
});
