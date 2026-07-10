const DASHBOARD_API_URL = 'https://api.tdsp.online/api/dashboard';
const PROPOSAL_VOTES_API_BASE_URL = 'https://api.tdsp.online/api/proposal';
const DREP_METADATA_API_URL = 'https://api.tdsp.online/api/dreps/metadata';
const DREP_INFO_API_URL = 'https://api.tdsp.online/api/dreps/info';
const DREP_DETAIL_API_BASE_URL = 'https://api.tdsp.online/api/drep';
const LOCAL_DASHBOARD_PROXY_PATH = '/__dashboard_proxy__';
const LOCAL_PROPOSAL_VOTES_PROXY_PATH = '/__proposal_votes_proxy__';
const LOCAL_DREP_DIRECTORY_PROXY_PATH = '/__drep_directory_proxy__';
const LOCAL_DREP_DETAIL_PROXY_PATH = '/__drep_detail_proxy__';
const LOCAL_METADATA_PROXY_PATH = '/__metadata_proxy__';
const ACTIVE_REFRESH_INTERVAL_MS = 60 * 1000;
const EPOCH_DURATION_SECONDS = 432000;
const CARDANO_MAINNET_EPOCH_ZERO_MS = Date.parse('2017-09-23T21:44:51Z');
const APPROVAL_GRACE_PERIOD_SECONDS = 300;
const TREASURY_NET_CHANGE_LIMIT_ADA = 350_000_000;
const TREASURY_NET_CHANGE_LIMIT_LOVELACE = TREASURY_NET_CHANGE_LIMIT_ADA * 1_000_000;
const TREASURY_BUDGET_YEAR_START_EPOCH = 604;
const TREASURY_BUDGET_YEAR_EPOCHS = 73;

let governanceRefreshTimer = null;
let epochCountdownTimer = null;
let epochEndsAtMs = null;
let currentEpochNumber = null;
let lastActiveRenderSignature = '';
let governanceState = null;
const proposalVotesCache = new Map();
const drepMetadataCache = new Map();
let drepDirectoryPromise = null;
let drepStatsPromise = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGovernance);
} else {
    initGovernance();
}

function initGovernance() {
    removeDrepPowerSplitCard();
    ensureEpochCountdownCard();
    loadCurrentEpoch();
    loadGovernanceActions();
}

function removeDrepPowerSplitCard() {
    const powerSplit = document.getElementById('gov-drep-power-split');
    const card = powerSplit?.closest('.governance-summary-box');
    if (card) card.remove();
}

function ensureEpochCountdownCard() {
    if (document.getElementById('menu-epoch')) return;
    if (document.getElementById('gov-epoch-countdown')) return;

    const epochElement = document.getElementById('menu-epoch');
    if (epochElement?.parentElement) return;

    const summary = document.getElementById('governance-summary');
    if (!summary) return;
    const card = document.createElement('div');
    const value = document.createElement('strong');
    const label = document.createElement('span');

    value.id = 'gov-epoch-countdown';
    value.textContent = '--';
    label.textContent = 'Epoch ends in';

    card.appendChild(value);
    card.appendChild(label);
    summary.appendChild(card);
}

async function loadCurrentEpoch() {
    const epochElement = document.getElementById('menu-epoch');
    if (!epochElement) return;

    updateEpochCountdownFromMainnetClock();
}

async function loadGovernanceActions() {
    const groups = {
        active: document.getElementById('governance-active'),
        approved: document.getElementById('governance-approved'),
        rejected: document.getElementById('governance-rejected'),
        info: document.getElementById('governance-info')
    };

    if (!groups.active || !groups.approved || !groups.rejected || !groups.info) return;

    try {
        const dashboardPayload = await fetchGovernanceDashboardPayload();
        governanceState = dashboardPayload;
        const proposals = getGovernanceProposalsFromDashboardPayload(dashboardPayload);
        if (!proposals.length) {
            throw new Error('No governance proposals found in dashboard payload');
        }
        const grouped = groupGovernanceProposals(proposals);

        renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
        renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
        renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
        renderGovernanceGroup(groups.info, grouped.info, 'No info actions found.');
        refreshActiveGovernanceCardVotes(grouped.active);
        await updateGovernanceCounts(grouped);
        lastActiveRenderSignature = getGovernanceGroupSignature(grouped.active);
        updateEpochDisplayFromDashboardPayload(dashboardPayload);
        scheduleActiveRefresh();
    } catch (error) {
        Object.values(groups).forEach(group => {
            group.textContent = '';
            const message = document.createElement('p');
            message.className = 'small-text';
            message.textContent = 'Governance actions could not be loaded. Open GovTool for the full overview.';
            group.appendChild(message);
        });
    }
}

async function refreshActiveGovernanceGroup() {
    const groups = {
        active: document.getElementById('governance-active'),
        approved: document.getElementById('governance-approved'),
        rejected: document.getElementById('governance-rejected'),
        info: document.getElementById('governance-info')
    };
    if (!groups.active || !groups.approved || !groups.rejected || !groups.info) return;

    const dashboardPayload = await fetchGovernanceDashboardPayload().catch(() => null);
    if (!dashboardPayload) return;
    governanceState = dashboardPayload;
    updateEpochDisplayFromDashboardPayload(dashboardPayload);
    const proposals = getGovernanceProposalsFromDashboardPayload(dashboardPayload);
    const grouped = groupGovernanceProposals(proposals);
    const activeProposals = grouped.active;

    const nextSignature = getGovernanceGroupSignature(activeProposals);
    if (nextSignature === lastActiveRenderSignature) return;

    renderGovernanceGroup(groups.active, grouped.active, 'No active actions found.');
    renderGovernanceGroup(groups.approved, grouped.approved, 'No approved actions found.');
    renderGovernanceGroup(groups.rejected, grouped.rejected, 'No rejected actions found.');
    renderGovernanceGroup(groups.info, grouped.info, 'No info actions found.');
    refreshActiveGovernanceCardVotes(grouped.active);
    await updateGovernanceCounts(grouped);
    lastActiveRenderSignature = nextSignature;
}

function scheduleActiveRefresh() {
    if (governanceRefreshTimer !== null) return;

    governanceRefreshTimer = window.setInterval(() => {
        refreshActiveGovernanceGroup().catch(() => {});
    }, ACTIVE_REFRESH_INTERVAL_MS);
}

async function fetchGovernanceDashboardPayload() {
    if (shouldUseLocalDashboardProxy()) {
        return fetchJson(LOCAL_DASHBOARD_PROXY_PATH);
    }
    return fetchJson(DASHBOARD_API_URL);
}

function shouldUseLocalDashboardProxy() {
    const host = window.location.hostname;
    return host === '127.0.0.1' || host === 'localhost';
}

function getProposalVotesApiUrl(proposalId) {
    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ proposalId });
        return `${LOCAL_PROPOSAL_VOTES_PROXY_PATH}?${params.toString()}`;
    }

    return `${PROPOSAL_VOTES_API_BASE_URL}/${encodeURIComponent(proposalId)}/votes`;
}

function getDashboardEpoch(payload) {
    const firstItem = Array.isArray(payload?.data) ? payload.data[0] : null;
    const firstProposal = Array.isArray(payload?.proposals) ? payload.proposals[0] : null;
    const candidates = [
        payload?.epoch,
        payload?.epoch_no,
        payload?.current_epoch,
        payload?.tip?.[0]?.epoch_no,
        firstProposal?.voting_summary?.epoch_no,
        firstProposal?.vote_summary?.epoch_no,
        firstProposal?.proposed_epoch,
        firstItem?.voting_summary?.epoch_no,
        firstItem?.vote_summary?.epoch_no,
        firstItem?.proposal?.proposed_epoch,
        firstItem?.proposed_epoch
    ];

    return candidates.map(Number).find(Number.isFinite) ?? null;
}

function getDashboardTip(payload = governanceState) {
    if (Array.isArray(payload?.tip) && payload.tip.length) return payload.tip[0];
    return payload?.tip || null;
}

function updateEpochDisplayFromDashboardPayload(payload) {
    updateEpochCountdownFromMainnetClock();
}

function updateEpochCountdownFromDashboardPayload(payload) {
    updateEpochCountdownFromMainnetClock();
}

function updateEpochCountdownFromMainnetClock() {
    const clockEpoch = getClockEpochSnapshot();
    currentEpochNumber = clockEpoch.epoch;
    epochEndsAtMs = clockEpoch.endsAtMs;
    const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
    updateEpochCountdownDisplay(remainingSeconds);
    startEpochCountdownTimer();
}

function getClockEpochSnapshot(nowMs = Date.now()) {
    const epochDurationMs = EPOCH_DURATION_SECONDS * 1000;
    const elapsedEpochs = Math.max(Math.floor((nowMs - CARDANO_MAINNET_EPOCH_ZERO_MS) / epochDurationMs), 0);
    return {
        epoch: elapsedEpochs,
        endsAtMs: CARDANO_MAINNET_EPOCH_ZERO_MS + ((elapsedEpochs + 1) * epochDurationMs)
    };
}

function startEpochCountdownTimer() {
    if (epochCountdownTimer !== null) return;

    epochCountdownTimer = window.setInterval(() => {
        if (!Number.isFinite(epochEndsAtMs)) {
            updateEpochCountdownDisplay(null);
            return;
        }
        const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
        if (remainingSeconds <= 0) {
            rollEpochCountdownForward();
            return;
        }
        updateEpochCountdownDisplay(remainingSeconds);
    }, 1000);
}

function rollEpochCountdownForward() {
    if (!Number.isFinite(epochEndsAtMs)) {
        updateEpochCountdownDisplay(null);
        return;
    }

    const epochDurationMs = EPOCH_DURATION_SECONDS * 1000;
    const elapsedEpochs = Math.max(Math.floor((Date.now() - epochEndsAtMs) / epochDurationMs) + 1, 1);
    epochEndsAtMs += elapsedEpochs * epochDurationMs;
    if (Number.isFinite(currentEpochNumber)) currentEpochNumber += elapsedEpochs;

    const remainingSeconds = Math.max(Math.ceil((epochEndsAtMs - Date.now()) / 1000), 0);
    updateEpochCountdownDisplay(remainingSeconds);
}

function updateEpochCountdownDisplay(remainingSeconds) {
    const menuEpochElement = document.getElementById('menu-epoch');
    if (menuEpochElement) {
        const epochText = Number.isFinite(currentEpochNumber) ? `Epoch ${currentEpochNumber}` : 'Epoch ...';
        menuEpochElement.textContent = Number.isFinite(remainingSeconds)
            ? `${epochText} ${formatEpochCountdown(remainingSeconds)} left`
            : epochText;
        return;
    }

    const countdownElement = document.getElementById('gov-epoch-countdown');
    if (!countdownElement) return;
    countdownElement.textContent = Number.isFinite(remainingSeconds)
        ? formatEpochCountdown(remainingSeconds)
        : '--';
}

function formatEpochCountdown(totalSeconds) {
    const seconds = Math.max(Math.floor(totalSeconds), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(remainingSeconds).padStart(2, '0')
    ].join(':');
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let detail = '';
        try {
            const payload = await response.json();
            detail = payload?.detail || payload?.error || '';
        } catch {
            detail = '';
        }
        throw new Error(detail ? `HTTP ${response.status}: ${detail}` : `HTTP ${response.status}`);
    }
    return response.json();
}

function getGovernanceProposalsFromDashboardPayload(payload) {
    const proposals = Array.isArray(payload?.proposals) ? payload.proposals : [];
    if (proposals.length) {
        return proposals
            .map(item => normalizeGovernanceProposal(
                item?.proposal || item,
                item?.voting_summary || item?.vote_summary || item?.summary || item?.vote_percentages || item?.votePercentages || null,
                item
            ))
            .filter(proposal => proposal?.proposal_id);
    }

    const items = Array.isArray(payload?.data) ? payload.data : [];
    return items
        .map(item => normalizeGovernanceProposal(
            item?.proposal || item,
            item?.voting_summary || item?.vote_summary || item?.summary || item?.vote_percentages || item?.votePercentages || null,
            item
        ))
        .filter(proposal => proposal?.proposal_id);
}

function normalizeGovernanceProposal(proposal, linkedSummary = null, container = null) {
    const normalized = { ...proposal };
    normalized.proposal_id = proposal?.proposal_id || proposal?.id || proposal?.gov_action_id || proposal?.action_id || '';
    normalized.proposal_tx_hash = proposal?.proposal_tx_hash || proposal?.tx_hash || proposal?.transaction_hash || '';
    normalized.proposal_type = proposal?.proposal_type || proposal?.type || proposal?.gov_action_type || 'Governance';
    normalized.block_time = proposal?.block_time ?? proposal?.created_at ?? proposal?.createdAt ?? proposal?.time ?? 0;
    normalized.proposed_epoch = coerceNullableNumber(proposal?.proposed_epoch ?? proposal?.proposal_epoch ?? proposal?.epoch);
    normalized.expiration = coerceNullableNumber(proposal?.expiration ?? proposal?.expires_epoch ?? proposal?.expired_after_epoch);
    normalized.ratified_epoch = coerceNullableNumber(proposal?.ratified_epoch ?? proposal?.ratifiedEpoch);
    normalized.enacted_epoch = coerceNullableNumber(proposal?.enacted_epoch ?? proposal?.enactedEpoch);
    normalized.expired_epoch = coerceNullableNumber(proposal?.expired_epoch ?? proposal?.expiredEpoch);
    normalized.dropped_epoch = coerceNullableNumber(proposal?.dropped_epoch ?? proposal?.droppedEpoch);
    normalized.deposit = proposal?.deposit ?? proposal?.deposit_lovelace ?? '';
    normalized.return_address = proposal?.return_address ?? proposal?.returnAddress ?? '';
    normalized.meta_url = proposal?.meta_url ?? proposal?.metadata_url ?? proposal?.url ?? '';
    normalized.meta_json = proposal?.meta_json ?? proposal?.metadata ?? proposal?.meta ?? {};
    normalized.proposal_description = proposal?.proposal_description ?? proposal?.description ?? null;
    let rawVoteSummary = normalizeVotingSummary(
        linkedSummary
        || container?.voting_summary
        || container?.vote_summary
        || container?.summary
        || container?.vote_percentages
        || container?.votePercentages
        || proposal?.voteSummary
        || proposal?.voting_summary
        || proposal?.summary
        || proposal?.vote_summary
        || proposal?.votes
        || proposal?.voting
        || null
    );
    if (!hasStructuredVoteSummary(rawVoteSummary)) {
        rawVoteSummary = normalizeGenericVotePercentages(
            container?.vote_percentages
            || container?.votePercentages
            || proposal?.vote_percentages
            || proposal?.votePercentages
            || null,
            normalized
        );
    }
    normalized.voteSummary = hasStructuredVoteSummary(rawVoteSummary) ? rawVoteSummary : null;
    normalized.voteDisplay = getVoteDisplayFromProposalSummary(normalized.voteSummary, normalized);
    normalized.votePercentages = normalized.voteDisplay?.percentages || null;
    applyDerivedGovernanceStatus(normalized, container || proposal);
    return normalized;
}

function applyDerivedGovernanceStatus(normalized, rawProposal) {
    const rawStatus = String(
        rawProposal?.status
        || rawProposal?.proposal_status
        || rawProposal?.governance_status
        || rawProposal?.state
        || ''
    ).toLowerCase();

    if (rawStatus.includes('reject') || rawStatus.includes('drop') || rawStatus.includes('expire')) {
        normalized.dropped_epoch = normalized.dropped_epoch ?? normalized.proposed_epoch ?? 0;
        return;
    }

    if (rawStatus.includes('approve') || rawStatus.includes('ratif') || rawStatus.includes('enact')) {
        normalized.ratified_epoch = normalized.ratified_epoch ?? normalized.proposed_epoch ?? 0;
    }
}

function normalizeVotingSummary(summary) {
    if (!summary || typeof summary !== 'object') return null;
    return {
        ...summary,
        drep_yes_pct: pickFirstNumber(
            summary.drep_yes_pct, summary.drep_yes_percentage, summary.drep_yes_percent, summary.drepYesPct, summary.drepYesPercentage,
            summary.drep?.yes_pct, summary.drep?.yes_percentage, summary.drep?.yes_percent, summary.drep?.yesPct, summary.drep?.yesPercentage, summary.drep?.yes,
            summary.drep_votes?.yes_pct, summary.drep_votes?.yes_percentage, summary.drep_votes?.yes, summary.drepVotes?.yesPct, summary.drepVotes?.yesPercentage, summary.drepVotes?.yes,
            summary.votes?.drep?.yes_pct, summary.votes?.drep?.yes_percentage, summary.votes?.drep?.yes
        ),
        drep_no_pct: pickFirstNumber(
            summary.drep_no_pct, summary.drep_no_percentage, summary.drep_no_percent, summary.drepNoPct, summary.drepNoPercentage,
            summary.drep?.no_pct, summary.drep?.no_percentage, summary.drep?.no_percent, summary.drep?.noPct, summary.drep?.noPercentage, summary.drep?.no,
            summary.drep_votes?.no_pct, summary.drep_votes?.no_percentage, summary.drep_votes?.no, summary.drepVotes?.noPct, summary.drepVotes?.noPercentage, summary.drepVotes?.no,
            summary.votes?.drep?.no_pct, summary.votes?.drep?.no_percentage, summary.votes?.drep?.no
        ),
        drep_abstain_pct: pickFirstNumber(
            summary.drep_abstain_pct, summary.drep_abstain_percentage, summary.drep_abstain_percent, summary.drepAbstainPct, summary.drepAbstainPercentage,
            summary.drep?.abstain_pct, summary.drep?.abstain_percentage, summary.drep?.abstain_percent, summary.drep?.abstainPct, summary.drep?.abstainPercentage, summary.drep?.abstain,
            summary.drep_votes?.abstain_pct, summary.drep_votes?.abstain_percentage, summary.drep_votes?.abstain, summary.drepVotes?.abstainPct, summary.drepVotes?.abstainPercentage, summary.drepVotes?.abstain,
            summary.votes?.drep?.abstain_pct, summary.votes?.drep?.abstain_percentage, summary.votes?.drep?.abstain
        ),
        pool_yes_pct: pickFirstNumber(
            summary.pool_yes_pct, summary.pool_yes_percentage, summary.pool_yes_percent, summary.poolYesPct, summary.poolYesPercentage,
            summary.spo_yes_pct, summary.spo_yes_percentage, summary.spo_yes_percent, summary.spoYesPct, summary.spoYesPercentage,
            summary.pool?.yes_pct, summary.pool?.yes_percentage, summary.pool?.yes_percent, summary.pool?.yesPct, summary.pool?.yesPercentage, summary.pool?.yes,
            summary.spo?.yes_pct, summary.spo?.yes_percentage, summary.spo?.yes_percent, summary.spo?.yesPct, summary.spo?.yesPercentage, summary.spo?.yes,
            summary.pool_votes?.yes_pct, summary.pool_votes?.yes_percentage, summary.pool_votes?.yes, summary.poolVotes?.yesPct, summary.poolVotes?.yesPercentage, summary.poolVotes?.yes,
            summary.spo_votes?.yes_pct, summary.spo_votes?.yes_percentage, summary.spo_votes?.yes, summary.spoVotes?.yesPct, summary.spoVotes?.yesPercentage, summary.spoVotes?.yes,
            summary.votes?.pool?.yes_pct, summary.votes?.pool?.yes_percentage, summary.votes?.pool?.yes,
            summary.votes?.spo?.yes_pct, summary.votes?.spo?.yes_percentage, summary.votes?.spo?.yes
        ),
        pool_no_pct: pickFirstNumber(
            summary.pool_no_pct, summary.pool_no_percentage, summary.pool_no_percent, summary.poolNoPct, summary.poolNoPercentage,
            summary.spo_no_pct, summary.spo_no_percentage, summary.spo_no_percent, summary.spoNoPct, summary.spoNoPercentage,
            summary.pool?.no_pct, summary.pool?.no_percentage, summary.pool?.no_percent, summary.pool?.noPct, summary.pool?.noPercentage, summary.pool?.no,
            summary.spo?.no_pct, summary.spo?.no_percentage, summary.spo?.no_percent, summary.spo?.noPct, summary.spo?.noPercentage, summary.spo?.no,
            summary.pool_votes?.no_pct, summary.pool_votes?.no_percentage, summary.pool_votes?.no, summary.poolVotes?.noPct, summary.poolVotes?.noPercentage, summary.poolVotes?.no,
            summary.spo_votes?.no_pct, summary.spo_votes?.no_percentage, summary.spo_votes?.no, summary.spoVotes?.noPct, summary.spoVotes?.noPercentage, summary.spoVotes?.no,
            summary.votes?.pool?.no_pct, summary.votes?.pool?.no_percentage, summary.votes?.pool?.no,
            summary.votes?.spo?.no_pct, summary.votes?.spo?.no_percentage, summary.votes?.spo?.no
        ),
        pool_abstain_pct: pickFirstNumber(
            summary.pool_abstain_pct, summary.pool_abstain_percentage, summary.pool_abstain_percent, summary.poolAbstainPct, summary.poolAbstainPercentage,
            summary.spo_abstain_pct, summary.spo_abstain_percentage, summary.spo_abstain_percent, summary.spoAbstainPct, summary.spoAbstainPercentage,
            summary.pool?.abstain_pct, summary.pool?.abstain_percentage, summary.pool?.abstain_percent, summary.pool?.abstainPct, summary.pool?.abstainPercentage, summary.pool?.abstain,
            summary.spo?.abstain_pct, summary.spo?.abstain_percentage, summary.spo?.abstain_percent, summary.spo?.abstainPct, summary.spo?.abstainPercentage, summary.spo?.abstain,
            summary.pool_votes?.abstain_pct, summary.pool_votes?.abstain_percentage, summary.pool_votes?.abstain, summary.poolVotes?.abstainPct, summary.poolVotes?.abstainPercentage, summary.poolVotes?.abstain,
            summary.spo_votes?.abstain_pct, summary.spo_votes?.abstain_percentage, summary.spo_votes?.abstain, summary.spoVotes?.abstainPct, summary.spoVotes?.abstainPercentage, summary.spoVotes?.abstain,
            summary.votes?.pool?.abstain_pct, summary.votes?.pool?.abstain_percentage, summary.votes?.pool?.abstain,
            summary.votes?.spo?.abstain_pct, summary.votes?.spo?.abstain_percentage, summary.votes?.spo?.abstain
        ),
        committee_yes_pct: pickFirstNumber(summary.committee_yes_pct, summary.committee?.yes_pct, summary.committee?.yes),
        committee_no_pct: pickFirstNumber(summary.committee_no_pct, summary.committee?.no_pct, summary.committee?.no),
        drep_yes_votes_cast: pickFirstNumber(summary.drep_yes_votes_cast, summary.drep?.yes_votes_cast, summary.drep_yes_votes),
        drep_no_votes_cast: pickFirstNumber(summary.drep_no_votes_cast, summary.drep?.no_votes_cast, summary.drep_no_votes),
        drep_abstain_votes_cast: pickFirstNumber(summary.drep_abstain_votes_cast, summary.drep?.abstain_votes_cast, summary.drep_abstain_votes),
        drep_active_yes_vote_power: pickFirstNumber(summary.drep_active_yes_vote_power, summary.drep?.active_yes_vote_power, summary.drep_yes_vote_power, summary.drep?.yes_vote_power, summary.drep_yes_stake),
        drep_active_no_vote_power: pickFirstNumber(summary.drep_active_no_vote_power, summary.drep?.active_no_vote_power, summary.drep_no_vote_power, summary.drep?.no_vote_power, summary.drep_no_stake),
        drep_yes_vote_power: pickFirstNumber(summary.drep_yes_vote_power, summary.drep?.yes_vote_power, summary.drep_yes_stake),
        drep_no_vote_power: pickFirstNumber(summary.drep_no_vote_power, summary.drep?.no_vote_power, summary.drep_no_stake),
        drep_active_abstain_vote_power: pickFirstNumber(summary.drep_active_abstain_vote_power, summary.drep?.active_abstain_vote_power, summary.drep_abstain_vote_power, summary.drep?.abstain_vote_power),
        drep_always_abstain_vote_power: pickFirstNumber(summary.drep_always_abstain_vote_power, summary.drep?.always_abstain_vote_power),
        drep_always_no_confidence_vote_power: pickFirstNumber(summary.drep_always_no_confidence_vote_power, summary.drep?.always_no_confidence_vote_power),
        pool_yes_votes_cast: pickFirstNumber(summary.pool_yes_votes_cast, summary.spo_yes_votes_cast, summary.pool?.yes_votes_cast, summary.pool_yes_votes),
        pool_no_votes_cast: pickFirstNumber(summary.pool_no_votes_cast, summary.spo_no_votes_cast, summary.pool?.no_votes_cast, summary.pool_no_votes),
        pool_abstain_votes_cast: pickFirstNumber(summary.pool_abstain_votes_cast, summary.spo_abstain_votes_cast, summary.pool?.abstain_votes_cast, summary.pool_abstain_votes),
        pool_yes_vote_power: pickFirstNumber(summary.pool_yes_vote_power, summary.spo_yes_vote_power, summary.pool?.yes_vote_power, summary.pool_yes_stake),
        pool_no_vote_power: pickFirstNumber(summary.pool_no_vote_power, summary.spo_no_vote_power, summary.pool?.no_vote_power, summary.pool_no_stake),
        pool_active_abstain_vote_power: pickFirstNumber(summary.pool_active_abstain_vote_power, summary.spo_active_abstain_vote_power, summary.pool?.active_abstain_vote_power),
        pool_abstain_vote_power: pickFirstNumber(summary.pool_abstain_vote_power, summary.spo_abstain_vote_power, summary.pool?.abstain_vote_power, summary.pool_abstain_stake)
    };
}

function normalizeGenericVotePercentages(percentages, proposal) {
    if (!percentages || typeof percentages !== 'object') return null;

    const yes = pickFirstNumber(
        percentages.yes_pct,
        percentages.yes_percentage,
        percentages.yesPercent,
        percentages.yes
    );
    const no = pickFirstNumber(
        percentages.no_pct,
        percentages.no_percentage,
        percentages.noPercent,
        percentages.no
    );
    const abstain = pickFirstNumber(
        percentages.abstain_pct,
        percentages.abstain_percentage,
        percentages.abstainPercent,
        percentages.abstain,
        Number.isFinite(yes) && Number.isFinite(no) ? 100 - yes - no : null
    );

    if (![yes, no, abstain].every(Number.isFinite)) return null;

    if (usesPoolVoting(proposal)) {
        return {
            pool_yes_pct: yes,
            pool_no_pct: no,
            pool_abstain_pct: abstain
        };
    }

    return {
        drep_yes_pct: yes,
        drep_no_pct: no,
        drep_abstain_pct: abstain
    };
}

function hasStructuredVoteSummary(summary) {
    if (!summary || typeof summary !== 'object') return false;

    return [
        summary.drep_yes_pct,
        summary.drep_no_pct,
        summary.drep_abstain_pct,
        summary.pool_yes_pct,
        summary.pool_no_pct,
        summary.pool_abstain_pct,
        summary.drep_yes_votes_cast,
        summary.drep_no_votes_cast,
        summary.drep_abstain_votes_cast,
        summary.pool_yes_votes_cast,
        summary.pool_no_votes_cast,
        summary.pool_abstain_votes_cast,
        summary.drep_yes_vote_power,
        summary.drep_no_vote_power,
        summary.pool_yes_vote_power,
        summary.pool_no_vote_power
    ].some(value => Number.isFinite(Number(value)));
}

function pickFirstNumber(...values) {
    for (const value of values) {
        const number = normalizePercentageNumber(value);
        if (Number.isFinite(number)) return number;
    }
    return null;
}

function normalizePercentageNumber(value) {
    if (value === null || value === undefined || value === '') return NaN;
    const number = Number(value);
    if (!Number.isFinite(number)) return NaN;
    return number;
}

function coerceNullableNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function groupGovernanceProposals(proposals) {
    const groups = proposals.reduce((grouped, proposal) => {
        grouped[getGovernanceStatus(proposal)].push(proposal);
        return grouped;
    }, { active: [], approved: [], rejected: [], info: [] });

    groups.active.sort((a, b) => {
        const aTime = Number(a.block_time) || 0;
        const bTime = Number(b.block_time) || 0;
        return aTime - bTime;
    });

    return groups;
}

function getVoteDisplayFromProposalSummary(summary, proposal) {
    if (!summary) return null;

    const poolHasRealVotes = (Number(summary.pool_yes_votes_cast) || 0)
        + (Number(summary.pool_no_votes_cast) || 0)
        + (Number(summary.pool_abstain_votes_cast) || 0) > 0;
    const poolHasRealPower = (Number(summary.pool_yes_vote_power) || 0) > 0
        || (Number(summary.pool_no_vote_power) || 0) > 0
        || (Number(summary.pool_active_abstain_vote_power) || 0) > 0;

    if (usesPoolVoting(proposal) && (poolHasRealVotes || poolHasRealPower)) {
        const percentages = getPercentagesFromSummary(summary, 'pool');
        if (percentages) {
            return { source: 'pool', label: 'SPO', percentages };
        }
    }

    const drepPercentages = getPercentagesFromSummary(summary, 'drep');
    if (drepPercentages) {
        return { source: 'drep', label: 'DRep', percentages: drepPercentages };
    }

    return null;
}

function getPercentagesFromSummary(summary, prefix) {
    const votePowerPercentages = getPercentagesFromVotePower(summary, prefix);
    if (votePowerPercentages) return votePowerPercentages;

    const voteCountPercentages = getPercentagesFromVoteCounts(summary, prefix);
    if (voteCountPercentages) return voteCountPercentages;

    const yes = normalizePercentageNumber(summary[`${prefix}_yes_pct`]);
    const no = normalizePercentageNumber(summary[`${prefix}_no_pct`]);
    if (![yes, no].every(Number.isFinite)) return null;
    const total = yes + no;
    if (total <= 0) return null;
    return {
        yes: (yes / total) * 100,
        no: (no / total) * 100,
        abstain: 0
    };
}

function getPercentagesFromVoteCounts(summary, prefix) {
    const yes = Number(summary[`${prefix}_yes_votes_cast`]) || 0;
    const no = Number(summary[`${prefix}_no_votes_cast`]) || 0;
    const total = yes + no;
    if (total <= 0) return null;
    return {
        yes: (yes / total) * 100,
        no: (no / total) * 100,
        abstain: 0
    };
}

function getPercentagesFromVotePower(summary, prefix) {
    const yes = pickFirstNumber(
        summary[`${prefix}_yes_vote_power`],
        summary[`${prefix}_active_yes_vote_power`],
        summary[`${prefix}_yes_stake`]
    ) || 0;
    const no = pickFirstNumber(
        summary[`${prefix}_no_vote_power`],
        summary[`${prefix}_active_no_vote_power`],
        summary[`${prefix}_no_stake`]
    ) || 0;
    const total = yes + no;
    if (total <= 0) return null;
    return {
        yes: (yes / total) * 100,
        no: (no / total) * 100,
        abstain: 0
    };
}

function usesPoolVoting(proposal) {
    return proposal?.proposal_type === 'HardForkInitiation'
        || proposal?.proposal_type === 'ParameterChange';
}

function getGovernanceStatus(proposal) {
    if (proposal?.proposal_type === 'InfoAction') return 'info';
    if (meetsGovernanceApprovalThreshold(proposal)) return 'approved';
    if (proposal.dropped_epoch !== null || proposal.expired_epoch !== null) return 'rejected';
    if (proposal.ratified_epoch !== null || proposal.enacted_epoch !== null) return 'approved';
    return 'active';
}

function meetsGovernanceApprovalThreshold(proposal) {
    const yes = Number(proposal?.votePercentages?.yes);
    if (!Number.isFinite(yes)) return false;
    if (!hasPassedExpirationGracePeriod(proposal)) return false;

    if (proposal?.voteDisplay?.source === 'pool') {
        return yes >= 50;
    }

    return yes >= 67;
}

function hasPassedExpirationGracePeriod(proposal) {
    const expirationEpoch = Number(proposal?.expiration);
    if (!Number.isFinite(expirationEpoch)) return false;

    const clockEpoch = getClockEpochSnapshot();
    const currentEpoch = clockEpoch.epoch;
    const currentEpochSlot = Math.floor((Date.now() - CARDANO_MAINNET_EPOCH_ZERO_MS) / 1000) % EPOCH_DURATION_SECONDS;

    if (!Number.isFinite(currentEpoch) || !Number.isFinite(currentEpochSlot)) return false;
    if (currentEpoch < expirationEpoch) return false;
    if (currentEpoch === expirationEpoch) return false;

    const elapsedSinceExpirationEnd = ((currentEpoch - expirationEpoch - 1) * EPOCH_DURATION_SECONDS) + currentEpochSlot;
    return elapsedSinceExpirationEnd >= APPROVAL_GRACE_PERIOD_SECONDS;
}

function shouldShowVotePercentages(proposal) {
    return Boolean(proposal?.proposal_id);
}

function renderGovernanceGroup(container, proposals, emptyMessage) {
    container.textContent = '';

    if (!proposals.length) {
        const empty = document.createElement('p');
        empty.className = 'small-text';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    proposals.forEach(proposal => {
        container.appendChild(createGovernanceCard(proposal));
    });
}

function createGovernanceCard(proposal) {
    const card = document.createElement('button');
    card.className = 'governance-card';
    card.type = 'button';
    card.dataset.proposalId = proposal.proposal_id;
    card.addEventListener('click', () => openGovernanceOverlay(proposal));

    const title = document.createElement('span');
    title.className = 'governance-title';
    title.textContent = getProposalTitle(proposal);

    const expiration = document.createElement('span');
    expiration.className = 'governance-expiration';
    expiration.textContent = getExpirationText(proposal);

    const metadataItems = getActiveGovernanceCardMetadata(proposal);
    const votes = document.createElement('span');
    const governanceStatus = getGovernanceStatus(proposal);
    if (governanceStatus === 'active' || !proposal.votePercentages) {
        votes.className = 'governance-votes vote-neutral';
        votes.textContent = 'Open for live votes';
    } else {
        votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source)}`;
        votes.textContent = formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source);
    }

    card.appendChild(title);
    card.appendChild(expiration);
    metadataItems.forEach(item => {
        const detail = document.createElement('span');
        detail.className = 'governance-card-detail';
        detail.textContent = `${item.label} ${item.value}`;
        card.appendChild(detail);
    });
    if (shouldShowVotePercentages(proposal)) card.appendChild(votes);

    return card;
}

function refreshActiveGovernanceCardVotes(proposals) {
    if (!Array.isArray(proposals)) return;

    proposals
        .filter(proposal => proposal?.proposal_id)
        .forEach(proposal => {
            fetchProposalVotesPayload(proposal.proposal_id)
                .then(payload => {
                    const detailProposal = mergeProposalVoteDetails(proposal, payload);
                    updateGovernanceCardVotes(proposal.proposal_id, detailProposal);
                })
                .catch(() => {});
        });
}

function getTreasuryBudgetMetadata(proposal) {
    if (proposal?.proposal_type !== 'TreasuryWithdrawals') return [];

    const usedThisYear = getTreasuryBudgetUsedThisYear();
    const remaining = Math.max(TREASURY_NET_CHANGE_LIMIT_LOVELACE - usedThisYear, 0);

    return [
        {
            label: 'Net change limit',
            value: formatCompactAdaFromLovelace(TREASURY_NET_CHANGE_LIMIT_LOVELACE, { fixedFractionDigits: 2 })
        },
        {
            label: 'Used this year',
            value: formatCompactAdaFromLovelace(usedThisYear, { fixedFractionDigits: 2 })
        },
        {
            label: 'To be allocated',
            value: formatCompactAdaFromLovelace(remaining, { fixedFractionDigits: 2 })
        }
    ];
}

function updateTreasuryBudgetBar() {
    const usedThisYear = getTreasuryBudgetUsedThisYear();
    const remaining = Math.max(TREASURY_NET_CHANGE_LIMIT_LOVELACE - usedThisYear, 0);
    const activeAskTotal = getActiveTreasuryProposalAskTotal();
    const afterTotalSpend = remaining - activeAskTotal;

    setBudgetBarItem('gov-budget-limit', 'Net change limit', formatCompactAdaFromLovelace(TREASURY_NET_CHANGE_LIMIT_LOVELACE, { fixedFractionDigits: 2 }));
    setBudgetBarItem('gov-budget-used', 'Used this year', formatCompactAdaFromLovelace(usedThisYear, { fixedFractionDigits: 2 }));
    setBudgetBarItem(
        'gov-budget-remaining',
        'To be allocated',
        formatCompactAdaFromLovelace(remaining, { fixedFractionDigits: 2 }),
        false,
        getBudgetAmountTone(remaining)
    );
    setBudgetBarItem(
        'gov-budget-after-spend',
        'After total spend',
        `${afterTotalSpend < 0 ? '-' : ''}${formatCompactAdaFromLovelace(Math.abs(afterTotalSpend), { fixedFractionDigits: 2 })}`,
        afterTotalSpend < 0,
        getBudgetAmountTone(afterTotalSpend)
    );
}

function setBudgetBarItem(id, label, amount, isNegative = false, amountTone = '') {
    const element = document.getElementById(id);
    if (!element) return;

    element.textContent = '';
    element.classList.toggle('is-negative', isNegative);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'governance-budget-label';
    labelSpan.textContent = label;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'governance-budget-amount';
    if (amountTone) amountSpan.classList.add(`is-${amountTone}`);
    amountSpan.textContent = amount;

    element.appendChild(labelSpan);
    element.appendChild(amountSpan);
}

function getBudgetAmountTone(value) {
    const ratio = Number(value) / TREASURY_NET_CHANGE_LIMIT_LOVELACE;
    if (!Number.isFinite(ratio) || ratio < 0.25) return 'red';
    if (ratio < 0.5) return 'orange';
    return 'green';
}

function getTreasuryBudgetUsedThisYear() {
    const proposals = Array.isArray(governanceState?.proposals)
        ? getGovernanceProposalsFromDashboardPayload(governanceState)
        : [];
    const yearEndEpoch = TREASURY_BUDGET_YEAR_START_EPOCH + TREASURY_BUDGET_YEAR_EPOCHS;

    return proposals.reduce((sum, proposal) => {
        if (proposal?.proposal_type !== 'TreasuryWithdrawals') return sum;
        if (getGovernanceStatus(proposal) !== 'approved') return sum;

        const proposedEpoch = Number(proposal?.proposed_epoch);
        if (!Number.isFinite(proposedEpoch)) return sum;
        if (proposedEpoch < TREASURY_BUDGET_YEAR_START_EPOCH || proposedEpoch >= yearEndEpoch) return sum;

        return sum + getProposalTotalAskLovelace(proposal);
    }, 0);
}

function getActiveTreasuryProposalAskTotal() {
    const proposals = Array.isArray(governanceState?.proposals)
        ? getGovernanceProposalsFromDashboardPayload(governanceState)
        : [];

    return proposals.reduce((sum, proposal) => {
        if (proposal?.proposal_type !== 'TreasuryWithdrawals') return sum;
        if (getGovernanceStatus(proposal) !== 'active') return sum;
        return sum + getProposalTotalAskLovelace(proposal);
    }, 0);
}

function getActiveGovernanceCardMetadata(proposal) {
    const items = [];
    const totalAsk = getProposalTotalAskLovelace(proposal);
    if (Number.isFinite(totalAsk) && totalAsk > 0) {
        items.push({
            label: 'Total ask',
            value: formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })
        });
    }

    const netChangeLimit = getProposalNetChangeLimit(proposal);
    if (netChangeLimit) {
        items.push({
            label: 'Net change limit',
            value: netChangeLimit
        });
    }

    return items;
}

function getProposalTotalAskLovelace(proposal) {
    const withdrawalAmounts = Array.isArray(proposal?.withdrawal)
        ? proposal.withdrawal
            .map(entry => Number(entry?.amount))
            .filter(Number.isFinite)
        : [];
    if (withdrawalAmounts.length) {
        return withdrawalAmounts.reduce((sum, value) => sum + value, 0);
    }

    const rewardValues = proposal?.meta_json?.body?.onChain?.gov_action?.rewards;
    if (Array.isArray(rewardValues) && rewardValues.length) {
        return rewardValues
            .map(entry => Number(entry?.value))
            .filter(Number.isFinite)
            .reduce((sum, value) => sum + value, 0);
    }

    const contents = proposal?.proposal_description?.contents;
    if (Array.isArray(contents)) {
        let total = 0;
        collectNumericWithdrawalAmounts(contents, value => {
            total += value;
        });
        if (total > 0) return total;
    }

    return 0;
}

function collectNumericWithdrawalAmounts(value, onAmount) {
    if (Array.isArray(value)) {
        value.forEach(entry => collectNumericWithdrawalAmounts(entry, onAmount));
        return;
    }

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        onAmount(value);
        return;
    }

    if (!value || typeof value !== 'object') return;

    if (value.amount !== undefined) {
        const amount = Number(value.amount);
        if (Number.isFinite(amount) && amount > 0) onAmount(amount);
    }
}

function getProposalNetChangeLimit(proposal) {
    const rawValue = findValueByNormalizedKey(proposal?.param_proposal, 'netchangelimit')
        ?? findValueByNormalizedKey(proposal?.meta_json?.body?.onChain, 'netchangelimit')
        ?? findValueByNormalizedKey(proposal?.proposal_description, 'netchangelimit')
        ?? findValueByNormalizedKey(proposal?.meta_json, 'netchangelimit');

    return formatGovernanceMetaValue(rawValue);
}

function findValueByNormalizedKey(value, targetKey) {
    if (!value || typeof value !== 'object') return null;

    if (Array.isArray(value)) {
        for (const entry of value) {
            const match = findValueByNormalizedKey(entry, targetKey);
            if (match !== null && match !== undefined) return match;
        }
        return null;
    }

    for (const [key, entryValue] of Object.entries(value)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedKey === targetKey) return entryValue;
        if (entryValue && typeof entryValue === 'object') {
            const nestedMatch = findValueByNormalizedKey(entryValue, targetKey);
            if (nestedMatch !== null && nestedMatch !== undefined) return nestedMatch;
        }
    }

    return null;
}

function formatGovernanceMetaValue(value) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Number.isInteger(value)
            ? value.toLocaleString('en-US')
            : value.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
    if (typeof value === 'string') return value.trim();
    return '';
}

function openGovernanceOverlay(proposal) {
    closeGovernanceOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'governance-overlay';
    overlay.id = 'governance-overlay';
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeGovernanceOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'governance-dialog-title');

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close governance action');
    close.textContent = 'Close';
    close.addEventListener('click', closeGovernanceOverlay);

    const type = document.createElement('span');
    type.className = 'governance-type';
    type.textContent = formatProposalType(proposal.proposal_type);

    const title = document.createElement('h2');
    title.id = 'governance-dialog-title';
    title.textContent = getProposalTitle(proposal);

    const meta = document.createElement('p');
    meta.className = 'small-text';
    meta.textContent = getProposalMeta(proposal);

    const content = document.createElement('div');
    content.className = 'governance-detail-content';
    const voteDetailsContainer = document.createElement('div');
    voteDetailsContainer.className = 'governance-vote-details';
    voteDetailsContainer.dataset.proposalId = proposal.proposal_id;
    addVoteDetailsState(voteDetailsContainer, 'Loading vote details...');
    content.appendChild(voteDetailsContainer);

    const embeddedImages = extractGovernanceImageCandidates(proposal);

    addDetailRow(content, 'Action ID', proposal.proposal_id);
    addDetailRow(content, 'Transaction', proposal.proposal_tx_hash);

    const body = proposal.meta_json?.body || proposal.meta_json || {};
    addMarkdownDetailSection(content, 'Abstract', body.abstract);
    addMarkdownDetailSection(content, 'Motivation', body.motivation);
    addMarkdownDetailSection(content, 'Rationale', body.rationale);
    addEmbeddedGovernanceImages(content, proposal, embeddedImages);

    dialog.appendChild(close);
    dialog.appendChild(type);
    dialog.appendChild(title);
    dialog.appendChild(meta);
    dialog.appendChild(content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    close.focus();
    document.addEventListener('keydown', handleGovernanceOverlayKeydown);
    loadProposalVoteDetails(proposal, voteDetailsContainer).catch(() => {
        if (!voteDetailsContainer.isConnected) return;
        addVoteDetailsState(voteDetailsContainer, 'Vote details could not be loaded.');
    });
}

function closeGovernanceOverlay() {
    closeDrepVotesOverlay();
    const overlay = document.getElementById('governance-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', handleGovernanceOverlayKeydown);
}

function handleGovernanceOverlayKeydown(event) {
    if (event.key !== 'Escape') return;
    if (document.getElementById('governance-drep-overlay')) {
        closeDrepVotesOverlay();
        return;
    }
    closeGovernanceOverlay();
}

function addDetailRow(container, label, value) {
    if (value === null || value === undefined || value === '') return;
    const cleanValue = cleanGovernanceText(String(value));
    if (!cleanValue) return;

    const row = document.createElement('div');
    row.className = 'governance-detail-row';

    const key = document.createElement('strong');
    key.textContent = label;

    const text = document.createElement('span');
    appendRichText(text, cleanValue);

    row.appendChild(key);
    row.appendChild(text);
    container.appendChild(row);
}

function addMarkdownDetailSection(container, label, value) {
    if (value === null || value === undefined || value === '') return;
    const cleanValue = sanitizeGovernanceMarkdown(cleanGovernanceText(String(value)));
    if (!cleanValue) return;

    const section = document.createElement('section');
    section.className = 'governance-markdown-section';

    const heading = document.createElement('strong');
    heading.textContent = label;

    const body = document.createElement('div');
    body.className = 'governance-markdown';
    renderMarkdown(body, cleanValue);

    section.appendChild(heading);
    section.appendChild(body);
    container.appendChild(section);
}

function addEmbeddedGovernanceImages(container, proposal, candidates = extractGovernanceImageCandidates(proposal)) {
    if (!candidates.length) return;

    const section = document.createElement('section');
    section.className = 'governance-markdown-section';

    const heading = document.createElement('strong');
    heading.textContent = candidates.length === 1 ? 'Image' : 'Images';
    section.appendChild(heading);

    candidates.forEach(candidate => {
        const imageLink = document.createElement('a');
        imageLink.href = candidate.src;
        imageLink.target = '_blank';
        imageLink.rel = 'noopener noreferrer';

        const image = document.createElement('img');
        image.className = 'governance-detail-image';
        image.src = candidate.src;
        image.alt = candidate.alt || 'Governance action image';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';

        imageLink.appendChild(image);
        section.appendChild(imageLink);
    });

    container.appendChild(section);
}

function extractGovernanceImageCandidates(proposal) {
    const results = [];
    const seen = new Set();
    const sources = [
        proposal?.meta_json,
        proposal?.meta_json?.body,
        proposal?.proposal_description
    ];

    sources.forEach(source => collectGovernanceImageCandidates(source, results, seen));
    return results;
}

function collectGovernanceImageCandidates(value, results, seen, keyHint = '') {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
        extractGovernanceImageCandidatesFromString(value, keyHint).forEach(candidate => {
            if (!seen.has(candidate.src)) {
                seen.add(candidate.src);
                results.push(candidate);
            }
        });
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(entry => collectGovernanceImageCandidates(entry, results, seen, keyHint));
        return;
    }

    if (typeof value !== 'object') return;

    Object.entries(value).forEach(([key, entry]) => {
        const nestedHint = [keyHint, key].filter(Boolean).join('.');
        collectGovernanceImageCandidates(entry, results, seen, nestedHint);
    });
}

function extractGovernanceImageCandidatesFromString(value, keyHint = '') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    const candidates = [];
    const seen = new Set();
    const addCandidate = candidate => {
        if (!candidate || seen.has(candidate.src)) return;
        seen.add(candidate.src);
        candidates.push(candidate);
    };

    const directCandidate = normalizeGovernanceImageCandidate(trimmed, keyHint);
    if (directCandidate) addCandidate(directCandidate);

    const markdownMatches = trimmed.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g);
    for (const match of markdownMatches) {
        const src = normalizeImageSource(match[2], keyHint || match[1]);
        if (src) addCandidate({ src, alt: match[1] || 'Governance action image' });
    }

    const htmlMatches = trimmed.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*?(?:alt=["']([^"']*)["'])?[^>]*>/gi);
    for (const match of htmlMatches) {
        const src = normalizeImageSource(match[1], keyHint || match[2]);
        if (src) addCandidate({ src, alt: match[2] || 'Governance action image' });
    }

    const dataImageMatches = trimmed.matchAll(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+/gi);
    for (const match of dataImageMatches) {
        const src = normalizeImageSource(match[0], keyHint);
        if (src) addCandidate({ src, alt: 'Governance action image' });
    }

    const urlMatches = trimmed.matchAll(/(?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+/gi);
    for (const match of urlMatches) {
        const src = normalizeImageSource(match[0], keyHint);
        if (src) addCandidate({ src, alt: 'Governance action image' });
    }

    const parsedJson = parseEmbeddedJson(trimmed);
    if (parsedJson) {
        collectGovernanceImageCandidates(parsedJson, candidates, seen, keyHint);
    }

    return candidates;
}

function normalizeGovernanceImageCandidate(value, keyHint = '') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const markdownMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (markdownMatch) {
        const src = normalizeImageSource(markdownMatch[2], keyHint);
        return src ? { src, alt: markdownMatch[1] || 'Governance action image' } : null;
    }

    const src = normalizeImageSource(trimmed, keyHint);
    return src ? { src, alt: 'Governance action image' } : null;
}

function normalizeImageSource(value, keyHint = '') {
    if (!value) return '';

    const normalizedKeyHint = String(keyHint).toLowerCase();

    if (value.startsWith('data:image/')) {
        return value;
    }

    if (/^<svg[\s>]/i.test(value)) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
    }

    const normalizedUrl = normalizeMetadataUrl(value);
    if (/^(https?:\/\/|ipfs:\/\/)/i.test(value)) {
        return isRenderableImageUrl(normalizedUrl, normalizedKeyHint) ? normalizedUrl : '';
    }

    if (looksLikeBase64Image(value, normalizedKeyHint)) {
        return `data:image/png;base64,${value.replace(/\s+/g, '')}`;
    }

    return '';
}

function looksLikeBase64Image(value, keyHint = '') {
    const compact = value.replace(/\s+/g, '');
    if (compact.length < 120) return false;
    if (!/^[A-Za-z0-9+/=]+$/.test(compact)) return false;

    const imageHintPattern = /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i;
    if (imageHintPattern.test(keyHint)) return true;

    return /^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR|PHN2Zy)/.test(compact);
}

function parseEmbeddedJson(value) {
    if (!value || value.length < 2) return null;

    const startsLikeJson = (
        (value.startsWith('{') && value.endsWith('}'))
        || (value.startsWith('[') && value.endsWith(']'))
    );
    if (!startsLikeJson) return null;

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function addVoteDetailsState(container, message) {
    container.textContent = '';
    const text = document.createElement('p');
    text.className = 'small-text';
    text.textContent = message;
    container.appendChild(text);
}

async function loadProposalVoteDetails(proposal, container) {
    if (!proposal?.proposal_id || !container?.isConnected) return;

    const payload = await fetchProposalVotesPayload(proposal.proposal_id);
    if (!container.isConnected || container.dataset.proposalId !== proposal.proposal_id) return;

    const detailProposal = mergeProposalVoteDetails(proposal, payload);
    updateGovernanceCardVotes(proposal.proposal_id, detailProposal);
    renderVoteDetailsPanel(container, detailProposal, payload);

    if (!container.childNodes.length) {
        addVoteDetailsState(container, 'No vote details found for this action.');
    }
}

async function fetchProposalVotesPayload(proposalId) {
    if (proposalVotesCache.has(proposalId)) return proposalVotesCache.get(proposalId);

    const request = fetchJson(getProposalVotesApiUrl(proposalId));
    proposalVotesCache.set(proposalId, request);

    try {
        return await request;
    } catch (error) {
        proposalVotesCache.delete(proposalId);
        throw error;
    }
}

function mergeProposalVoteDetails(proposal, payload) {
    const detail = extractProposalVoteDetail(payload, proposal.proposal_id);
    if (!detail && !payload?.votes?.dreps) return proposal;

    const detailSummary = normalizeVotingSummary(
        detail?.voting_summary
        || detail?.vote_summary
        || detail?.summary
        || detail?.vote_percentages
        || detail?.votePercentages
        || detail
    );
    const voteListSummary = getVotingSummaryFromProposalVotesPayload(payload);
    const summary = hasStructuredVoteSummary(detailSummary)
        ? detailSummary
        : proposal.voteSummary || voteListSummary;

    const nextProposal = {
        ...proposal,
        hasLiveVotePercentages: Boolean(payload?.votes?.dreps),
        voteSummary: hasStructuredVoteSummary(summary) ? summary : proposal.voteSummary
    };
    nextProposal.voteDisplay = getVoteDisplayFromProposalSummary(nextProposal.voteSummary, nextProposal) || proposal.voteDisplay;
    nextProposal.votePercentages = nextProposal.voteDisplay?.percentages || proposal.votePercentages;
    return nextProposal;
}

function updateGovernanceCardVotes(proposalId, proposal) {
    if (!proposalId || !proposal?.votePercentages) return;

    const card = document.querySelector(`.governance-card[data-proposal-id="${CSS.escape(proposalId)}"]`);
    const votes = card?.querySelector('.governance-votes');
    if (!votes) return;

    votes.className = `governance-votes ${getVoteColorClass(proposal.votePercentages, proposal.voteDisplay?.source)}`;
    votes.textContent = formatVotePercentages(proposal.votePercentages, proposal.voteDisplay?.label, proposal.voteSummary, proposal.voteDisplay?.source);
}

function getVotingSummaryFromProposalVotesPayload(payload) {
    const dreps = payload?.votes?.dreps;
    if (!dreps || typeof dreps !== 'object') return null;

    const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
        ? payload.drep_info
        : {};
    const getBucket = key => Array.isArray(dreps[key]) ? dreps[key] : [];
    const getVotePower = vote => {
        const info = drepInfo[vote?.voter_id]
            || drepInfo[vote?.drep_id]
            || drepInfo[vote?.voter_hex]
            || drepInfo[vote?.hex]
            || null;
        const value = vote?.amount
            ?? vote?.vote_power
            ?? vote?.voting_power
            ?? vote?.stake
            ?? vote?.lovelace
            ?? info?.amount
            ?? info?.vote_power
            ?? info?.voting_power
            ?? info?.stake
            ?? info?.lovelace;
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : 0;
    };

    const yesVotes = getBucket('yes');
    const noVotes = getBucket('no');
    const abstainVotes = getBucket('abstain');
    const yesPower = yesVotes.reduce((sum, vote) => sum + getVotePower(vote), 0);
    const noPower = noVotes.reduce((sum, vote) => sum + getVotePower(vote), 0);
    const abstainPower = abstainVotes.reduce((sum, vote) => sum + getVotePower(vote), 0);
    const yesNoPower = yesPower + noPower;
    const percentageBase = yesNoPower;

    return {
        drep_yes_votes_cast: yesVotes.length,
        drep_no_votes_cast: noVotes.length,
        drep_abstain_votes_cast: abstainVotes.length,
        drep_active_yes_vote_power: yesPower,
        drep_yes_vote_power: yesPower,
        drep_active_no_vote_power: noPower,
        drep_no_vote_power: noPower,
        drep_active_abstain_vote_power: abstainPower,
        drep_yes_pct: percentageBase > 0 ? (yesPower / percentageBase) * 100 : 0,
        drep_no_pct: percentageBase > 0 ? (noPower / percentageBase) * 100 : 0,
        drep_abstain_pct: 0
    };
}

function extractProposalVoteDetail(payload, proposalId) {
    if (!payload) return null;

    if (Array.isArray(payload)) {
        return payload.find(item => matchesProposalId(item, proposalId)) || payload[0] || null;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data.find(item => matchesProposalId(item, proposalId)) || payload.data[0] || null;
    }

    if (payload?.proposal || payload?.voting_summary || payload?.vote_summary || payload?.summary) {
        return payload;
    }

    return null;
}

function matchesProposalId(item, proposalId) {
    const itemProposalId = item?.proposal_id
        || item?.proposal?.proposal_id
        || item?.id
        || item?.proposalId;
    return itemProposalId === proposalId;
}

function renderVoteDetailsPanel(container, proposal, payload) {
    container.textContent = '';

    const summary = proposal?.voteSummary;
    const drepBreakdown = getDrepStakeBreakdown(summary);
    const drepVotes = getDrepVotes(payload);

    if (drepBreakdown.length) {
        container.appendChild(createDrepVoteChartSection(drepBreakdown, drepVotes));
    }

    addVoteSummaryRows(container, summary, proposal.voteDisplay?.source);
}

function createDrepVoteChartSection(breakdown, drepVotes) {
    const section = document.createElement('section');
    section.className = 'governance-vote-chart';

    const title = document.createElement('strong');
    title.textContent = 'DRep vote overview';
    section.appendChild(title);

    const layout = document.createElement('div');
    layout.className = 'governance-vote-chart-layout';

    const chart = document.createElement('div');
    chart.className = 'governance-pie-chart';
    const segments = getPieChartSegments(breakdown);
    chart.style.background = buildPieChartGradient(segments);

    const total = breakdown.reduce((sum, item) => sum + item.value, 0);
    const center = document.createElement('div');
    center.className = 'governance-pie-chart-center';
    const centerLabel = document.createElement('span');
    centerLabel.textContent = breakdown.some(item => item.unit === 'votes') ? 'Votes counted' : 'Total voting power';
    const centerValue = document.createElement('strong');
    centerValue.textContent = breakdown.some(item => item.unit === 'votes')
        ? formatInteger(total)
        : formatCompactAdaFromLovelace(total, { fixedFractionDigits: 2 });
    center.append(centerLabel, centerValue);
    chart.appendChild(center);

    segments.forEach(segment => {
        chart.appendChild(createPieAmountLabel(segment));
    });
    layout.appendChild(chart);

    const legend = document.createElement('div');
    legend.className = 'governance-vote-legend';

    breakdown.forEach(item => {
        legend.appendChild(createVoteLegendItem(item, drepVotes));
    });

    layout.appendChild(legend);
    section.appendChild(layout);

    return section;
}

function createVoteLegendItem(item, drepVotes) {
    const interactive = ['no', 'abstain', 'always-abstain', 'always-no-confidence', 'yes'].includes(item.key);
    const element = document.createElement(interactive ? 'button' : 'div');
    element.className = `governance-vote-legend-item${interactive ? ' is-clickable' : ''}`;

    if (interactive) {
        element.type = 'button';
        element.dataset.voteGroup = item.key;
        element.setAttribute('aria-haspopup', 'dialog');
        element.addEventListener('click', () => {
            openDrepVotesOverlay(item, drepVotes);
        });
    }

    const swatch = document.createElement('span');
    swatch.className = 'governance-vote-swatch';
    swatch.style.backgroundColor = item.color;

    const text = document.createElement('span');
    text.className = 'governance-vote-legend-copy';

    const label = document.createElement('strong');
    label.textContent = item.label;

    const value = document.createElement('span');
    value.textContent = formatVoteLegendDetail(item, drepVotes);

    text.appendChild(label);
    text.appendChild(value);
    element.appendChild(swatch);
    element.appendChild(text);
    return element;
}

function formatVoteLegendDetail(item, drepVotes) {
    return [
        Number.isFinite(item.count) ? `${item.count} votes` : null,
        formatCompactAdaFromLovelace(item.displayValue ?? item.value),
        Number.isFinite(item.voteCountPercentage) ? formatPercentage(item.voteCountPercentage) : null,
        Number.isFinite(item.votePowerPercentage) ? formatPercentage(item.votePowerPercentage) : null,
        item.excludedFromPercentage ? 'not counted' : null
    ].filter(Boolean).join(' • ');
}

function renderDrepDetailsPanel(container, item, drepVotes) {
    container.textContent = '';
    container.hidden = false;
    container.dataset.activeGroup = item.key;

    if (item.key === 'always-abstain' || item.key === 'always-no-confidence') {
        const title = document.createElement('strong');
        title.textContent = item.label;

        const message = document.createElement('p');
        message.className = 'small-text';
        message.textContent = 'This API only provides stake totals for this bucket, not individual DRep IDs.';

        container.appendChild(title);
        container.appendChild(message);
        return;
    }

    const votes = drepVotes.filter(vote => String(vote?.vote || '').toLowerCase() === mapBreakdownKeyToVote(item.key));
    renderNoVotesList(container, votes, item.label);
}

function openDrepVotesOverlay(item, drepVotes) {
    closeDrepVotesOverlay();

    const overlay = document.createElement('div');
    overlay.className = 'governance-overlay governance-drep-overlay';
    overlay.id = 'governance-drep-overlay';
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeDrepVotesOverlay();
    });

    const dialog = document.createElement('article');
    dialog.className = 'governance-dialog governance-drep-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'governance-drep-title');

    const close = document.createElement('button');
    close.className = 'governance-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close DRep list');
    close.textContent = 'Close';
    close.addEventListener('click', closeDrepVotesOverlay);

    const title = document.createElement('h3');
    title.id = 'governance-drep-title';
    title.className = 'governance-drep-title';
    title.textContent = item.label;

    const panel = document.createElement('div');
    panel.className = 'governance-no-votes governance-no-votes-expanded';
    renderDrepDetailsPanel(panel, item, drepVotes);

    dialog.appendChild(close);
    dialog.appendChild(title);
    dialog.appendChild(panel);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    close.focus();
}

function closeDrepVotesOverlay() {
    const overlay = document.getElementById('governance-drep-overlay');
    if (overlay) overlay.remove();
}

function hideDrepDetailsPanel(container) {
    container.textContent = '';
    container.hidden = true;
    container.dataset.activeGroup = '';
}

function renderNoVotesList(container, votes, headingLabel = 'DRep votes') {
    const title = document.createElement('strong');
    title.textContent = `${headingLabel} (${votes.length})`;

    const list = document.createElement('div');
    list.className = 'governance-no-votes-list';

    const sortedVotes = [...votes].sort((left, right) => getDrepVotePowerValue(right) - getDrepVotePowerValue(left));

    sortedVotes.forEach(vote => {
        const row = document.createElement('div');
        row.className = 'governance-no-vote-row';
        const normalizedVote = String(vote?.vote || '').toLowerCase();
        if (normalizedVote === 'yes') row.classList.add('is-yes');
        if (normalizedVote === 'no') row.classList.add('is-no');
        if (normalizedVote === 'abstain') row.classList.add('is-abstain');

        const copy = document.createElement('div');
        copy.className = 'governance-no-vote-copy';

        const nameLine = document.createElement('div');
        nameLine.className = 'governance-no-vote-name-line';

        const name = document.createElement('strong');
        name.className = 'governance-no-vote-name';
        name.textContent = getDrepPrimaryDisplayName(vote);

        const power = document.createElement('span');
        power.className = 'governance-no-vote-power';
        power.textContent = getDrepVotePowerLabel(vote);

        nameLine.appendChild(name);
        if (power.textContent) nameLine.appendChild(power);

        const id = document.createElement('span');
        id.className = 'governance-no-vote-id';
        id.textContent = getDrepVoteIdentifier(vote) || 'Unknown DRep';

        copy.appendChild(nameLine);
        copy.appendChild(id);
        row.appendChild(copy);
        list.appendChild(row);

        resolveDrepDisplayName(vote, name).catch(() => {});
    });

    container.appendChild(title);
    container.appendChild(list);
}

function getDrepDisplayName(vote) {
    const resolvedName = vote?.resolvedDrepName
        || vote?.drep_name
        || vote?.drepName
        || vote?.name;
    const identifier = getDrepVoteIdentifier(vote);

    if (resolvedName && identifier) return `${resolvedName} | ${identifier}`;
    return resolvedName || identifier || 'Unknown DRep';
}

function getDrepPrimaryDisplayName(vote) {
    return vote?.resolvedDrepName
        || vote?.drep_name
        || vote?.drepName
        || vote?.name
        || getDrepVoteIdentifier(vote)
        || 'Unknown DRep';
}

async function resolveDrepDisplayName(vote, target) {
    const name = await resolveDrepNameFromApi(vote);
    if (!name || !target?.isConnected) return;

    vote.resolvedDrepName = name;
    target.textContent = getDrepPrimaryDisplayName(vote);
}

function getDrepVoteIdentifier(vote) {
    return vote?.voter_id
        || vote?.voterId
        || vote?.drep_id
        || vote?.drepId
        || vote?.voter_hex
        || vote?.id
        || '';
}

function getDrepVotePowerLabel(vote) {
    const value = getDrepVotePowerValue(vote);
    if (!value) return '';
    return `Voting power: ${formatCompactAdaFromLovelace(value)}`;
}

function getDrepVotePowerValue(vote) {
    const value = vote?.amount
        ?? vote?.vote_power
        ?? vote?.voting_power
        ?? vote?.stake
        ?? vote?.lovelace;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

async function resolveDrepNameFromApi(vote) {
    const directName = vote?.resolvedDrepName || vote?.drep_name || vote?.drepName || vote?.name;
    if (directName) return directName;

    const lookupId = normalizeDrepIdentifier(
        getDrepVoteIdentifier(vote)
    );

    if (lookupId) {
        const detailName = await fetchDrepNameById(lookupId).catch(() => null);
        if (detailName) return detailName;

        const directory = await loadDrepDirectory().catch(() => null);
        const directoryName = directory?.get(lookupId) || directory?.get(shortenDrepIdentifier(lookupId)) || null;
        if (directoryName) return directoryName;
    }

    const metadataUrl = normalizeMetadataUrl(vote?.meta_url || vote?.metaUrl);
    if (!metadataUrl) return null;

    const cacheKey = `${lookupId || metadataUrl}:${metadataUrl}`;
    if (!drepMetadataCache.has(cacheKey)) {
        drepMetadataCache.set(cacheKey, fetchDrepMetadataName(metadataUrl));
    }

    return drepMetadataCache.get(cacheKey).catch(() => null);
}

async function loadDrepDirectory() {
    if (!drepDirectoryPromise) {
        drepDirectoryPromise = fetchDrepDirectory();
    }
    return drepDirectoryPromise;
}

async function fetchDrepDirectory() {
    const [metadataPayload, infoPayload] = await Promise.allSettled([
        fetchJson(getDrepMetadataApiUrl()),
        fetchJson(getDrepInfoApiUrl())
    ]);

    const directory = new Map();
    if (metadataPayload.status === 'fulfilled') {
        addDrepDirectoryEntries(directory, metadataPayload.value);
    }
    if (infoPayload.status === 'fulfilled') {
        addDrepDirectoryEntries(directory, infoPayload.value);
    }

    return directory;
}

async function fetchDrepNameById(drepId) {
    const normalizedId = normalizeDrepIdentifier(drepId);
    if (!normalizedId) return null;

    const cacheKey = `detail:${normalizedId}`;
    if (!drepMetadataCache.has(cacheKey)) {
        drepMetadataCache.set(cacheKey, fetchJson(getDrepDetailApiUrl(normalizedId))
            .then(payload => {
                const entry = Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload;
                return extractDrepNameFromEntry(entry);
            }));
    }

    return drepMetadataCache.get(cacheKey).catch(() => null);
}

function addDrepDirectoryEntries(directory, payload) {
    const entries = unwrapDrepEntries(payload);
    entries.forEach(entry => {
        const name = extractDrepNameFromEntry(entry);
        if (!name) return;

        getDrepEntryIdentifiers(entry).forEach(identifier => {
            directory.set(identifier, name);
            const shortened = shortenDrepIdentifier(identifier);
            if (shortened) directory.set(shortened, name);
        });
    });
}

function unwrapDrepEntries(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.dreps)) return payload.dreps;
    if (Array.isArray(payload?.items)) return payload.items;
    if (payload && typeof payload === 'object') return Object.values(payload).filter(Boolean);
    return [];
}

function extractDrepNameFromEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;

    const authorNames = Array.isArray(entry.authors)
        ? entry.authors.map(author => author?.name).filter(Boolean)
        : [];
    if (authorNames.length) return authorNames[0];

    const metadata = entry.metadata || {};
    const metaJson = entry.meta_json || metadata.meta_json || {};
    const body = entry.body || metadata.body || metaJson.body || {};

    return firstNonEmptyText(
        body.dRepName,
        body.drepName,
        body.givenName,
        body.given_name,
        body.name,
        body.title,
        entry.name,
        entry.title,
        entry.given_name,
        entry.givenName,
        entry.display_name,
        entry.displayName,
        metadata.name,
        metadata.title,
        metadata.givenName,
        metadata.given_name,
        metaJson.name,
        metaJson.title
    );
}

function getDrepEntryIdentifiers(entry) {
    return [
        entry?.voter_id,
        entry?.voterId,
        entry?.voter_hex,
        entry?.drep_id,
        entry?.drepId,
        entry?.id,
        entry?.hex,
        entry?.credential,
        entry?.view,
        entry?.bech32,
        entry?.drep_hash,
        entry?.drepHash,
        entry?.drep?.id,
        entry?.drep?.view,
        entry?.drep?.hex,
        entry?.drep?.bech32,
        entry?.metadata?.voter_id,
        entry?.metadata?.voterId,
        entry?.metadata?.drep_id
    ]
        .map(normalizeDrepIdentifier)
        .filter(Boolean);
}

function normalizeDrepIdentifier(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
}

function shortenDrepIdentifier(value) {
    const normalized = normalizeDrepIdentifier(value);
    if (!normalized) return '';
    return normalized.startsWith('drep1') ? normalized.slice(5) : normalized;
}

async function fetchDrepMetadataName(url) {
    const fetchUrl = getDrepMetadataFetchUrl(url);
    if (!fetchUrl) throw new Error('Unsupported DRep metadata URL');

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    return extractDrepMetadataName(payload);
}

function extractDrepMetadataName(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const authorNames = Array.isArray(payload.authors)
        ? payload.authors.map(author => author?.name).filter(Boolean)
        : [];
    if (authorNames.length) return authorNames[0];

    const body = payload.body || {};
    return firstNonEmptyText(
        body.dRepName,
        body.drepName,
        body.givenName,
        body.given_name,
        body.name,
        body.title,
        payload.name,
        payload.title,
        payload.givenName,
        payload.given_name
    );
}

function firstNonEmptyText(...values) {
    for (const value of values) {
        const text = extractTextValue(value);
        if (text) return text;
    }
    return null;
}

function extractTextValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value !== 'object') return String(value).trim();

    return (
        extractTextValue(value['@value'])
        || extractTextValue(value.value)
        || extractTextValue(value.text)
        || extractTextValue(value.label)
        || extractTextValue(value.name)
        || ''
    );
}

function normalizeMetadataUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${trimmed.slice('ipfs://'.length)}`;
    }

    return trimmed;
}

function getDrepMetadataApiUrl() {
    if (shouldUseLocalDashboardProxy()) {
        return `${LOCAL_DREP_DIRECTORY_PROXY_PATH}?type=metadata`;
    }
    return DREP_METADATA_API_URL;
}

function getDrepInfoApiUrl() {
    if (shouldUseLocalDashboardProxy()) {
        return `${LOCAL_DREP_DIRECTORY_PROXY_PATH}?type=info`;
    }
    return DREP_INFO_API_URL;
}

function getDrepDetailApiUrl(drepId) {
    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ drepId });
        return `${LOCAL_DREP_DETAIL_PROXY_PATH}?${params.toString()}`;
    }
    return `${DREP_DETAIL_API_BASE_URL}/${encodeURIComponent(drepId)}`;
}

function getDrepMetadataFetchUrl(url) {
    const normalizedUrl = normalizeMetadataUrl(url);
    if (!isAllowedBrowserMetadataUrl(normalizedUrl)) return '';

    if (shouldUseLocalDashboardProxy()) {
        const params = new URLSearchParams({ url: normalizedUrl });
        return `${LOCAL_METADATA_PROXY_PATH}?${params.toString()}`;
    }
    return normalizedUrl;
}

function isAllowedBrowserMetadataUrl(url) {
    if (!url) return false;

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        return parsed.hostname === 'ipfs.io';
    } catch {
        return false;
    }
}

function mapBreakdownKeyToVote(key) {
    if (key === 'yes') return 'yes';
    if (key === 'no') return 'no';
    if (key === 'abstain') return 'abstain';
    return null;
}

function getDrepStakeBreakdown(summary) {
    if (!summary) return [];

    const yesVotePower = pickFirstNumber(
        summary.drep_yes_vote_power,
        summary.drep_active_yes_vote_power
    ) ?? 0;
    const noVotePower = pickFirstNumber(
        summary.drep_no_vote_power,
        summary.drep_active_no_vote_power
    ) ?? 0;
    const abstainVotePower = Number(summary.drep_active_abstain_vote_power) || 0;
    const yesVoteCount = Number(summary.drep_yes_votes_cast) || 0;
    const noVoteCount = Number(summary.drep_no_votes_cast) || 0;
    const abstainVoteCount = Number(summary.drep_abstain_votes_cast) || 0;

    const items = [
        {
            key: 'yes',
            label: 'Yes',
            value: yesVotePower,
            count: yesVoteCount,
            color: '#34d399'
        },
        {
            key: 'no',
            label: 'No / Not voted',
            value: noVotePower,
            count: noVoteCount,
            color: '#f87171'
        },
        {
            key: 'abstain',
            label: 'Abstain ADA',
            value: 0,
            displayValue: abstainVotePower,
            count: abstainVoteCount,
            color: '#60a5fa',
            excludedFromPercentage: true
        }
    ];

    const representedPower = items.reduce((sum, item) => sum + item.value, 0);
    return items
        .filter(item => item.value > 0 || item.excludedFromPercentage && (item.count > 0 || Number(item.displayValue) > 0))
        .map(item => ({
            ...item,
            votePowerPercentage: representedPower > 0
                ? (item.value / representedPower) * 100
                : 0
        }));
}

function getPieChartSegments(items) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (!total) return [];

    let start = 0;
    return items.map(item => {
        const span = (item.value / total) * 360;
        const end = start + span;
        const segment = {
            ...item,
            start,
            end,
            mid: start + span / 2
        };
        start = end;
        return segment;
    });
}

function buildPieChartGradient(items) {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (!total) return 'conic-gradient(#334155 0deg 360deg)';

    return `conic-gradient(${items.map(item => `${item.color} ${item.start}deg ${item.end}deg`).join(', ')})`;
}

function getDrepVotes(payload) {
    const dreps = payload?.votes?.dreps;
    if (Array.isArray(dreps)) return dreps;
    if (!dreps || typeof dreps !== 'object') return [];

    const drepInfo = payload?.drep_info && typeof payload.drep_info === 'object'
        ? payload.drep_info
        : {};

    return ['yes', 'no', 'abstain', 'unknown'].flatMap(key => {
        const bucket = dreps[key];
        if (!Array.isArray(bucket)) return [];

        return bucket.map(vote => {
            const info = drepInfo[vote?.voter_id]
                || drepInfo[vote?.drep_id]
                || drepInfo[vote?.voter_hex]
                || drepInfo[vote?.hex]
                || null;

            if (!info) return vote;

            return {
                ...info,
                ...vote,
                amount: vote?.amount ?? info?.amount ?? '',
                drep_id: vote?.drep_id || info?.drep_id || vote?.voter_id || '',
                voter_hex: vote?.voter_hex || info?.hex || ''
            };
        });
    });
}

function getDrepVoteCountPercentage(key, drepVotes) {
    const voteKey = mapBreakdownKeyToVote(key);
    if (!voteKey) return null;

    const totalVotes = drepVotes.length;
    if (!totalVotes) return 0;

    const matchingVotes = drepVotes.filter(vote => String(vote?.vote || '').toLowerCase() === voteKey).length;
    return (matchingVotes / totalVotes) * 100;
}

function createPieAmountLabel(segment) {
    const label = document.createElement('span');
    label.className = 'governance-pie-label';
    label.textContent = segment.unit === 'votes'
        ? formatInteger(segment.value)
        : formatCompactAdaFromLovelace(segment.value);

    const radians = ((segment.mid - 90) * Math.PI) / 180;
    const radius = segment.end - segment.start < 18 ? 57 : 48;
    const x = 50 + (Math.cos(radians) * radius);
    const y = 50 + (Math.sin(radians) * radius);

    label.style.left = `${x}%`;
    label.style.top = `${y}%`;
    return label;
}

function addVoteSummaryRows(container, summary, source) {
    if (!summary) return;

    if (source === 'pool') {
        addDetailRow(container, 'SPO yes votes', summary.pool_yes_votes_cast);
        addDetailRow(container, 'SPO no votes', summary.pool_no_votes_cast);
        addDetailRow(container, 'SPO abstain votes', summary.pool_abstain_votes_cast);
        return;
    }
}

function cleanGovernanceText(text) {
    return text
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function sanitizeGovernanceMarkdown(text) {
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return true;

            if (/^\[[^\]]+\]:\s*<?data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return false;
            if (/^<?data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed)) return false;
            if (/^!\[[^\]]*\]\(data:image\/[a-z0-9.+-]+;base64,[^)]+\)$/i.test(trimmed)) return false;

            return true;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function appendRichText(container, text) {
    const urlPattern = /((?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+)/g;
    let lastIndex = 0;

    text.replace(urlPattern, (url, _match, offset) => {
        if (offset > lastIndex) {
            container.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
        }

        const cleanUrl = url.replace(/[.,;:!?]+$/, '');
        const trailing = url.slice(cleanUrl.length);

        const imageSrc = normalizeImageSource(cleanUrl);
        if (imageSrc) {
            const imageLink = document.createElement('a');
            imageLink.href = imageSrc;
            imageLink.target = '_blank';
            imageLink.rel = 'noopener noreferrer';

            const image = document.createElement('img');
            image.className = 'governance-detail-image';
            image.src = imageSrc;
            image.alt = 'Governance action image';
            image.loading = 'lazy';
            image.referrerPolicy = 'no-referrer';

            imageLink.appendChild(image);
            container.appendChild(imageLink);
        } else {
            const link = document.createElement('a');
            link.href = cleanUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.referrerPolicy = 'no-referrer';
            link.textContent = cleanUrl;
            container.appendChild(link);
        }

        if (trailing) {
            container.appendChild(document.createTextNode(trailing));
        }

        lastIndex = offset + url.length;
        return url;
    });

    if (lastIndex < text.length) {
        container.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
}

function renderMarkdown(container, markdown) {
    const lines = cleanGovernanceText(markdown).replace(/\r\n?/g, '\n').split('\n');
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];

        if (!line.trim()) {
            index += 1;
            continue;
        }

        if (line.trim().startsWith('```')) {
            const language = line.trim().slice(3).trim();
            index += 1;
            const codeLines = [];
            while (index < lines.length && !lines[index].trim().startsWith('```')) {
                codeLines.push(lines[index]);
                index += 1;
            }
            if (index < lines.length) index += 1;

            const pre = document.createElement('pre');
            pre.className = 'governance-markdown-code';
            if (language) pre.dataset.language = language;
            pre.textContent = codeLines.join('\n');
            container.appendChild(pre);
            continue;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = Math.min(6, headingMatch[1].length + 1);
            const heading = document.createElement(`h${level}`);
            appendMarkdownInline(heading, headingMatch[2].trim());
            container.appendChild(heading);
            index += 1;
            continue;
        }

        if (isMarkdownTable(lines, index)) {
            const { element, nextIndex } = renderMarkdownTable(lines, index);
            container.appendChild(element);
            index = nextIndex;
            continue;
        }

        if (/^>\s?/.test(line)) {
            const quoteLines = [];
            while (index < lines.length && /^>\s?/.test(lines[index])) {
                quoteLines.push(lines[index].replace(/^>\s?/, ''));
                index += 1;
            }

            const blockquote = document.createElement('blockquote');
            renderMarkdown(blockquote, quoteLines.join('\n'));
            container.appendChild(blockquote);
            continue;
        }

        if (/^\s*([-*+])\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
            const { element, nextIndex } = renderMarkdownList(lines, index);
            container.appendChild(element);
            index = nextIndex;
            continue;
        }

        const paragraphLines = [];
        while (index < lines.length) {
            const current = lines[index];
            if (!current.trim()) break;
            if (current.trim().startsWith('```')) break;
            if (/^(#{1,6})\s+/.test(current)) break;
            if (/^>\s?/.test(current)) break;
            if (/^\s*([-*+])\s+/.test(current) || /^\s*\d+\.\s+/.test(current)) break;
            if (isMarkdownTable(lines, index)) break;
            paragraphLines.push(current.trim());
            index += 1;
        }

        const paragraph = document.createElement('p');
        appendMarkdownInline(paragraph, paragraphLines.join(' '));
        container.appendChild(paragraph);
    }
}

function renderMarkdownList(lines, startIndex) {
    const ordered = /^\s*\d+\.\s+/.test(lines[startIndex]);
    const list = document.createElement(ordered ? 'ol' : 'ul');
    let index = startIndex;

    while (index < lines.length) {
        const line = lines[index];
        if (ordered && !/^\s*\d+\.\s+/.test(line)) break;
        if (!ordered && !/^\s*[-*+]\s+/.test(line)) break;

        const item = document.createElement('li');
        const text = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '');
        appendMarkdownInline(item, text);
        list.appendChild(item);
        index += 1;
    }

    return { element: list, nextIndex: index };
}

function isMarkdownTable(lines, index) {
    if (index + 1 >= lines.length) return false;
    const header = lines[index];
    const separator = lines[index + 1];
    return header.includes('|') && /^[\s|:-]+$/.test(separator.trim()) && separator.includes('-');
}

function renderMarkdownTable(lines, startIndex) {
    const table = document.createElement('table');
    table.className = 'governance-markdown-table';

    const headerCells = splitMarkdownTableRow(lines[startIndex]);
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headerCells.forEach(cellText => {
        const th = document.createElement('th');
        appendMarkdownInline(th, cellText);
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let index = startIndex + 2;
    while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        const bodyRow = document.createElement('tr');
        splitMarkdownTableRow(lines[index]).forEach(cellText => {
            const td = document.createElement('td');
            appendMarkdownInline(td, cellText);
            bodyRow.appendChild(td);
        });
        tbody.appendChild(bodyRow);
        index += 1;
    }

    table.appendChild(tbody);
    return { element: table, nextIndex: index };
}

function splitMarkdownTableRow(row) {
    return row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(cell => cell.trim());
}

function appendMarkdownInline(container, text) {
    const tokens = tokenizeMarkdownInline(text);
    tokens.forEach(token => appendMarkdownToken(container, token));
}

function tokenizeMarkdownInline(text) {
    const tokens = [];
    let index = 0;

    while (index < text.length) {
        const remaining = text.slice(index);

        let match = remaining.match(/^!\[([^\]]*)\]\(([^)\s]+)\)/);
        if (match) {
            tokens.push({ type: 'image', alt: match[1], src: match[2] });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+|ipfs:\/\/[^)\s]+)\)/);
        if (match) {
            tokens.push({ type: 'link', label: match[1], href: match[2] });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^`([^`]+)`/);
        if (match) {
            tokens.push({ type: 'code', text: match[1] });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^\*\*([^*]+)\*\*/);
        if (match) {
            tokens.push({ type: 'strong', children: tokenizeMarkdownInline(match[1]) });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^\*([^*]+)\*/);
        if (match) {
            tokens.push({ type: 'em', children: tokenizeMarkdownInline(match[1]) });
            index += match[0].length;
            continue;
        }

        match = remaining.match(/^((?:https?:\/\/|ipfs:\/\/)[^\s<>"')\]]+)/);
        if (match) {
            tokens.push({ type: 'link', label: match[1], href: match[1] });
            index += match[0].length;
            continue;
        }

        const nextSpecial = remaining.search(/(!?\[|`|\*\*|\*|https?:\/\/|ipfs:\/\/)/);
        if (nextSpecial === -1) {
            tokens.push({ type: 'text', text: remaining });
            break;
        }
        if (nextSpecial > 0) {
            tokens.push({ type: 'text', text: remaining.slice(0, nextSpecial) });
            index += nextSpecial;
            continue;
        }

        tokens.push({ type: 'text', text: remaining[0] });
        index += 1;
    }

    return tokens;
}

function appendMarkdownToken(container, token) {
    if (token.type === 'text') {
        container.appendChild(document.createTextNode(token.text));
        return;
    }

    if (token.type === 'code') {
        const code = document.createElement('code');
        code.textContent = token.text;
        container.appendChild(code);
        return;
    }

    if (token.type === 'link') {
        const link = document.createElement('a');
        link.href = normalizeMetadataUrl(token.href);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.referrerPolicy = 'no-referrer';
        link.textContent = token.label;
        container.appendChild(link);
        return;
    }

    if (token.type === 'image') {
        const imageSrc = normalizeImageSource(token.src, token.alt);
        if (!imageSrc) {
            container.appendChild(document.createTextNode(token.alt || token.src));
            return;
        }

        const imageLink = document.createElement('a');
        imageLink.href = imageSrc;
        imageLink.target = '_blank';
        imageLink.rel = 'noopener noreferrer';

        const image = document.createElement('img');
        image.className = 'governance-detail-image';
        image.src = imageSrc;
        image.alt = token.alt || 'Governance action image';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';

        imageLink.appendChild(image);
        container.appendChild(imageLink);
        return;
    }

    const element = document.createElement(token.type === 'strong' ? 'strong' : 'em');
    token.children.forEach(child => appendMarkdownToken(element, child));
    container.appendChild(element);
}

function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function isRenderableImageUrl(url, keyHint = '') {
    if (isImageUrl(url)) return true;
    return /(image|img|logo|icon|picture|photo|banner|thumbnail|media|qr|svg)/i.test(keyHint);
}

function getProposalTitle(proposal) {
    return proposal.meta_json?.body?.title
        || proposal.meta_json?.title
        || `${formatProposalType(proposal.proposal_type)} governance action`;
}

function getProposalMeta(proposal) {
    const parts = [`Epoch ${proposal.proposed_epoch}`];
    if (proposal.expiration !== null) parts.push(`expires ${proposal.expiration}`);
    if (proposal.enacted_epoch !== null) parts.push(`enacted ${proposal.enacted_epoch}`);
    if (proposal.ratified_epoch !== null) parts.push(`ratified ${proposal.ratified_epoch}`);
    if (proposal.expired_epoch !== null) parts.push(`expired ${proposal.expired_epoch}`);
    if (proposal.dropped_epoch !== null) parts.push(`dropped ${proposal.dropped_epoch}`);
    return parts.join(' / ');
}

function getExpirationText(proposal) {
    if (proposal.expired_epoch !== null) return `Expired epoch ${proposal.expired_epoch}`;
    if (proposal.dropped_epoch !== null) return `Dropped epoch ${proposal.dropped_epoch}`;
    if (proposal.expiration !== null) return `Expires epoch ${proposal.expiration}`;
    return 'No expiration data';
}

function getVoteColorClass(percentages, source = 'drep') {
    const yes = Number(percentages?.yes);
    if (!Number.isFinite(yes)) return 'vote-neutral';

    if (source === 'pool') {
        if (yes >= 50) return 'vote-green';
        if (yes >= 25) return 'vote-orange';
        return 'vote-red';
    }

    if (yes >= 67) return 'vote-green';
    if (yes >= 33.5) return 'vote-orange';
    return 'vote-red';
}

function formatVotePercentages(percentages, label = null, summary = null, source = null) {
    if (!percentages) return '';

    const parts = [
        `Yes ${formatPercentage(percentages.yes)}`,
        `No ${formatPercentage(percentages.no)}`
    ];
    const votingPower = formatDrepVotingPower(summary, source);
    if (votingPower) parts.push(votingPower);
    return parts.join(' | ');
}

function formatDrepVotingPower(summary, source) {
    if (source !== 'drep' || !summary) return '';

    const yes = pickFirstNumber(
        summary.drep_yes_vote_power,
        summary.drep_active_yes_vote_power,
        summary.drep_yes_stake
    ) || 0;
    const no = pickFirstNumber(
        summary.drep_no_vote_power,
        summary.drep_active_no_vote_power,
        summary.drep_no_stake
    ) || 0;
    const total = yes + no;
    if (total <= 0) return '';
    return `Voting power ${formatCompactAdaFromLovelace(total)}`;
}

function getGovernanceGroupSignature(proposals) {
    return JSON.stringify(proposals.map(proposal => ({
        proposal_id: proposal.proposal_id,
        status: getGovernanceStatus(proposal),
        expiration: proposal.expiration,
        ratified_epoch: proposal.ratified_epoch,
        enacted_epoch: proposal.enacted_epoch,
        expired_epoch: proposal.expired_epoch,
        dropped_epoch: proposal.dropped_epoch,
        voteDisplay: proposal.voteDisplay,
        votePercentages: proposal.votePercentages
    })));
}

async function updateGovernanceCounts(groups) {
    setText('gov-active-count', getCollectionLength(groups.active));
    setText('gov-approved-count', getCollectionLength(groups.approved));
    setText('gov-rejected-count', getCollectionLength(groups.rejected));
    setText('gov-info-count', getCollectionLength(groups.info));
    setText('gov-active-ask', formatGovernanceAskSummary(groups.active));
    setText('gov-approved-ask', formatGovernanceAskSummary(groups.approved));
    setText('gov-rejected-ask', formatGovernanceAskSummary(groups.rejected));

    try {
        const drepStats = await getDrepStats(groups);
        setText('gov-drep-count', drepStats.count.toLocaleString('en-US'));
        setText('gov-drep-total-power', formatCompactAdaFromLovelace(drepStats.totalPower, { fixedFractionDigits: 2 }).replace(/ ADA$/, ''));
    } catch {
        setText('gov-drep-count', '0');
        setText('gov-drep-total-power', '0');
    }

    updateTreasuryBudgetBar();
}

function formatGovernanceAskSummary(proposals) {
    const totalAsk = Array.isArray(proposals)
        ? proposals.reduce((sum, proposal) => sum + getProposalTotalAskLovelace(proposal), 0)
        : 0;

    if (!totalAsk) return 'Total ask 0';
    return `Total ask ${formatCompactAdaFromLovelace(totalAsk, { fixedFractionDigits: 2 })}`;
}

async function getDrepStats(groups) {
    if (!drepStatsPromise) {
        drepStatsPromise = fetchDrepStats();
    }

    const baseStats = await drepStatsPromise;
    return {
        count: baseStats.count,
        totalPower: baseStats.totalPower
    };
}

async function fetchDrepStats() {
    const payload = await fetchJson(getDrepInfoApiUrl());
    const entries = unwrapDrepEntries(payload);
    const uniqueDreps = new Map();

    entries.forEach(entry => {
        const identifiers = getDrepEntryIdentifiers(entry);
        const primaryIdentifier = identifiers[0];
        if (!primaryIdentifier || uniqueDreps.has(primaryIdentifier)) return;

        uniqueDreps.set(primaryIdentifier, getDrepEntryVotingPower(entry));
    });

    let totalPower = 0;
    uniqueDreps.forEach(value => {
        totalPower += value;
    });

    return {
        count: uniqueDreps.size,
        totalPower
    };
}

function getDrepEntryVotingPower(entry) {
    const value = entry?.amount
        ?? entry?.voting_power
        ?? entry?.vote_power
        ?? entry?.stake
        ?? entry?.lovelace;

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function getCollectionLength(collection) {
    return Array.isArray(collection) ? collection.length : collection.length || 0;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
}

function formatProposalType(type) {
    return String(type || 'Governance')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ');
}

function formatLovelace(value) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return value;
    return `${(lovelace / 1_000_000).toLocaleString('en-US')} ADA`;
}

function formatPercentage(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    const rounded = Math.round(number * 100) / 100;
    return `${rounded.toLocaleString('en-US')}%`;
}

function formatCompactAdaFromLovelace(value, options = {}) {
    const lovelace = Number(value);
    if (!Number.isFinite(lovelace)) return value;

    const ada = lovelace / 1_000_000;
    const absAda = Math.abs(ada);
    const fixedFractionDigits = Number.isInteger(options.fixedFractionDigits) ? options.fixedFractionDigits : null;
    const compactUnits = [
        { value: 1_000_000_000_000, suffix: 'T' },
        { value: 1_000_000_000, suffix: 'B' },
        { value: 1_000_000, suffix: 'M' },
        { value: 1_000, suffix: 'K' }
    ];

    for (const unit of compactUnits) {
        if (absAda >= unit.value) {
            const compactValue = ada / unit.value;
            const digits = fixedFractionDigits ?? (Math.abs(compactValue) >= 100 ? 0 : Math.abs(compactValue) >= 10 ? 1 : 2);
            const formattedValue = fixedFractionDigits === null
                ? compactValue.toFixed(digits).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')
                : compactValue.toFixed(digits);
            return `${formattedValue}${unit.suffix} ADA`;
        }
    }

    return `${ada.toLocaleString('en-US', {
        minimumFractionDigits: fixedFractionDigits ?? 0,
        maximumFractionDigits: fixedFractionDigits ?? 2
    })} ADA`;
}
