import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

class Element {
    constructor(id) { this.dataset = id ? { proposalId: id } : {}; this.children = []; }
    get firstElementChild() { return this.children[0] || null; }
    get nextElementSibling() { return this.parent?.children[this.parent.children.indexOf(this) + 1] || null; }
    remove() {
        if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.parent = null;
    }
    insertBefore(child, before) {
        child.remove();
        const index = before ? this.children.indexOf(before) : this.children.length;
        assert.ok(index >= 0);
        this.children.splice(index, 0, child);
        child.parent = this;
    }
    replaceWith(next) {
        this.parent.insertBefore(next, this);
        this.remove();
    }
    replaceChildren(...children) {
        [...this.children].forEach(child => child.remove());
        children.forEach(child => this.insertBefore(child, null));
    }
}

test('governance refresh preserves unchanged cards and replaces only changed cards', () => {
    const source = readFileSync(new URL('../governance/governance.js', import.meta.url), 'utf8');
    const code = source.slice(source.indexOf('function renderGovernanceGroup('), source.indexOf('function renderGovernanceGroupIfPresent('));
    let created = 0;
    const context = vm.createContext({
        governanceCardSnapshots: new WeakMap(), window: {},
        document: { createElement: () => new Element() },
        createGovernanceCard: proposal => { created++; return new Element(proposal.proposal_id); }
    });
    vm.runInContext(code, context);
    const container = new Element();
    const a = { proposal_id: 'a', yes: 1 };
    const b = { proposal_id: 'b', yes: 2 };
    const render = proposals => context.renderGovernanceGroup(container, proposals, 'Empty');
    render([a, b]);
    const [first, second] = container.children;
    render([a, b]);
    assert.equal(created, 2);
    assert.equal(container.children[0], first);
    render([a, { ...b, yes: 3 }]);
    assert.equal(created, 3);
    assert.equal(container.children[0], first);
    assert.notEqual(container.children[1], second);
    render([{ ...b, yes: 3 }, a]);
    assert.equal(created, 3);
    assert.equal(container.children[1], first);
    render([a]);
    assert.equal(container.children.length, 1);
    assert.equal(container.children[0], first);
    render([]);
    const empty = container.children[0];
    render([]);
    assert.equal(container.children[0], empty);
});

test('universal text setter leaves an unchanged tile untouched', () => {
    const source = readFileSync(new URL('../shared/runtime.js', import.meta.url), 'utf8');
    const code = source.slice(source.indexOf('    function setText('), source.indexOf('    async function copyText('));
    let writes = 0;
    let value = '';
    const attrs = new Map();
    const element = {
        get textContent() { return value; },
        set textContent(text) { writes++; value = text; },
        getAttribute: key => attrs.get(key),
        setAttribute: (key, text) => { writes++; attrs.set(key, text); }
    };
    const context = vm.createContext({ document: { getElementById: () => element }, window: {} });
    vm.runInContext(code, context);
    context.setText('tile', '123');
    const initialWrites = writes;
    context.setText('tile', '123');
    assert.equal(writes, initialWrites);
    context.setText('tile', '124');
    assert.equal(value, '124');
});

test('page does not load the automatic navigation module', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    assert.ok(!html.includes('site-updates.js'));
});
