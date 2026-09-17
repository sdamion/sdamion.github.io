import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Council tile opens the universal DRep list instead of an external link', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const js = readFileSync(new URL('../governance/governance.js', import.meta.url), 'utf8');
    assert.match(html, /<div id="drep-council-card"/);
    assert.doesNotMatch(html, /<a id="drep-council-card"/);
    assert.match(js, /\['drep-council-card', openCouncilOverlay\]/);
    assert.match(js, /renderDrepDirectory\(panel, payload.members, \{ showChart: false, layout: 'list' \}\)/);
    assert.match(js, /formatCompactAdaFromLovelace\(payload.total_voting_power\)/);
});
