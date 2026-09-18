import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../governance/governance-assistant.js', import.meta.url), 'utf8');
function setup() {
    const handlers = {};
    const requests = [];
    const input = { value: '', style: {}, scrollHeight: 50, focus() {}, addEventListener(name, fn) { handlers[name] = fn; } };
    const submit = { disabled: false };
    const form = { addEventListener(name, fn) { handlers[name] = fn; }, requestSubmit() { return handlers.submit({ preventDefault() {} }); } };
    const messages = { querySelector() { return null; }, appendChild() {} };
    const status = {};
    const elements = { form, question: input, messages, submit, status };
    const panel = { querySelector(selector) { return elements[selector.replace('#constitution-chat-', '')]; } };
    const code = source.slice(source.indexOf('        function setupConstitutionChat('), source.indexOf('        function getConstitutionChatApiUrl('));
    vm.runInNewContext(code + '\nsetupConstitutionChat(panel, { id: "proposal-1" });', {
        panel, document: { createElement: () => ({}) },
        setAssistantText() {}, translateAssistantText: text => text,
        appendConstitutionChatMessage: () => ({ message: { remove() {} }, body: {}, stakePrompt: {} }),
        getConstitutionChatApiUrl: () => '/chat', getConstitutionChatRequestContext: context => context,
        fetchResponse: async (url, options) => {
            requests.push(JSON.parse(options.body));
            return { headers: { get: () => 'application/json' }, json: async () => ({ answer: 'Answer' }) };
        }
    });
    return { requests, input, handlers, form };
}

test('Ask continues four times then resets history while retaining page context', async () => {
    const { requests, input, form } = setup();
    for (let i = 0; i < 6; i++) {
        input.value = 'Explain more';
        await form.requestSubmit();
    }
    assert.deepEqual(requests.map(request => request.history.length), [0, 2, 4, 6, 8, 0]);
    assert.ok(requests.every(request => request.context.id === 'proposal-1'));
    assert.equal(input.style.height, '128px');
});

test('Enter submits Ask; Shift+Enter and IME composition do not submit', async () => {
    const { requests, input, handlers } = setup();
    input.value = 'Question';
    handlers.keydown({ key: 'Enter', shiftKey: true });
    handlers.keydown({ key: 'Enter', isComposing: true });
    assert.equal(requests.length, 0);
    handlers.keydown({ key: 'Enter', preventDefault() {} });
    assert.equal(requests.length, 1);
});

test('one Ask submit button replaces the two chat modes', () => {
    assert.match(source, /setAssistantText\(submit, 'Ask'\)/);
    assert.doesNotMatch(source, /constitution-chat-new-question|Continue Chat|New Chat/);
    assert.match(source, /input.rows = 4/);
});
