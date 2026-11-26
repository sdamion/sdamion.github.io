import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../governance/governance.js', import.meta.url), 'utf8');
const start = source.indexOf('function extractGovernanceImageCandidates(');
const end = source.indexOf('function normalizeGovernanceImageSourceBase(', start);

test('opening proposal details resolves image candidates even without an explicit argument', () => {
    assert.ok(start >= 0 && end > start, 'proposal image extraction must remain available');
    const proposal = {meta_json: {body: {title: 'Test'}}, proposal_description: {tag: 'InfoAction'}};
    let sources;
    const render = vm.runInNewContext(source.slice(start, end) + '\naddEmbeddedGovernanceImages', {
        governanceRichText: {extractImageCandidates(value) { sources = value; return []; }}
    });
    assert.doesNotThrow(() => render({}, proposal));
    assert.equal(sources[0], proposal.meta_json);
    assert.equal(sources[1], proposal.meta_json.body);
    assert.equal(sources[2], proposal.proposal_description);
});

test('proposal images retain safe external link and image attributes', () => {
    const node = tag => ({tag, children: [], appendChild(child) { this.children.push(child); }});
    const render = vm.runInNewContext(source.slice(start, end) + '\naddEmbeddedGovernanceImages', {
        document: {createElement: node},
        governanceRichText: {extractImageCandidates() { return [{src: 'https://example.com/action.png', alt: 'Action image'}]; }}
    });
    const container = node('div');
    render(container, {});
    const link = container.children[0].children[1];
    assert.equal(link.href, 'https://example.com/action.png');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.children[0].referrerPolicy, 'no-referrer');
    assert.equal(link.children[0].alt, 'Action image');
});
