import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../shared/frame-guard.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function run({ framed }) {
    const listeners = [];
    let cleared = false;
    const self = {};
    const context = {
        window: { self, top: framed ? {} : self },
        document: {
            documentElement: { hidden: false },
            body: { replaceChildren: () => { cleared = true; } },
            addEventListener: (type, listener, options) => listeners.push({ type, listener, options })
        }
    };
    context.window.self = context.window;
    if (!framed) context.window.top = context.window;
    vm.runInNewContext(source, context);
    return { context, listeners, get cleared() { return cleared; } };
}

test('top-level browsing remains visible and interactive', () => {
    const result = run({ framed: false });
    assert.equal(result.context.document.documentElement.hidden, false);
    assert.deepEqual(result.listeners, []);
});

test('frame guard loads synchronously before application scripts', () => {
    const guard = html.indexOf('<script src="shared/frame-guard.js');
    const runtime = html.indexOf('<script src="shared/runtime.js');
    assert.ok(guard > 0);
    assert.ok(runtime > guard);
    assert.doesNotMatch(html.slice(guard, html.indexOf('>', guard) + 1), /\b(?:async|defer)\b/);
});

test('framed browsing is hidden and blocks interaction', () => {
    const result = run({ framed: true });
    assert.equal(result.context.document.documentElement.hidden, true);
    for (const type of ['click', 'submit', 'pointerdown', 'touchstart', 'keydown']) {
        const binding = result.listeners.find(listener => listener.type === type);
        assert.ok(binding, `${type} must be blocked`);
        let prevented = false;
        let stopped = false;
        binding.listener({
            preventDefault: () => { prevented = true; },
            stopImmediatePropagation: () => { stopped = true; }
        });
        assert.equal(prevented, true);
        assert.equal(stopped, true);
        assert.equal(binding.options, true);
    }
    const ready = result.listeners.find(listener => listener.type === 'DOMContentLoaded');
    assert.ok(ready);
    ready.listener();
    assert.equal(result.cleared, true);
});
