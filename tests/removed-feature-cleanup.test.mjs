import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const removedRequests = /\/api\/(?:dreps?|spos?)(?:\/|['"`])|\/__(?:drep_|spo_|retired_spo_|raffle_(?:admin_(?:draw|preview|exclusions|lost_stake|anchor)|prizes|prize_image))/;

test('runtime loaders, dashboard and local proxy no longer reference removed feature APIs', () => {
    for (const file of ['governance/governance.js', 'governance/governance-api.js', 'governance/governance-loader.js', 'delegators/delegator-access.js', 'dev-server.mjs']) assert.doesNotMatch(read(file), removedRequests, file);
    for (const file of ['governance/governance-drep-ncl.js', 'governance/governance-drep-status.js', 'governance/governance-drep-correlation.js', 'governance/governance-drep-top10.js', 'governance/governance-tdsp-drep.js']) assert.equal(existsSync(new URL('../' + file, import.meta.url)), false, file);
    assert.doesNotMatch(read('pool/linked-pool-lists.js'), /TDSPSpoDirectory|hydrate.*SpoCards/);
});

test('governance is read-only while proposal summaries, Ask AI and cached vote results remain', () => {
    const source = read('governance/governance.js');
    assert.doesNotMatch(source, /openGovernanceVoteOverlay|MeshTxBuilder|\.submitTx\(/);
    assert.doesNotMatch(read('governance/governance-action-buttons.js'), /Vote as DRep|onOpenVote|isGovernanceOpenForVoting/);
    assert.match(read('governance/governance-action-buttons.js'), /onOpenGovernanceSummary/);
    assert.match(read('governance/governance-action-buttons.js'), /onAskBot/);
    assert.match(source, /function openDrepVotesOverlay\(/);
    assert.match(source, /function openSpoVotesOverlay\(/);
    assert.doesNotMatch(read('governance/governance-drep-votes.js'), /getProposalRationaleUrl|loadRationale\(/);
});

test('retired translation keys and selectors do not survive in shared assets', () => {
    for (const key of ['close_raffles', 'raffle_title', 'lost_stake', 'drep_registration', 'nakamoto_coefficient']) {
        assert.ok(!read('shared/i18n.js').includes(`'${key}'`), key);
        for (const language of ['nl', 'ja', 'es']) assert.doesNotMatch(read(`locales/${language}.toml`), new RegExp(`^${key}\\s*=`, 'm'));
    }
    assert.doesNotMatch(read('delegators/raffle.css'), /\.raffle-(?:lost-stake-row|prize-image|draw-card)/);
    assert.match(read('delegators/raffle.css'), /\.raffle-lost-stake-toggle/);
    assert.match(read('delegators/raffle.css'), /\.raffle-main/);
    assert.match(read('delegators/delegator-dashboard-template.js'), /id="member-portfolio-open"/);
});
