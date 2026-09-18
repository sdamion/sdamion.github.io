import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const code = readFileSync(new URL('../shared/runtime.js', import.meta.url), 'utf8');
const start = code.indexOf('    function resizeTextarea(');
const end = code.indexOf('\n    onReady(', start);
const resize = vm.runInNewContext(code.slice(start, end) + '\nresizeTextarea', {
    window: { getComputedStyle: () => ({ minHeight: '128px', maxHeight: '240px', borderTopWidth: '1px', borderBottomWidth: '1px' }) }
});
test('shared textarea sizing grows with content, caps height and shrinks after reset', () => {
    const input = { style: {}, scrollHeight: 30 };
    resize(input);
    assert.equal(input.style.height, '128px');
    input.scrollHeight = 180;
    resize(input);
    assert.equal(input.style.height, '182px');
    input.scrollHeight = 1000;
    resize(input);
    assert.equal(input.style.height, '240px');
    input.scrollHeight = 30;
    resize(input);
    assert.equal(input.style.height, '128px');
});
