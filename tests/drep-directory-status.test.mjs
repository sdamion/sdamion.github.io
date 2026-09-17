import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../governance/governance.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('async function loadDrepDirectoryOverlay('), source.indexOf('function renderDrepDirectory('));

for (const inactive of [false, true]) {
    test(`DRep directory filters ${inactive ? 'inactive' : 'active'} entries without changing the shared directory`, async () => {
        let rendered;
        let renderOptions;
        let bot;
        const context = {
            fetchDrepInfoPayload: async () => [
                { id: 'a', active: true, power: 2000000 },
                { id: 'b', active: false, power: 1000000 }
            ],
            loadDrepDirectory: async () => new Map(),
            fetchDrepVoteStatsPayload: async () => null,
            unwrapDrepEntries: entries => entries,
            getDrepEntryIdentifiers: entry => [entry.id],
            normalizeGovernanceIdentifier: id => id,
            shortenDrepIdentifier: id => id,
            extractDrepNameFromEntry: entry => entry.id,
            getDrepEntryVotingPower: entry => entry.power,
            getDrepPinRank: () => 0,
            updateGovernanceMenuHeaderMeta() {},
            updateGovernanceOverlayBotContext: (_, value) => { bot = value; },
            createWebsiteSectionBotContext: (_, value) => value,
            renderDrepDirectory: (_, entries, options) => { rendered = entries; renderOptions = options; }
        };
        vm.createContext(context);
        vm.runInContext(code, context);
        await context.loadDrepDirectoryOverlay({ isConnected: true }, inactive);
        assert.equal(rendered.length, 1);
        assert.equal(renderOptions.showChart, false);
        assert.equal(renderOptions.layout, 'list');
        assert.equal(rendered[0].id, inactive ? 'b' : 'a');
        assert.equal(bot.amount_ada, inactive ? 1 : 2);
        assert.equal(bot.count, 1);
        assert.equal(context.drepDirectoryState.count, 2);
    });
}
